import "server-only";

import { acquireAiSlot, with429Backoff } from "@/lib/bookmarks/ai-guard";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/db/schema";
import { getErrorMessage } from "@/lib/error-utils";
import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";
import {
  and,
  asc,
  cosineDistance,
  count,
  desc,
  eq,
  ilike,
  isNotNull,
  isNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

const LOG = "[bookmarks:ask-ai]";

// Same OpenRouter OpenAI-compatible embeddings route as process-core; the
// query vector must come from the same model as bookmarks.embedding (1024d).
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const EMBEDDING_MODEL = "voyageai/voyage-4-lite";

// ============================================================
// Shared filter shape used by the Ask AI query tools
// ============================================================

export interface AskAiFilters {
  /** Preset category, matched against primaryCategory or subTags */
  category?: string;
  /** Custom tag, matched against subTags only */
  tag?: string;
  /** X username, with or without leading @ */
  authorUsername?: string;
  isRead?: boolean;
  /** Keyword matched against tweet text (ILIKE) */
  keyword?: string;
}

export interface SerializedBookmark {
  author: string | null;
  text: string;
  summary: string | null;
  category: string | null;
  tags: string[];
  tweetUrl: string;
}

export function tweetUrlOf(row: {
  tweetId: string;
  authorUsername: string | null;
}): string {
  return row.authorUsername
    ? `https://x.com/${row.authorUsername}/status/${row.tweetId}`
    : `https://x.com/i/web/status/${row.tweetId}`;
}

export function serializeBookmark(row: typeof bookmarks.$inferSelect): SerializedBookmark {
  return {
    author: row.authorUsername
      ? `@${row.authorUsername}${row.authorName ? ` (${row.authorName})` : ""}`
      : row.authorName,
    text: row.text.slice(0, 500),
    summary: row.summary,
    category: row.primaryCategory,
    tags: ((row.subTags as string[] | null) ?? []).slice(0, 5),
    tweetUrl: tweetUrlOf(row),
  };
}

// ============================================================
// Filter -> Drizzle conditions (mirrors actions/bookmarks/list.ts)
// ============================================================

export function buildFilterWhere(userId: string, filters: AskAiFilters): SQL {
  const conditions: SQL[] = [
    eq(bookmarks.userId, userId),
    isNull(bookmarks.deletedAt),
  ];

  if (filters.category) {
    conditions.push(
      or(
        eq(bookmarks.primaryCategory, filters.category),
        sql`${bookmarks.subTags} @> ${JSON.stringify([filters.category])}::jsonb`
      ) as SQL
    );
  }

  if (filters.tag) {
    conditions.push(
      sql`${bookmarks.subTags} @> ${JSON.stringify([filters.tag])}::jsonb`
    );
  }

  if (filters.authorUsername) {
    conditions.push(
      ilike(bookmarks.authorUsername, filters.authorUsername.replace(/^@/, ""))
    );
  }

  if (typeof filters.isRead === "boolean") {
    conditions.push(eq(bookmarks.isRead, filters.isRead));
  }

  if (filters.keyword) {
    conditions.push(ilike(bookmarks.text, `%${filters.keyword}%`));
  }

  return and(...conditions) as SQL;
}

// ============================================================
// Queries backing the tools
// ============================================================

export async function countStats(
  userId: string,
  filters: AskAiFilters
): Promise<{ total: number; byCategory: Record<string, number> }> {
  const rows = await db
    .select({ category: bookmarks.primaryCategory, value: count() })
    .from(bookmarks)
    .where(buildFilterWhere(userId, filters))
    .groupBy(bookmarks.primaryCategory);

  const byCategory: Record<string, number> = {};
  let total = 0;
  for (const row of rows) {
    const n = Number(row.value);
    total += n;
    if (row.category) byCategory[row.category] = n;
  }
  return { total, byCategory };
}

export async function listBookmarks(
  userId: string,
  filters: AskAiFilters,
  sortBy: "newest" | "oldest",
  limit: number
): Promise<SerializedBookmark[]> {
  const rows = await db
    .select()
    .from(bookmarks)
    .where(buildFilterWhere(userId, filters))
    .orderBy(
      sortBy === "oldest" ? asc(bookmarks.syncedAt) : desc(bookmarks.syncedAt)
    )
    .limit(limit);
  return rows.map(serializeBookmark);
}

export async function recentBookmarks(
  userId: string,
  limit: number
): Promise<SerializedBookmark[]> {
  return listBookmarks(userId, {}, "newest", limit);
}

// ============================================================
// Semantic retrieval (RAG) over bookmarks.embedding
// ============================================================

export async function embedQuestion(
  question: string
): Promise<number[] | null> {
  if (!process.env.OPENROUTER_API_KEY) return null;
  try {
    const openrouter = createOpenAI({
      baseURL: OPENROUTER_BASE_URL,
      apiKey: process.env.OPENROUTER_API_KEY,
    });
    const result = await with429Backoff(() =>
      acquireAiSlot().then(() =>
        embed({
          model: openrouter.textEmbeddingModel(EMBEDDING_MODEL),
          value: question,
        })
      )
    );
    return result.embedding;
  } catch (error) {
    console.error(`${LOG} question embedding failed`, getErrorMessage(error));
    return null;
  }
}

/**
 * Top-K by cosine distance (<=> is a distance: smaller = more similar, hence
 * ascending order). Falls back to the most recent bookmarks when the vector
 * index yields nothing (fresh account / embeddings not ready).
 */
export async function vectorSearchWithFallback(
  userId: string,
  vector: number[],
  limit: number
): Promise<SerializedBookmark[]> {
  try {
    const rows = await db
      .select()
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          isNotNull(bookmarks.embedding),
          isNull(bookmarks.deletedAt),
        ),
      )
      .orderBy(cosineDistance(bookmarks.embedding, vector))
      .limit(limit);
    if (rows.length > 0) return rows.map(serializeBookmark);
  } catch (error) {
    console.error(`${LOG} vector search failed`, getErrorMessage(error));
  }
  return recentBookmarks(userId, limit);
}
