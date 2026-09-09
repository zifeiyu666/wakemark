import "server-only";

import type { ExportBookmarkRow } from "@/lib/bookmarks/export";
import { db } from "@/lib/db";
import { bookmarks, notionConnections } from "@/lib/db/schema";
import { getNotionConnectionByUserId } from "@/lib/notion/connection";
import { createNotionBookmarkPage } from "@/lib/notion/pages";
import {
  BATCH_DELAY_SECONDS,
  BATCH_SIZE,
  publishNotionSyncBatch,
  type NotionSyncJobPayload,
} from "@/lib/notion/sync-queue";
import { releaseLock, tryAcquireLock } from "@/lib/upstash/lock";
import { hasActiveSubscription } from "@/lib/payments/subscription";
import { and, asc, eq, gt, inArray, isNull, sql } from "drizzle-orm";

async function fetchBatchRows(
  userId: string,
  cursorBookmarkId: string | null | undefined,
  bookmarkIds?: string[]
): Promise<ExportBookmarkRow[]> {
  const conditions = [
    eq(bookmarks.userId, userId),
    isNull(bookmarks.deletedAt),
    isNull(bookmarks.notionPageId),
    eq(bookmarks.status, "ready"),
  ];

  if (bookmarkIds?.length) {
    conditions.push(inArray(bookmarks.id, bookmarkIds));
  } else if (cursorBookmarkId) {
    conditions.push(gt(bookmarks.id, cursorBookmarkId));
  }

  const rows = await db
    .select({
      id: bookmarks.id,
      tweetId: bookmarks.tweetId,
      text: bookmarks.text,
      authorUsername: bookmarks.authorUsername,
      authorName: bookmarks.authorName,
      tweetCreatedAt: bookmarks.tweetCreatedAt,
      mediaUrls: bookmarks.mediaUrls,
      mediaTypes: bookmarks.mediaTypes,
      urls: bookmarks.urls,
      primaryCategory: bookmarks.primaryCategory,
      subTags: bookmarks.subTags,
      summary: bookmarks.summary,
      status: bookmarks.status,
      isRead: bookmarks.isRead,
      syncedAt: bookmarks.syncedAt,
    })
    .from(bookmarks)
    .where(and(...conditions))
    .orderBy(asc(bookmarks.id))
    .limit(BATCH_SIZE);

  return rows.map((row) => ({
    ...row,
    mediaUrls: (row.mediaUrls as string[] | null) ?? [],
    mediaTypes: (row.mediaTypes as string[] | null) ?? [],
    urls: (row.urls as string[] | null) ?? [],
    subTags: (row.subTags as string[] | null) ?? [],
  }));
}

async function hasRemainingRows(
  userId: string,
  cursorBookmarkId: string | null,
  bookmarkIds?: string[]
): Promise<boolean> {
  const conditions = [
    eq(bookmarks.userId, userId),
    isNull(bookmarks.deletedAt),
    isNull(bookmarks.notionPageId),
    eq(bookmarks.status, "ready"),
  ];
  if (bookmarkIds?.length) {
    conditions.push(inArray(bookmarks.id, bookmarkIds));
  } else if (cursorBookmarkId) {
    conditions.push(gt(bookmarks.id, cursorBookmarkId));
  }

  const [row] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(bookmarks)
    .where(and(...conditions));
  return (row?.value ?? 0) > 0;
}

export async function processNotionSyncBatch(
  payload: NotionSyncJobPayload
): Promise<{ processed: number; remaining: boolean }> {
  const lockToken = await tryAcquireLock(`notion.sync:${payload.userId}`, 120);
  if (!lockToken) {
    await publishNotionSyncBatch(payload, BATCH_DELAY_SECONDS);
    return { processed: 0, remaining: true };
  }

  try {
    const conn = await getNotionConnectionByUserId(payload.userId);
    if (!conn?.databaseId) {
      throw new Error("Notion database is not configured");
    }

    const manualMode = payload.manual === true || !!payload.bookmarkIds?.length;
    if (!manualMode && !conn.autoSyncEnabled) {
      await db
        .update(notionConnections)
        .set({ syncStatus: "idle" })
        .where(eq(notionConnections.userId, payload.userId));
      return { processed: 0, remaining: false };
    }

    if (!(await hasActiveSubscription(payload.userId))) {
      await db
        .update(notionConnections)
        .set({
          syncStatus: "error",
          lastSyncError: "Paid subscription required for Notion sync",
        })
        .where(eq(notionConnections.userId, payload.userId));
      return { processed: 0, remaining: false };
    }

    const rows = await fetchBatchRows(
      payload.userId,
      payload.cursorBookmarkId,
      payload.bookmarkIds
    );

    if (rows.length === 0) {
      await db
        .update(notionConnections)
        .set({
          syncStatus: "idle",
          cursorBookmarkId: null,
          lastSyncedAt: new Date(),
          lastSyncError: null,
        })
        .where(eq(notionConnections.userId, payload.userId));
      return { processed: 0, remaining: false };
    }

    let processed = 0;
    let lastCursor = payload.cursorBookmarkId ?? null;

    for (const row of rows) {
      try {
        const pageId = await createNotionBookmarkPage(
          conn.accessToken,
          conn.databaseId,
          row
        );
        await db
          .update(bookmarks)
          .set({
            notionPageId: pageId,
            notionSyncedAt: new Date(),
          })
          .where(eq(bookmarks.id, row.id));
        processed += 1;
        lastCursor = row.id;
      } catch (error) {
        console.error(
          `[notion:sync] failed bookmark ${row.id}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    await db
      .update(notionConnections)
      .set({
        cursorBookmarkId: lastCursor,
        lastSyncedAt: new Date(),
        lastSyncError: null,
      })
      .where(eq(notionConnections.userId, payload.userId));

    const remaining = manualMode
      ? await hasRemainingRows(
          payload.userId,
          lastCursor,
          payload.bookmarkIds
        )
      : await hasRemainingRows(payload.userId, lastCursor);

    if (remaining) {
      console.log(
        `[notion:sync] batch done user=${payload.userId} processed=${processed} remaining=true cursor=${lastCursor}`
      );
      await publishNotionSyncBatch(
        {
          userId: payload.userId,
          bookmarkIds: payload.bookmarkIds,
          cursorBookmarkId: lastCursor,
          manual: payload.manual,
        },
        BATCH_DELAY_SECONDS
      );
      return { processed, remaining: true };
    }

    await db
      .update(notionConnections)
      .set({
        syncStatus: "idle",
        cursorBookmarkId: null,
        lastSyncedAt: new Date(),
      })
      .where(eq(notionConnections.userId, payload.userId));

    return { processed, remaining: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db
      .update(notionConnections)
      .set({
        syncStatus: "error",
        lastSyncError: message.slice(0, 500),
      })
      .where(eq(notionConnections.userId, payload.userId));
    throw error;
  } finally {
    await releaseLock(`notion.sync:${payload.userId}`, lockToken);
  }
}

export async function enqueueNotionSyncForUser(
  userId: string,
  bookmarkIds?: string[],
  manual = false
): Promise<void> {
  await db
    .update(notionConnections)
    .set({
      syncStatus: "syncing",
      cursorBookmarkId: null,
      lastSyncError: null,
    })
    .where(eq(notionConnections.userId, userId));

  await publishNotionSyncBatch({
    userId,
    bookmarkIds,
    cursorBookmarkId: null,
    manual,
  });
}

export async function maybeEnqueueNotionAutoSync(userId: string): Promise<void> {
  const conn = await getNotionConnectionByUserId(userId);
  if (!conn?.autoSyncEnabled || !conn.databaseId) return;
  if (!(await hasActiveSubscription(userId))) return;

  await db
    .update(notionConnections)
    .set({ syncStatus: "syncing", lastSyncError: null })
    .where(eq(notionConnections.userId, userId));

  await publishNotionSyncBatch({
    userId,
    cursorBookmarkId: conn.cursorBookmarkId,
  });
}
