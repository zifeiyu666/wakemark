import "server-only";

import { db } from "@/lib/db";
import { bookmarks, xConnections } from "@/lib/db/schema";
import { getErrorMessage } from "@/lib/error-utils";
import { releaseLock, tryAcquireLock } from "@/lib/upstash/lock";
import { REDIS_KEYS_CONFIGS } from "@/lib/upstash/redis-keys";
import { fetchBookmarksPageForUser, XApiError } from "@/lib/x/client";
import {
  getValidAccessToken,
  getXConnectionByUserId,
  type XConnection,
  XReconnectRequiredError,
} from "@/lib/x/connection";
import { and, count, eq, inArray } from "drizzle-orm";

// Rate-limit / cost control: at most 5 pages (<=500 bookmarks) per sync pass,
// 400ms pause between pages, checkpoint pagination_token after every page.
// Cron ticks repeat passes until the backlog drains; manual Sync loops too.
const MAX_PAGES_PER_SYNC = 5;
const PAGE_DELAY_MS = 400;

export type SyncStoppedReason =
  | "done" // no next_token: fully synced
  | "max-pages" // per-run page budget reached, resume on next pass
  | "rate-limit" // 429 window or remaining=0, resume later
  | "usage-capped" // billing cap, do not retry
  | "caught-up" // page contained only already-synced tweets
  | "auth-error";

export type SyncResult = {
  added: number;
  pendingCount: number;
  stoppedReason: SyncStoppedReason;
};

export class XNotConnectedError extends Error {
  constructor() {
    super("X account not connected.");
    this.name = "XNotConnectedError";
  }
}

// Transient token refresh failure (network/5xx): retryable on a later tick or
// click, no reconnect needed.
export class SyncRefreshError extends Error {
  constructor(detail: string) {
    super(`X token refresh failed: ${detail}`);
    this.name = "SyncRefreshError";
  }
}

// Another pass (other tab, cron tick, signup fast-sync) already holds the
// distributed lock for this connection; retry later instead of doubling X
// API spend and racing the token rotation.
export class SyncBusyError extends Error {
  constructor() {
    super("A sync for this connection is already in progress.");
    this.name = "SyncBusyError";
  }
}

// Cross-instance mutex window: a manual "latest" pass pulls up to 20 pages
// (~2-3s each: X fetch + 400ms pause + insert), so 120s covers the worst
// case while a killed serverless instance frees the lock quickly.
const SYNC_LOCK_TTL_SECONDS = 120;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Pull one bounded pass of bookmarks for a user (session-less so cron can call
 * it). Throws XNotConnectedError / XReconnectRequiredError / SyncRefreshError
 * for the respective auth states; everything else is a generic failure.
 *
 * Modes:
 *  - "resume" (cron drain): continue the old-history backlog from the stored
 *    pagination_token checkpoint and advance it.
 *  - "latest" (manual Sync / daily job / connect callback): walk from the
 *    newest tweets and stop at the first fully-known page, so a manual click
 *    surfaces fresh bookmarks immediately and never races the background
 *    backlog crawl; the stored checkpoint is left untouched.
 */
export type SyncMode = "resume" | "latest";

export async function syncBookmarksForUser(
  userId: string,
  opts: { maxPages?: number; mode?: SyncMode } = {}
): Promise<SyncResult> {
  const conn = await getXConnectionByUserId(userId);
  if (!conn) throw new XNotConnectedError();

  // Distributed mutex: manual Sync clicks (any tab), cron drains and the
  // signup fast-sync all funnel through here; only one of them may pull the
  // X API for this connection at a time. The TTL self-heals when a
  // serverless instance dies mid-pass.
  const lockKey = REDIS_KEYS_CONFIGS.sync.lock(conn.id);
  const lockToken = await tryAcquireLock(lockKey, SYNC_LOCK_TTL_SECONDS);
  if (!lockToken) throw new SyncBusyError();

  try {
    return await runSyncPass(userId, conn, opts);
  } finally {
    await releaseLock(lockKey, lockToken);
  }
}

async function runSyncPass(
  userId: string,
  conn: XConnection,
  opts: { maxPages?: number; mode?: SyncMode }
): Promise<SyncResult> {
  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(conn);
  } catch (error) {
    await db
      .update(xConnections)
      .set({ syncStatus: "error", lastSyncError: getErrorMessage(error) })
      .where(eq(xConnections.id, conn.id));
    if (error instanceof XReconnectRequiredError) throw error;
    throw new SyncRefreshError(getErrorMessage(error));
  }

  await db
    .update(xConnections)
    .set({ syncStatus: "syncing", lastSyncError: null })
    .where(eq(xConnections.id, conn.id));

  let paginationToken: string | null =
    (opts.mode ?? "resume") === "resume" ? conn.paginationToken : null;
  const mode = opts.mode ?? "resume";
  let added = 0;
  let stoppedReason: SyncStoppedReason = "max-pages";
  let lastError: string | null = null;
  let restartedWithoutToken = false;

  const maxPages = Math.max(1, opts.maxPages ?? MAX_PAGES_PER_SYNC);
  for (let page = 0; page < maxPages; page++) {
    let pageResult;
    try {
      pageResult = await fetchBookmarksPageForUser(
        accessToken,
        conn.xUserId,
        paginationToken
      );
    } catch (error) {
      if (
        error instanceof XApiError &&
        error.kind === "invalid-pagination" &&
        paginationToken &&
        !restartedWithoutToken
      ) {
        // Token expired: restart from the newest page; dedupe by tweet id
        // and stop once a page is fully known ("caught-up").
        paginationToken = null;
        restartedWithoutToken = true;
        continue;
      }
      if (error instanceof XApiError && error.kind === "rate-limit") {
        stoppedReason = "rate-limit";
        break;
      }
      if (error instanceof XApiError && error.kind === "usage-capped") {
        stoppedReason = "usage-capped";
        lastError = error.message;
        break;
      }
      if (error instanceof XApiError && error.kind === "invalid-token") {
        stoppedReason = "auth-error";
        lastError = error.message;
        break;
      }
      throw error;
    }

    const rows = pageResult.bookmarks.map((b) => ({
      userId,
      tweetId: b.tweetId,
      text: b.text,
      authorXId: b.authorXId,
      authorUsername: b.authorUsername,
      authorName: b.authorName,
      authorProfileImageUrl: b.authorProfileImageUrl,
      tweetCreatedAt: b.tweetCreatedAt,
      mediaUrls: b.mediaUrls,
      mediaTypes: b.mediaTypes,
      urls: b.urls,
      metrics: b.metrics,
    }));

    let pageAdded = 0;
    if (rows.length > 0) {
      const inserted = await db
        .insert(bookmarks)
        .values(rows)
        .onConflictDoNothing({
          target: [bookmarks.userId, bookmarks.tweetId],
        })
        .returning({ id: bookmarks.id });
      pageAdded = inserted.length;
    }
    added += pageAdded;

    // Checkpoint after every successful page so the next resume pass
    // continues here; latest-mode passes never touch the stored checkpoint
    // (the background old-backlog crawl owns it).
    paginationToken = pageResult.nextToken ?? null;
    if (mode === "resume") {
      await db
        .update(xConnections)
        .set({ paginationToken })
        .where(eq(xConnections.id, conn.id));
    }
    
    if (!pageResult.nextToken) {
      stoppedReason = "done";
      break;
    }
    if (pageAdded === 0) {
      // Reached already-synced history; everything older is covered too, so
      // any backlog checkpoint is complete.
      stoppedReason = "caught-up";
      paginationToken = null;
      break;
    }
    if (pageResult.rateLimit.remaining === 0) {
      // Proactive stop: window exhausted, keep checkpoint for later resume.
      stoppedReason = "rate-limit";
      break;
    }
    await sleep(PAGE_DELAY_MS);
  }

  const isError =
    stoppedReason === "usage-capped" || stoppedReason === "auth-error";
  await db
    .update(xConnections)
    .set({
      syncStatus: isError ? "error" : "idle",
      lastSyncedAt: new Date(),
      lastSyncAdded: added,
      lastSyncError: lastError,
      paginationToken: mode === "resume" ? paginationToken : conn.paginationToken,
    })
    .where(eq(xConnections.id, conn.id));

  const [pendingRow] = await db
    .select({ value: count() })
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        inArray(bookmarks.status, ["pending", "processing"])
      )
    );

  return {
    added,
    pendingCount: pendingRow?.value ?? 0,
    stoppedReason,
  };
}
