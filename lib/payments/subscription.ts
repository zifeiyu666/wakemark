import 'server-only';

import { db, isDatabaseEnabled } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";

/**
 * The project has no credit system: the single condition to provide the
 * service is a valid subscription (paid or trialing). These statuses match
 * the convention used across payment webhooks and verify-success handlers.
 */
const ACTIVE_STATUSES = ["active", "trialing"];

export type SubscriptionRow = typeof subscriptions.$inferSelect;

/**
 * Returns a subscription that currently grants access, otherwise null.
 *
 * A subscription grants access when its status is `active` or `trialing`
 * and its trial / billing period has not ended yet (webhooks may lag, so
 * the timestamps are re-checked here).
 */
export async function getActiveSubscription(
  userId: string
): Promise<SubscriptionRow | null> {
  if (!userId || !isDatabaseEnabled) return null;

  const subscriptionsForUser = await db
    .select()
    .from(subscriptions)
    .where(and(
      eq(subscriptions.userId, userId),
      inArray(subscriptions.status, ACTIVE_STATUSES)
    ))
    .orderBy(desc(subscriptions.createdAt))
    .limit(10);

  const now = new Date();
  for (const subscription of subscriptionsForUser) {
    // Only trialing subscriptions use trialEnd. Once a subscription converts
    // to active, providers may retain the historical trialEnd value.
    if (
      subscription.status === "trialing" &&
      subscription.trialEnd &&
      new Date(subscription.trialEnd) <= now
    ) {
      continue;
    }

    // Re-check the billing period locally in case the provider webhook lags.
    if (
      subscription.status === "active" &&
      subscription.currentPeriodEnd &&
      new Date(subscription.currentPeriodEnd) <= now
    ) {
      continue;
    }

    return subscription;
  }

  return null;
}

/** Single global gate: does this user currently have a subscription? */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  return (await getActiveSubscription(userId)) !== null;
}

/**
 * Background bookmark sync, AI tagging, and digest email may run without a
 * session. Product access follows the same gate as the dashboard menus: an
 * active or trialing subscription. Admin role only unlocks the ops dashboard.
 */
export async function hasBookmarkServiceAccess(
  userId: string
): Promise<boolean> {
  return hasActiveSubscription(userId);
}
