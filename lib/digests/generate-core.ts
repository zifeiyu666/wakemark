import "server-only";

import { sendEmail } from "@/actions/resend";
import {
  DEFAULT_BOOKMARK_MODEL,
  FALLBACK_CHAIN,
} from "@/lib/bookmarks/process-core";
import { acquireAiSlot, with429Backoff } from "@/lib/bookmarks/ai-guard";
import { extractJson, repairTruncatedJson } from "@/lib/ai/json";
import { db } from "@/lib/db";
import {
  bookmarks,
  digests,
  user as userSchema,
  userPreferences,
} from "@/lib/db/schema";
import {
  DEFAULT_DIGEST_LANGUAGE,
  digestEmailCopy,
  digestLanguageEnglishName,
  type DigestLanguage,
  normalizeDigestLanguage,
} from "@/lib/digests/language";
import type { DigestContent, DigestHighlightItem } from "@/lib/digests/types";
import { getErrorMessage } from "@/lib/error-utils";
import { hasBookmarkServiceAccess } from "@/lib/payments/subscription";
import { WeeklyDigestEmail } from "@/emails/weekly-digest";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { and, eq, gte, inArray, isNull } from "drizzle-orm";
import * as React from "react";
import { z } from "zod";

const LOG = "[digests:generate]";

// Highlights are curated (LLM first, score fallback) so the digest stays
// scannable: 70% of the week's bookmarks, floored at 3 and capped at 10.
// Everything else lands in "Also bookmarked" (capped at 30 raw rows).
const CANDIDATE_MAX = 30;
const HIGHLIGHT_MIN = 3;
const HIGHLIGHT_MAX = 10;
const ALSO_MAX = 30;
const ALSO_TEXT_MAX = 280;

const DigestAiSchema = z.object({
  overview: z.string(),
  highlightTweetIds: z.array(z.coerce.string()),
  insights: z
    .array(z.object({ tweetId: z.coerce.string(), insight: z.string() }))
    .max(3),
});

function digestSystemPrompt(language: DigestLanguage): string {
  const languageName = digestLanguageEnglishName(language);
  return [
    "You edit the weekly bookmark digest for WakeMark.",
    `Write overview and insights in ${languageName}, concise and practical, second person.`,
    "JSON keys stay in English. Do not translate tweetIds.",
    "Reply with ONLY a JSON object, no markdown, in this shape:",
    '{"overview": string (2-4 sentences on the week\'s themes and interests),',
    '"highlightTweetIds": string[] (the curated highlight tweetIds, see prompt),',
    '"insights": [{"tweetId": string, "insight": string (one editorial comment, max 25 words)}]}',
    "Include at most 3 insights, only for the most actionable highlights; [] is fine.",
  ].join(" ");
}

function likesOf(row: typeof bookmarks.$inferSelect): number {
  const metrics = row.metrics as { likes?: number } | null;
  return typeof metrics?.likes === "number" ? metrics.likes : 0;
}

// Editorial score: engagement plus content richness (longer summary/text =
// more substantive). Caps the candidate pool and backs curation fallbacks.
function scoreOf(row: typeof bookmarks.$inferSelect): number {
  const length = Math.min(
    (row.summary?.length ?? 0) + row.text.length,
    2000
  );
  return likesOf(row) + length / 20;
}

function highlightQuota(totalBookmarks: number): number {
  return Math.min(
    HIGHLIGHT_MAX,
    Math.max(HIGHLIGHT_MIN, Math.round(totalBookmarks * 0.7))
  );
}

type BookmarkRow = typeof bookmarks.$inferSelect;

// Group rows by primary category; biggest topics first, items by engagement.
function groupRows(
  rows: BookmarkRow[]
): Array<{ category: string; items: DigestHighlightItem[] }> {
  const groupMap = new Map<string, BookmarkRow[]>();
  for (const row of rows) {
    const category = row.primaryCategory || "Other";
    const bucket = groupMap.get(category) ?? [];
    bucket.push(row);
    groupMap.set(category, bucket);
  }
  return [...groupMap.entries()]
    .map(([category, items]) => ({
      category,
      items: items
        .sort((a, b) => likesOf(b) - likesOf(a))
        .map<DigestHighlightItem>((r) => ({
          bookmarkId: r.id,
          tweetId: r.tweetId,
          authorName: r.authorName,
          authorUsername: r.authorUsername,
          authorProfileImageUrl: r.authorProfileImageUrl,
          summary: r.summary ?? "",
        })),
    }))
    .sort((a, b) => b.items.length - a.items.length);
}

// Deterministic curation: top-scored rows with a per-category cap so one
// topic cannot swallow the highlight list; backfill by score afterwards.
function fallbackSelection(
  candidates: BookmarkRow[],
  quota: number
): BookmarkRow[] {
  const byScore = [...candidates].sort((a, b) => scoreOf(b) - scoreOf(a));
  const categories = new Set(
    byScore.map((r) => r.primaryCategory || "Other")
  );
  const perCategory = Math.max(
    2,
    Math.ceil(quota / Math.max(1, categories.size))
  );
  const picked: BookmarkRow[] = [];
  const perCatCount = new Map<string, number>();
  for (const row of byScore) {
    if (picked.length >= quota) break;
    const category = row.primaryCategory || "Other";
    const used = perCatCount.get(category) ?? 0;
    if (used >= perCategory) continue;
    picked.push(row);
    perCatCount.set(category, used + 1);
  }
  if (picked.length < quota) {
    const pickedIds = new Set(picked.map((r) => r.id));
    for (const row of byScore) {
      if (picked.length >= quota) break;
      if (pickedIds.has(row.id)) continue;
      picked.push(row);
      pickedIds.add(row.id);
    }
  }
  return picked;
}

function buildDigestPrompt(
  weekKey: string,
  groups: Array<{ category: string; items: DigestHighlightItem[] }>,
  quota: number
): string {
  const blocks = groups.map((group) => {
    const lines = group.items.map(
      (item) =>
        `[tweetId: ${item.tweetId}] @${item.authorUsername ?? "unknown"} (${group.category}): ${item.summary}`
    );
    return `## ${group.category}\n${lines.join("\n")}`;
  });
  return [
    `Week of ${weekKey}. Summarized candidates by topic:`,
    "",
    blocks.join("\n\n"),
    "",
    `Curate exactly ${quota} highlightTweetIds: the most substantive, representative tweets of the week, spread across topics where possible. Only use tweetIds that appear above.`,
  ].join("\n");
}

// One LLM pass curates the highlights and produces the global overview plus
// up to three editorial insights. Any failure degrades to score-based
// curation and a generic overview; the digest still ships.
async function generateOverview(
  weekKey: string,
  groups: Array<{ category: string; items: DigestHighlightItem[] }>,
  quota: number,
  language: DigestLanguage
): Promise<{
  overview: string | null;
  insights: Map<string, string>;
  highlightTweetIds: string[];
}> {
  const empty = {
    overview: null,
    insights: new Map<string, string>(),
    highlightTweetIds: [] as string[],
  };
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn(`${LOG} OPENROUTER_API_KEY missing, using fallback overview`);
    return empty;
  }
  const chatModelId = process.env.BOOKMARK_AI_MODEL || DEFAULT_BOOKMARK_MODEL;
  const candidates = [
    chatModelId,
    ...FALLBACK_CHAIN.filter((m) => m !== chatModelId),
  ];
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });
  for (const modelId of candidates) {
    try {
      const { text } = await with429Backoff(() =>
        acquireAiSlot().then(() =>
          generateText({
            model: openrouter.chat(modelId),
            system: digestSystemPrompt(language),
            prompt: buildDigestPrompt(weekKey, groups, quota),
            temperature: 0.4,
            maxOutputTokens: 1500,
            maxRetries: 1,
          })
        )
      );
      let raw: unknown;
      try {
        raw = JSON.parse(extractJson(text));
      } catch (parseError) {
        const repaired = repairTruncatedJson(extractJson(text));
        if (!repaired) throw parseError;
        raw = JSON.parse(repaired);
      }
      const parsed = DigestAiSchema.safeParse(raw);
      if (!parsed.success) {
        console.warn(
          `${LOG} ${modelId}: output failed schema validation: ${text.slice(0, 200)}`
        );
        continue;
      }
      const insights = new Map<string, string>();
      for (const entry of parsed.data.insights) {
        insights.set(entry.tweetId, entry.insight);
      }
      const overview = parsed.data.overview.trim() || null;
      console.log(`${LOG} overview via ${modelId}: ${(overview ?? "").slice(0, 80)}`);
      return {
        overview,
        insights,
        highlightTweetIds: parsed.data.highlightTweetIds,
      };
    } catch (error) {
      console.warn(
        `${LOG} overview on ${modelId} failed: ${getErrorMessage(error)}`
      );
    }
  }
  return empty;
}

const LocalizedSummariesSchema = z.object({
  summaries: z.array(
    z.object({
      tweetId: z.coerce.string(),
      summary: z.string().min(1),
    })
  ),
});

// Rewrites highlight summaries into the user's digest language. Bookmark
// rows stay untouched; Also bookmarked keeps the original tweet text.
async function localizeHighlightSummaries(
  items: DigestHighlightItem[],
  language: DigestLanguage
): Promise<Map<string, string>> {
  const localized = new Map<string, string>();
  if (language === DEFAULT_DIGEST_LANGUAGE || items.length === 0) {
    return localized;
  }
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn(`${LOG} OPENROUTER_API_KEY missing, keeping source summaries`);
    return localized;
  }

  const languageName = digestLanguageEnglishName(language);
  const prompt = [
    `Rewrite each highlight summary in ${languageName}.`,
    "Keep the meaning, one practical line each, no hashtags, no tweetIds in the prose.",
    "Reply with ONLY JSON:",
    '{"summaries":[{"tweetId":string,"summary":string}]}',
    "Include every tweetId listed below.",
    "",
    ...items.map(
      (item) => `[tweetId: ${item.tweetId}] ${item.summary || "(no summary)"}`
    ),
  ].join("\n");

  const chatModelId = process.env.BOOKMARK_AI_MODEL || DEFAULT_BOOKMARK_MODEL;
  const candidates = [
    chatModelId,
    ...FALLBACK_CHAIN.filter((m) => m !== chatModelId),
  ];
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });
  for (const modelId of candidates) {
    try {
      const { text } = await with429Backoff(() =>
        acquireAiSlot().then(() =>
          generateText({
            model: openrouter.chat(modelId),
            system: `You translate editorial bookmark summaries into ${languageName}. JSON keys stay in English.`,
            prompt,
            temperature: 0.2,
            maxOutputTokens: 1500,
            maxRetries: 1,
          })
        )
      );
      let raw: unknown;
      try {
        raw = JSON.parse(extractJson(text));
      } catch (parseError) {
        const repaired = repairTruncatedJson(extractJson(text));
        if (!repaired) throw parseError;
        raw = JSON.parse(repaired);
      }
      const parsed = LocalizedSummariesSchema.safeParse(raw);
      if (!parsed.success) {
        console.warn(
          `${LOG} ${modelId}: localized summaries failed schema: ${text.slice(0, 200)}`
        );
        continue;
      }
      for (const entry of parsed.data.summaries) {
        const summary = entry.summary.trim();
        if (summary) localized.set(entry.tweetId, summary);
      }
      console.log(
        `${LOG} localized ${localized.size}/${items.length} highlight summaries via ${modelId} -> ${language}`
      );
      return localized;
    } catch (error) {
      console.warn(
        `${LOG} localize summaries on ${modelId} failed: ${getErrorMessage(error)}`
      );
    }
  }
  return localized;
}

export type DigestGenerationResult = {
  digestId: string;
  emailed: boolean;
} | null;

/**
 * Build and email one user's weekly digest for the given weekKey (their local
 * Friday date). Returns null when there is nothing new to summarize or the
 * week was already digested (unique (userId, weekKey) makes hourly ticks
 * idempotent). Marks the whole weekly window as pushed either way so stale
 * rows never pile up.
 */
export async function generateWeeklyDigestForUser(
  userId: string,
  weekKey: string
): Promise<DigestGenerationResult> {
  if (!(await hasBookmarkServiceAccess(userId))) {
    console.log(`${LOG} user ${userId}: skipped, no active subscription`);
    return null;
  }

  const [prefs] = await db
    .select({ digestLanguage: userPreferences.digestLanguage })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  const language = normalizeDigestLanguage(prefs?.digestLanguage);
  const copy = digestEmailCopy(language);

  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

  const rows = await db
    .select()
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.isPushed, false),
        isNull(bookmarks.deletedAt),
        gte(bookmarks.syncedAt, periodStart)
      )
    );
  if (rows.length === 0) {
    console.log(`${LOG} user ${userId}: no unpushed bookmarks this week`);
    return null;
  }

  // Candidates: AI-ready rows with a summary, capped by editorial score so
  // the curation prompt stays bounded.
  const readyRows = rows.filter((r) => r.status === "ready" && !!r.summary);
  const candidates = [...readyRows]
    .sort((a, b) => scoreOf(b) - scoreOf(a))
    .slice(0, CANDIDATE_MAX);
  const quota = Math.min(highlightQuota(rows.length), candidates.length);

  // One LLM pass: curate highlights + overview + insights. Score-based
  // fallback keeps the digest shipping when the model is unavailable.
  const ai =
    candidates.length > 0
      ? await generateOverview(weekKey, groupRows(candidates), quota, language)
      : {
          overview: null,
          insights: new Map<string, string>(),
          highlightTweetIds: [] as string[],
        };

  // LLM curation, validated against candidates (order kept, dupes dropped);
  // an empty pick degrades to the deterministic score-based selection.
  const candidateByTweetId = new Map(
    candidates.map((r) => [r.tweetId, r] as const)
  );
  const seenTweetIds = new Set<string>();
  const llmPicked: BookmarkRow[] = [];
  for (const tweetId of ai.highlightTweetIds) {
    if (seenTweetIds.has(tweetId)) continue;
    seenTweetIds.add(tweetId);
    const row = candidateByTweetId.get(tweetId);
    if (row) llmPicked.push(row);
  }
  const highlightRows =
    llmPicked.length > 0
      ? llmPicked.slice(0, quota)
      : fallbackSelection(candidates, quota);
  const highlightIds = new Set(highlightRows.map((r) => r.id));
  const alsoRows = rows.filter((r) => !highlightIds.has(r.id)).slice(0, ALSO_MAX);

  // Group highlights by primary category; biggest topics first.
  const groups = groupRows(highlightRows);
  const highlightItems = groups.flatMap((group) => group.items);
  const localizedSummaries = await localizeHighlightSummaries(
    highlightItems,
    language
  );
  for (const group of groups) {
    for (const item of group.items) {
      const rewritten = localizedSummaries.get(item.tweetId);
      if (rewritten) item.summary = rewritten;
    }
  }

  const content: DigestContent = {
    highlightGroups: groups,
    alsoBookmarked: alsoRows.map((r) => ({
      tweetId: r.tweetId,
      authorUsername: r.authorUsername,
      text: (r.text || "").slice(0, ALSO_TEXT_MAX),
    })),
  };

  const fallbackOverview = copy.fallbackOverview({
    highlightCount: highlightRows.length,
    topicCount: groups.length,
    alsoCount: alsoRows.length,
  });
  const overview = ai.overview ?? fallbackOverview;
  for (const group of content.highlightGroups) {
    for (const item of group.items) {
      const insight = ai.insights.get(item.tweetId);
      if (insight) item.insight = insight;
    }
  }

  // Idempotency: a prior tick this week already digested it -> skip silently.
  const [inserted] = await db
    .insert(digests)
    .values({
      userId,
      weekKey,
      periodStart,
      periodEnd,
      overview,
      highlightCount: highlightRows.length,
      bookmarkCount: rows.length,
      content,
      status: "ready",
      emailStatus: "pending",
    })
    .onConflictDoNothing({ target: [digests.userId, digests.weekKey] })
    .returning();
  if (!inserted) {
    console.log(`${LOG} user ${userId}: week ${weekKey} already digested`);
    return null;
  }

  // Close the window: everything synced this week counts as pushed, even
  // rows trimmed by the caps, so backlog never accumulates.
  await db
    .update(bookmarks)
    .set({ isPushed: true })
    .where(
      inArray(
        bookmarks.id,
        rows.map((r) => r.id)
      )
    );

  // Email delivery; a failed send keeps the digest visible in the dashboard.
  let emailed = false;
  try {
    const [account] = await db
      .select({ email: userSchema.email, name: userSchema.name })
      .from(userSchema)
      .where(eq(userSchema.id, userId))
      .limit(1);
    if (!account?.email) {
      throw new Error("user has no email");
    }
    const unsubscribeToken = Buffer.from(account.email).toString("base64");
    await sendEmail({
      email: account.email,
      subject: copy.subject(weekKey),
      react: React.createElement(WeeklyDigestEmail, {
        weekKey,
        overview,
        highlightCount: highlightRows.length,
        bookmarkCount: rows.length,
        content,
        language,
        unsubscribeLink: `${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe/newsletter?token=${unsubscribeToken}`,
      }),
    });
    emailed = true;
    await db
      .update(digests)
      .set({ emailStatus: "sent" })
      .where(eq(digests.id, inserted.id));
    console.log(`${LOG} user ${userId}: digest ${inserted.id} emailed`);
  } catch (error) {
    console.error(
      `${LOG} user ${userId}: digest email failed: ${getErrorMessage(error)}`
    );
    await db
      .update(digests)
      .set({ emailStatus: "failed" })
      .where(eq(digests.id, inserted.id));
  }

  return { digestId: inserted.id, emailed };
}
