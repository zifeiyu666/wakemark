import "server-only";

import { processPendingForUser } from "@/lib/bookmarks/process-core";
import {
  SyncBusyError,
  syncBookmarksForUser,
  XNotConnectedError,
} from "@/lib/bookmarks/sync-core";
import { getErrorMessage } from "@/lib/error-utils";
import { hasBookmarkServiceAccess } from "@/lib/payments/subscription";
import { XReconnectRequiredError } from "@/lib/x/connection";

const LOG = "[bookmarks:catch-up]";

export async function snapshotBookmarkServiceAccess(
  userId: string | null | undefined
): Promise<boolean> {
  if (!userId) return false;
  return hasBookmarkServiceAccess(userId);
}

/**
 * After a provider webhook/verify persist, kick a latest-mode catch-up only
 * when access was just restored (first subscribe or resubscribe). Renewals
 * while already entitled are ignored.
 */
export async function scheduleBookmarkCatchUpIfAccessRestored(
  userId: string | null | undefined,
  hadAccess: boolean
): Promise<void> {
  if (!userId || hadAccess) return;
  if (!(await hasBookmarkServiceAccess(userId))) return;
  triggerCatchUpSync(userId);
}

export function triggerCatchUpSync(userId: string): void {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl || !process.env.CRON_SECRET) {
    console.warn(
      `${LOG} skipped: NEXT_PUBLIC_SITE_URL or CRON_SECRET missing`
    );
    return;
  }
  void fetch(`${siteUrl}/api/internal/catch-up-sync?userId=${userId}`, {
    method: "POST",
    headers: { authorization: process.env.CRON_SECRET },
    cache: "no-store",
  }).catch((error) => {
    console.warn(
      `${LOG} trigger failed for user ${userId}:`,
      error instanceof Error ? error.message : String(error)
    );
  });
}

export type CatchUpResult = {
  skipped?: string;
  added?: number;
  stoppedReason?: string;
  processed?: number;
};

/**
 * Pull newest bookmarks until we hit already-synced history (or the tick
 * budget / X rate limit). Then run a bounded AI pass. Digest is not backfilled.
 */
export async function catchUpBookmarksForUser(
  userId: string
): Promise<CatchUpResult> {
  if (!(await hasBookmarkServiceAccess(userId))) {
    return { skipped: "not-subscribed" };
  }

  const deadline = Date.now() + 240_000;
  let added = 0;
  let stoppedReason = "done";

  try {
    while (Date.now() < deadline - 30_000) {
      const result = await syncBookmarksForUser(userId, {
        maxPages: 5,
        mode: "latest",
      });
      added += result.added;
      stoppedReason = result.stoppedReason;
      if (
        result.stoppedReason === "caught-up" ||
        result.stoppedReason === "done" ||
        result.stoppedReason === "rate-limit" ||
        result.stoppedReason === "usage-capped" ||
        result.stoppedReason === "auth-error"
      ) {
        break;
      }
    }
  } catch (error) {
    if (error instanceof XNotConnectedError) {
      return { skipped: "not-connected" };
    }
    if (error instanceof SyncBusyError) {
      return { skipped: "busy" };
    }
    if (error instanceof XReconnectRequiredError) {
      return { skipped: "auth-error" };
    }
    throw error;
  }

  let processed = 0;
  const budgetLeft = deadline - Date.now();
  if (budgetLeft > 20_000 && process.env.OPENROUTER_API_KEY) {
    try {
      const pass = await processPendingForUser(userId, {
        timeBudgetMs: Math.min(budgetLeft - 10_000, 150_000),
      });
      processed = pass.processed;
    } catch (error) {
      console.warn(
        `${LOG} user ${userId}: AI pass skipped: ${getErrorMessage(error)}`
      );
    }
  }

  return { added, stoppedReason, processed };
}
