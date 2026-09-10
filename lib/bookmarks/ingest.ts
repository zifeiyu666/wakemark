import "server-only";

import { db } from "@/lib/db";
import { bookmarks, xConnections } from "@/lib/db/schema";
import { and, count, eq, inArray, sql } from "drizzle-orm";

export type BookmarkIngestSource = "api" | "extension" | "archive";

export type BookmarkIngestItem = {
  tweetId: string;
  text: string;
  authorXId?: string;
  authorUsername?: string;
  authorName?: string;
  authorProfileImageUrl?: string;
  tweetCreatedAt?: Date;
  mediaUrls?: string[];
  mediaTypes?: string[];
  mediaPlaybackUrls?: string[];
  urls?: string[];
  metrics?: { likes: number; retweets: number; replies: number };
};

export type IngestResult = {
  inserted: number;
  skipped: number;
  pendingCount: number;
};

/**
 * Idempotent bookmark insert. Existing (user_id, tweet_id) rows are skipped
 * so tags, notes and summaries from a prior API cold-start are preserved.
 */
export async function insertBookmarkBatch(
  userId: string,
  items: BookmarkIngestItem[],
  source: BookmarkIngestSource
): Promise<IngestResult> {
  if (items.length === 0) {
    return { inserted: 0, skipped: 0, pendingCount: await pendingCountFor(userId) };
  }

  const uniqueItems = [
    ...new Map(items.map((item) => [item.tweetId, item])).values(),
  ];

  const rows = uniqueItems.map((item) => ({
    userId,
    tweetId: item.tweetId,
    text: item.text,
    authorXId: item.authorXId,
    authorUsername: item.authorUsername,
    authorName: item.authorName,
    authorProfileImageUrl: item.authorProfileImageUrl,
    tweetCreatedAt: item.tweetCreatedAt,
    mediaUrls: item.mediaUrls ?? [],
    mediaTypes: item.mediaTypes ?? [],
    mediaPlaybackUrls: item.mediaPlaybackUrls ?? [],
    urls: item.urls ?? [],
    metrics: item.metrics ?? { likes: 0, retweets: 0, replies: 0 },
    syncedVia: source,
  }));

  const inserted = await db
    .insert(bookmarks)
    .values(rows)
    .onConflictDoNothing({
      target: [bookmarks.userId, bookmarks.tweetId],
    })
    .returning({ id: bookmarks.id, tweetId: bookmarks.tweetId });

  const insertedCount = inserted.length;
  if (insertedCount > 0) {
    await db
      .update(xConnections)
      .set({
        totalSyncedCount: sql`${xConnections.totalSyncedCount} + ${insertedCount}`,
      })
      .where(eq(xConnections.userId, userId));
  }

  const insertedTweetIds = new Set(inserted.map((row) => row.tweetId));
  await backfillMediaPlaybackUrls(
    userId,
    uniqueItems.filter((item) => !insertedTweetIds.has(item.tweetId))
  );

  return {
    inserted: insertedCount,
    skipped: uniqueItems.length - insertedCount,
    pendingCount: await pendingCountFor(userId),
  };
}

async function backfillMediaPlaybackUrls(
  userId: string,
  items: BookmarkIngestItem[]
): Promise<void> {
  const patches = items.filter((item) =>
    (item.mediaPlaybackUrls ?? []).some(Boolean)
  );
  if (patches.length === 0) return;

  for (const item of patches) {
    await db
      .update(bookmarks)
      .set({ mediaPlaybackUrls: item.mediaPlaybackUrls ?? [] })
      .where(
        and(eq(bookmarks.userId, userId), eq(bookmarks.tweetId, item.tweetId))
      );
  }
}

export async function pendingCountFor(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        inArray(bookmarks.status, ["pending", "processing"])
      )
    );
  return row?.value ?? 0;
}
