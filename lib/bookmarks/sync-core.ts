import "server-only";

import {
  insertBookmarkBatch,
  pendingCountFor,
} from "@/lib/bookmarks/ingest";
import { db } from "@/lib/db";
import { xConnections } from "@/lib/db/schema";
import { getErrorMessage } from "@/lib/error-utils";
import { getTrialDailyApiSyncRemaining } from "@/lib/payments/trial-sync-limit";
import { hasBookmarkServiceAccess } from "@/lib/payments/subscription";
import { releaseLock, tryAcquireLock } from "@/lib/upstash/lock";
import { REDIS_KEYS_CONFIGS } from "@/lib/upstash/redis-keys";
import { fetchBookmarksPageForUser, XApiError } from "@/lib/x/client";
import {
  getValidAccessToken,
  getXConnectionByUserId,
  type XConnection,
  XReconnectRequiredError,
} from "@/lib/x/connection";
import { eq } from "drizzle-orm";

// Incremental API sync only: 20 tweets per page. Continue to the next page
// solely when the current page is 100% new (power-user burst), never to crawl
// historical bookmarks. Cap at 3 pages (~60 newest) per pass.
const LATEST_MAX_PAGES = 3;
const PAGE_DELAY_MS = 400;

export type SyncStoppedReason =
  | "done" // no next_token on the newest page
  | "max-pages" // per-run page budget reached (all pages were new)
  | "rate-limit" // 429 window or remaining=0
  | "usage-capped" // billing cap, do not retry
  | "trial-daily-limit" // complimentary trial daily API insert cap
  | "caught-up" // page contained already-synced tweets
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

export class SyncRefreshError extends Error {
  constructor(detail: string) {
    super(`X token refresh failed: ${detail}`);
    this.name = "SyncRefreshError";
  }
}

export class SyncBusyError extends Error {
  constructor() {
    super("A sync for this connection is already in progress.");
    this.name = "SyncBusyError";
  }
}

export class SubscriptionRequiredError extends Error {
  constructor() {
    super("An active subscription is required to sync bookmarks.");
    this.name = "SubscriptionRequiredError";
  }
}

const SYNC_LOCK_TTL_SECONDS = 120;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Pull a bounded incremental pass of the newest bookmarks (session-less so
 * cron can call it). Historical backfill is the Chrome extension's job —
 * this never walks stored pagination_token checkpoints.
 *
 * `mode` is accepted for call-site compatibility; both "latest" and the
 * deprecated "resume" alias run the same newest-first incremental pass.
 */
export type SyncMode = "resume" | "latest";

export async function syncBookmarksForUser(
  userId: string,
  opts: { maxPages?: number; mode?: SyncMode } = {}
): Promise<SyncResult> {
  if (!(await hasBookmarkServiceAccess(userId))) {
    throw new SubscriptionRequiredError();
  }

  const conn = await getXConnectionByUserId(userId);
  if (!conn) throw new XNotConnectedError();

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

  // Always start from the newest page. In-pass pagination_token is only used
  // when the previous page was entirely new (more than 20 bookmarks since
  // last sync) — never loaded from the historical checkpoint column.
  let paginationToken: string | null = null;
  let added = 0;
  let stoppedReason: SyncStoppedReason = "max-pages";
  let lastError: string | null = null;
  let newestTweetId: string | null = conn.lastSyncedTweetId;

  const requested = opts.maxPages ?? 1;
  const maxPages = Math.min(LATEST_MAX_PAGES, Math.max(1, requested));

  let trialInsertBudget = await getTrialDailyApiSyncRemaining(userId);
  if (trialInsertBudget === 0) {
    return {
      added: 0,
      pendingCount: await pendingCountFor(userId),
      stoppedReason: "trial-daily-limit",
    };
  }

  for (let page = 0; page < maxPages; page++) {
    let pageResult;
    try {
      pageResult = await fetchBookmarksPageForUser(
        accessToken,
        conn.xUserId,
        paginationToken
      );
    } catch (error) {
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

    if (page === 0 && pageResult.bookmarks[0]?.tweetId) {
      newestTweetId = pageResult.bookmarks[0].tweetId;
    }

    const pageBookmarks =
      Number.isFinite(trialInsertBudget) &&
      trialInsertBudget < pageResult.bookmarks.length
        ? pageResult.bookmarks.slice(0, trialInsertBudget)
        : pageResult.bookmarks;

    const ingest = await insertBookmarkBatch(userId, pageBookmarks, "api");
    added += ingest.inserted;

    if (Number.isFinite(trialInsertBudget)) {
      trialInsertBudget = Math.max(0, trialInsertBudget - ingest.inserted);
      if (trialInsertBudget === 0) {
        stoppedReason = "trial-daily-limit";
        break;
      }
    }

    const pageSize = pageResult.bookmarks.length;
    const entirePageNew =
      pageBookmarks.length > 0 &&
      ingest.inserted === pageBookmarks.length &&
      pageBookmarks.length === pageSize;

    if (!pageResult.nextToken) {
      stoppedReason = "done";
      break;
    }
    if (!entirePageNew) {
      // Hit already-synced tweets (or an empty page). Stop — older history
      // is not fetched via the official API.
      stoppedReason = "caught-up";
      break;
    }
    if (pageResult.rateLimit.remaining === 0) {
      stoppedReason = "rate-limit";
      break;
    }
    if (page + 1 >= maxPages) {
      stoppedReason = "max-pages";
      break;
    }
    paginationToken = pageResult.nextToken;
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
      paginationToken: null,
      initialApiSyncCompleted: true,
      lastSyncedTweetId: newestTweetId,
    })
    .where(eq(xConnections.id, conn.id));

  return {
    added,
    pendingCount: await pendingCountFor(userId),
    stoppedReason,
  };
}
