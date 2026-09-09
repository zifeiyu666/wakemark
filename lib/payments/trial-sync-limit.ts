import "server-only";

import { db } from "@/lib/db";
import { bookmarks } from "@/lib/db/schema";
import {
  hasActiveSubscription,
} from "@/lib/payments/subscription";
import { hasComplimentaryTrial } from "@/lib/payments/trial";
import { and, count, eq, gte } from "drizzle-orm";

export const TRIAL_DAILY_API_SYNC_LIMIT = 10;

function startOfUtcDay(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

/** Paid plan — unlimited API sync. Complimentary trial only — daily cap. */
export async function isComplimentaryTrialOnly(
  userId: string
): Promise<boolean> {
  if (await hasActiveSubscription(userId)) return false;
  return hasComplimentaryTrial(userId);
}

export async function countApiBookmarksSyncedToday(
  userId: string
): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.syncedVia, "api"),
        gte(bookmarks.syncedAt, startOfUtcDay())
      )
    );
  return Number(row?.n ?? 0);
}

export async function getTrialDailyApiSyncRemaining(
  userId: string
): Promise<number> {
  if (!(await isComplimentaryTrialOnly(userId))) {
    return Number.POSITIVE_INFINITY;
  }
  const used = await countApiBookmarksSyncedToday(userId);
  return Math.max(0, TRIAL_DAILY_API_SYNC_LIMIT - used);
}
