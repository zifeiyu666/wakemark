import "server-only";

import {
  BOOKMARK_CATEGORIES,
  type BookmarkCategory,
} from "@/config/bookmark-categories";
import { maybeEnqueueNotionAutoSync } from "@/lib/notion/sync-core";
import { db } from "@/lib/db";
import { bookmarks, type BookmarkStatus } from "@/lib/db/schema";
import { getErrorMessage } from "@/lib/error-utils";
import { hasBookmarkServiceAccess } from "@/lib/payments/subscription";
import { acquireAiSlot, with429Backoff } from "@/lib/bookmarks/ai-guard";
import { extractJson, repairTruncatedJson } from "@/lib/ai/json";
import {
  applyTagDeltas,
  listUserTags,
  tagDeltas,
} from "@/lib/bookmarks/tag-counts";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { embedMany, generateText } from "ai";
import { and, count, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

const LOG = "[bookmarks:process]";

// Tagging/summary runs against OpenRouter directly. DeepSeek V4 Flash is the
// primary: burst-tested it tolerates 10 parallel requests without 429s (qwen
// flash models were removed for constantly hitting upstream 429s). Override
// with BOOKMARK_AI_MODEL; failures cascade through the fallback chain.
const DEFAULT_BOOKMARK_MODEL = "deepseek/deepseek-v4-flash";
const FALLBACK_CHAIN = ["z-ai/glm-5.3-flash", "deepseek/deepseek-v4-flash"];

export { DEFAULT_BOOKMARK_MODEL, FALLBACK_CHAIN };

// Shared-pool upstreams reject bursts: tag only a few bookmarks concurrently.
const TAG_CONCURRENCY = 3;
const TAG_BATCH_DELAY_MS = 250;

// Embeddings also go through OpenRouter's OpenAI-compatible /embeddings route.
// voyage-4-lite outputs 1024-dim vectors (matches the bookmarks.embedding column).
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const EMBEDDING_MODEL = "voyageai/voyage-4-lite";

// Chunked background processing: 15 bookmarks per LLM/embedding chunk. Manual
// Sync handles 2 chunks per call; cron passes a time budget instead and keeps
// starting new batches until it expires.
const CHUNK_SIZE = 15;
const MAX_CHUNKS_PER_CALL = 2;

const TagSchema = z.object({
  category: z.enum(BOOKMARK_CATEGORIES).describe("Primary category"),
  subTags: z
    .array(z.string())
    .min(0)
    .max(3)
    .describe("1-3 tags picked from the provided allowed-tag list"),
  summary: z.string().describe("One-line practical summary of the tweet"),
});

type TagResult = z.infer<typeof TagSchema>;

// Batch variant: one request carries a whole chunk and returns one entry per
// bookmark, keyed by tweetId so results can be matched back reliably.
const BatchTagSchema = z.object({
  results: z.array(
    z.object({
      tweetId: z.coerce.string(),
      category: z.enum(BOOKMARK_CATEGORIES),
      subTags: z.array(z.string()).min(0).max(3),
      summary: z.string(),
    })
  ),
});

type BookmarkRowFull = typeof bookmarks.$inferSelect;

function buildTagPrompt(bookmark: typeof bookmarks.$inferSelect): string {
  const author = bookmark.authorUsername
    ? `@${bookmark.authorUsername}`
    : "unknown";
  const urls = (bookmark.urls as string[] | null)?.length
    ? `\nLinks: ${(bookmark.urls as string[]).join(", ")}`
    : "";
  return [
    "Classify this X (Twitter) bookmark and summarize it.",
    `Author: ${author}`,
    `Text: ${bookmark.text.slice(0, 1500)}`,
    urls,
  ]
    .filter(Boolean)
    .join("\n");
}

const TAG_SYSTEM_PROMPT = [
  "You classify X (Twitter) bookmarks.",
  `Pick exactly one category from: ${BOOKMARK_CATEGORIES.join(", ")}.`,
  "Reply with ONLY a JSON object, no markdown, no extra text, in this shape:",
  '{"category": string, "subTags": string[], "summary": string (one practical line)}',
].join(" ");

const BATCH_TAG_SYSTEM_PROMPT = [
  "You classify X (Twitter) bookmarks.",
  `Pick exactly one category per bookmark from: ${BOOKMARK_CATEGORIES.join(", ")}.`,
  "Reply with ONLY a JSON object, no markdown, no extra text, in this shape:",
  '{"results": [{"tweetId": string, "category": string, "subTags": string[], "summary": string (one practical line)}]}',
  "Include exactly one entry per bookmark, keeping the given tweetIds.",
].join(" ");

// The model may ONLY reuse tags already present in the user's bookmark
// collection (loaded per processing run); it must never invent new ones.
// No candidates yet (fresh account) -> subTags stays empty.
function tagRuleSnippet(allowedTags: string[]): string {
  if (allowedTags.length === 0) {
    return 'subTags MUST be [] (empty array): no allowed tags exist yet, do not invent any.';
  }
  return [
    `subTags: pick 1-3 from this allowed list ONLY, verbatim (no new/synonymous/translated tags): ${allowedTags.join(", ")}.`,
    "If none fit, return [].",
  ].join(" ");
}

// Existing tags (usage counters in bookmark_tags) become the ONLY subTag
// candidates the model may use; the table is maintained on every subTags
// write, so no jsonb scanning is needed here.
const TAG_CANDIDATE_MAX = 100;

async function loadAllowedTags(userId: string): Promise<string[]> {
  const override = process.env.BOOKMARK_AI_TAGS;
  if (override) {
    return override
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, TAG_CANDIDATE_MAX);
  }
  return listUserTags(userId, TAG_CANDIDATE_MAX).then((rows) =>
    rows.map((r) => r.name)
  );
}

function buildBatchPrompt(items: BookmarkRowFull[]): string {
  const blocks = items.map((b) => {
    const author = b.authorUsername ? `@${b.authorUsername}` : "unknown";
    const urls = (b.urls as string[] | null)?.length
      ? `\nLinks: ${(b.urls as string[]).join(", ")}`
      : "";
    return [`[tweetId: ${b.tweetId}]`, `Author: ${author}`, `Text: ${b.text.slice(0, 800)}`, urls]
      .filter(Boolean)
      .join("\n");
  });
  return `Classify and summarize each of these ${items.length} bookmarks.\n\n${blocks.join("\n\n---\n\n")}`;
}

// Tag a whole chunk in ONE request; returns results keyed by tweetId so the
// caller can verify which bookmarks actually got tagged.
async function tagChunk(
  items: BookmarkRowFull[],
  modelId: string,
  allowedTags: string[]
): Promise<Map<string, TagResult> | null> {
  const startedAt = Date.now();
  console.log(
    `${LOG} batch-tagging ${items.length} bookmarks in one request via ${modelId}`
  );
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });
  const { text, finishReason } = await with429Backoff(() =>
    acquireAiSlot().then(() =>
      generateText({
        model: openrouter.chat(modelId),
        system: `${BATCH_TAG_SYSTEM_PROMPT} ${tagRuleSnippet(allowedTags)}`,
        prompt: buildBatchPrompt(items),
        temperature: 0.2,
        // A full chunk needs ~150 tokens per entry; 2500 truncated mid-array.
        maxOutputTokens: 6000,
        maxRetries: 1,
      })
    )
  );
  if (!text) {
    console.warn(`${LOG} batch via ${modelId}: empty model output`);
    return null;
  }
  if (finishReason === "length") {
    console.warn(
      `${LOG} batch via ${modelId}: output truncated at token limit, attempting salvage`
    );
  }
  try {
    let raw: unknown;
    try {
      raw = JSON.parse(extractJson(text));
    } catch (parseError) {
      // Truncated output: salvage the complete entries instead of losing all.
      const repaired = repairTruncatedJson(extractJson(text));
      if (!repaired) throw parseError;
      raw = JSON.parse(repaired);
      console.warn(
        `${LOG} batch via ${modelId}: salvaged partial entries from truncated output`
      );
    }
    const parsed = BatchTagSchema.safeParse(raw);
    if (!parsed.success) {
      console.warn(
        `${LOG} batch via ${modelId}: output failed schema validation: ${text.slice(0, 200)}`
      );
      return null;
    }
    const map = new Map<string, TagResult>();
    for (const entry of parsed.data.results) {
      map.set(entry.tweetId, {
        category: entry.category,
        subTags: entry.subTags,
        summary: entry.summary,
      });
    }
    console.log(
      `${LOG} batch via ${modelId} done in ${Date.now() - startedAt}ms: ${map.size}/${items.length} items returned`
    );
    return map;
  } catch (error) {
    console.warn(
      `${LOG} batch via ${modelId}: unparseable model output: ${text.slice(0, 200)}`,
      error
    );
    return null;
  }
}

// Tag one bookmark via OpenRouter. We ask for JSON and validate with zod
// instead of relying on provider-side structured output.
async function tagBookmark(
  bookmark: typeof bookmarks.$inferSelect,
  modelId: string,
  allowedTags: string[]
): Promise<TagResult | null> {
  const startedAt = Date.now();
  console.log(`${LOG} tagging tweet ${bookmark.tweetId} via ${modelId}`);
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });
  const { text } = await with429Backoff(() =>
    acquireAiSlot().then(() =>
      generateText({
        model: openrouter.chat(modelId),
        system: `${TAG_SYSTEM_PROMPT} ${tagRuleSnippet(allowedTags)}`,
        prompt: buildTagPrompt(bookmark),
        // Shared-pool 429s won't recover within retries; fail fast and let the
        // caller fall back to another model.
        maxRetries: 1,
      })
    )
  );
  const output = text;
  if (!output) {
    console.warn(`${LOG} tweet ${bookmark.tweetId}: empty model output`);
    return null;
  }
  try {
    const parsed = TagSchema.safeParse(JSON.parse(extractJson(output)));
    if (parsed.success) {
      console.log(
        `${LOG} tweet ${bookmark.tweetId} tagged in ${Date.now() - startedAt}ms -> category=${parsed.data.category} subTags=[${parsed.data.subTags.join(",")}] summary="${parsed.data.summary.slice(0, 60)}"`
      );
      return parsed.data;
    }
    console.warn(
      `${LOG} tweet ${bookmark.tweetId}: output failed schema validation: ${output.slice(0, 200)}`
    );
    return null;
  } catch (error) {
    console.warn(
      `${LOG} tweet ${bookmark.tweetId}: unparseable model output: ${output.slice(0, 200)}`,
      error
    );
    return null;
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run async tasks with bounded concurrency, preserving input order.
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (cursor < items.length) {
        const i = cursor++;
        results[i] = await fn(items[i], i);
      }
    }
  );
  await Promise.all(workers);
  return results;
}

// Embed + tag + persist one fetched batch (internally chunked by CHUNK_SIZE).
// Returns how many rows ended up 'ready'.
async function processRows(
  rows: BookmarkRowFull[],
  chatModelId: string
): Promise<number> {
  const openrouterEmbeddings = createOpenAI({
    baseURL: OPENROUTER_BASE_URL,
    apiKey: process.env.OPENROUTER_API_KEY,
  });
  const embeddingModel =
    openrouterEmbeddings.textEmbeddingModel(EMBEDDING_MODEL);

  let processed = 0;
  const chunks = chunk(rows, CHUNK_SIZE);
  // The model may only reuse tags already present in this user's collection;
  // loaded once per run and enforced again post-parse below.
  const allowedTags = await loadAllowedTags(rows[0]?.userId ?? "");
  const allowedSet = new Set(allowedTags);
  const filterTags = (tags: string[]) =>
    tags.filter((t) => allowedSet.has(t)).slice(0, 3);
  console.log(
    `${LOG} allowed subTag pool: ${allowedTags.length} tags${allowedTags.length ? ` (${allowedTags.slice(0, 10).join(", ")}${allowedTags.length > 10 ? ", ..." : ""})` : ""}`
  );
  for (const [chunkIndex, currentChunk] of chunks.entries()) {
    console.log(
      `${LOG} chunk ${chunkIndex + 1}/${chunks.length}: ${currentChunk.length} bookmarks`
    );
    // One batched embedding call per chunk (1024-dim vectors for future RAG).
    let embeddings: number[][] | null = null;
    const embedStartedAt = Date.now();
    try {
      const result = await with429Backoff(() =>
        acquireAiSlot().then(() =>
          embedMany({
            model: embeddingModel,
            values: currentChunk.map((r) => r.text.slice(0, 2000)),
          })
        )
      );
      embeddings = result.embeddings;
      console.log(
        `${LOG} chunk ${chunkIndex + 1}: embedded ${embeddings.length} vectors (dim=${embeddings[0]?.length ?? 0}) in ${Date.now() - embedStartedAt}ms via OpenRouter`
      );
    } catch (error) {
      console.error(
        `${LOG} chunk ${chunkIndex + 1}: embedding batch failed`,
        error
      );
    }

    // Batch-first tagging: one request carries the whole chunk. Candidates
    // are tried in order until every item has a tag; any items the batch
    // output missed get individual cascade retries afterwards.
    const candidates = [
      chatModelId,
      ...FALLBACK_CHAIN.filter((m) => m !== chatModelId),
    ];
    const tagged = new Map<string, TagResult>();
    let missingItems = [...currentChunk];
    for (const modelId of candidates) {
      if (missingItems.length === 0) break;
      const batch = await tagChunk(missingItems, modelId, allowedTags).catch(
        (error) => {
          console.warn(
            `${LOG} batch on ${modelId} failed: ${getErrorMessage(error)}`
          );
          return null;
        }
      );
      if (!batch) continue;
      const stillMissing: typeof missingItems = [];
      for (const r of missingItems) {
        const tag = batch.get(r.tweetId);
        if (tag) {
          // Hard-enforce the whitelist: drop anything not in the user's pool.
          tagged.set(r.tweetId, { ...tag, subTags: filterTags(tag.subTags) });
          console.log(
            `${LOG} tweet ${r.tweetId} tagged -> category=${tag.category} subTags=[${tag.subTags.join(",")}] summary="${tag.summary.slice(0, 60)}"`
          );
        } else {
          stillMissing.push(r);
        }
      }
      missingItems = stillMissing;
    }

    // Stragglers (dropped/mangled in batch output): retry one by one with
    // bounded concurrency through the same candidate cascade.
    if (missingItems.length > 0) {
      console.log(
        `${LOG} chunk ${chunkIndex + 1}: ${missingItems.length} items missing from batch outputs, retrying individually`
      );
      const singles = await mapWithConcurrency(
        missingItems,
        TAG_CONCURRENCY,
        async (r) => {
          for (const [i, modelId] of candidates.entries()) {
            const tag = await tagBookmark(r, modelId, allowedTags).catch((error) => {
              console.warn(
                `${LOG} tagging ${r.tweetId} failed on ${modelId}: ${getErrorMessage(error)}`
              );
              return null;
            });
            if (tag) return { ...tag, subTags: filterTags(tag.subTags) };
            if (i < candidates.length - 1) {
              console.log(
                `${LOG} retrying ${r.tweetId} on next candidate ${candidates[i + 1]}`
              );
            }
          }
          console.error(
            `${LOG} tagging failed for ${r.tweetId} on all candidates`
          );
          return null;
        }
      );
      missingItems.forEach((r, i) => {
        const tag = singles[i];
        if (tag) tagged.set(r.tweetId, tag);
      });
    }

    const tagResults = currentChunk.map((r) => tagged.get(r.tweetId) ?? null);
    console.log(
      `${LOG} chunk ${chunkIndex + 1}: tagging done (${tagResults.filter(Boolean).length}/${currentChunk.length} succeeded)`
    );

    await Promise.all(
      currentChunk.map(async (r, i) => {
        const tag = tagResults[i];
        const vector = embeddings?.[i];
        if (!tag && !vector) {
          console.warn(
            `${LOG} tweet ${r.tweetId}: no tag and no vector, marking failed`
          );
          await db
            .update(bookmarks)
            .set({ status: "failed" })
            .where(eq(bookmarks.id, r.id));
          return;
        }
        await db
          .update(bookmarks)
          .set({
            primaryCategory:
              (tag?.category as BookmarkCategory | undefined) ??
              r.primaryCategory,
            subTags: tag?.subTags ?? r.subTags,
            summary: tag?.summary ?? r.summary,
            ...(vector ? { embedding: vector } : {}),
            status: "ready",
          })
          .where(eq(bookmarks.id, r.id));
        console.log(
          `${LOG} tweet ${r.tweetId} saved: category=${tag?.category ?? "kept"} summary=${tag ? "yes" : "kept"} embedding=${vector ? `${vector.length}-dim` : "skipped"} -> ready`
        );
        if (tag) {
          await applyTagDeltas(
            r.userId,
            tagDeltas((r.subTags as string[] | null) ?? [], tag.subTags)
          );
        }
        processed += 1;
      })
    );

    // Pace between chunks so upstream rate limits recover.
    if (chunkIndex < chunks.length - 1) {
      await sleep(TAG_BATCH_DELAY_MS);
    }
  }
  return processed;
}

export type ProcessOptions = {
  /** Hard cap on bookmarks handled in this call (default: 2 chunks = 30). */
  maxItems?: number;
  /** Cron mode: keep starting new batches until the budget is exhausted. */
  timeBudgetMs?: number;
};

/**
 * Session-less AI pipeline: embed + tag + summarize pending/failed bookmarks.
 * Bounded by maxItems (manual Sync) or timeBudgetMs (cron ticks); checkpoints
 * are row statuses, so an interrupted tick resumes where it stopped and the
 * 5-minute stale-row recovery heals hard kills.
 */
export async function processPendingForUser(
  userId: string,
  opts: ProcessOptions = {}
): Promise<{ processed: number; remaining: number }> {
  if (!(await hasBookmarkServiceAccess(userId))) {
    return { processed: 0, remaining: 0 };
  }
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error(
      "OpenRouter is not configured (OPENROUTER_API_KEY missing)."
    );
  }
  const maxItems = opts.maxItems ?? CHUNK_SIZE * MAX_CHUNKS_PER_CALL;
  const deadline = opts.timeBudgetMs
    ? Date.now() + opts.timeBudgetMs
    : Number.POSITIVE_INFINITY;

  // Recover rows stuck in 'processing' from a crashed/timed-out run.
  await db
    .update(bookmarks)
    .set({ status: "pending" })
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.status, "processing"),
        sql`${bookmarks.updatedAt} < now() - interval '5 minutes'`
      )
    );

  const chatModelId = process.env.BOOKMARK_AI_MODEL || DEFAULT_BOOKMARK_MODEL;
  console.log(
    `${LOG} starting: chatModel=${chatModelId} embeddingModel=${EMBEDDING_MODEL} (via OpenRouter)`
  );

  let processed = 0;
  let considered = 0;
  while (considered < maxItems && Date.now() < deadline) {
    // Atomic claim: manual Sync, cron ticks and other instances can race for
    // the same pending rows; FOR UPDATE SKIP LOCKED makes each row handable
    // to exactly one worker, so backlog never causes duplicate AI spend.
    const limit = Math.min(
      CHUNK_SIZE * MAX_CHUNKS_PER_CALL,
      maxItems - considered
    );
    const rows = await db
      .update(bookmarks)
      .set({ status: "processing" })
      .where(
        inArray(
          bookmarks.id,
          sql`(
            SELECT id FROM bookmarks
            WHERE user_id = ${userId}
              AND status IN ('pending', 'failed')
            ORDER BY synced_at ASC
            FOR UPDATE SKIP LOCKED
            LIMIT ${limit}
          )`
        )
      )
      .returning();

    if (rows.length === 0) {
      if (considered === 0) console.log(`${LOG} nothing to process, returning`);
      break;
    }
    considered += rows.length;
    console.log(`${LOG} claimed ${rows.length} rows as processing`);

    processed += await processRows(rows, chatModelId);
  }

  const [remainingRow] = await db
    .select({ value: count() })
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        inArray(bookmarks.status, [
          "pending",
          "failed",
          "processing",
        ] as BookmarkStatus[])
      )
    );

  console.log(
    `${LOG} done: processed=${processed} remaining=${remainingRow?.value ?? 0}`
  );
  if (processed > 0) {
    void maybeEnqueueNotionAutoSync(userId).catch((error) => {
      console.warn(
        "[notion:auto-sync] enqueue failed:",
        error instanceof Error ? error.message : String(error)
      );
    });
  }
  return { processed, remaining: remainingRow?.value ?? 0 };
}
