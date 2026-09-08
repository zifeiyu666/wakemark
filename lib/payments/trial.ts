import "server-only";

import { db, isDatabaseEnabled } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";

export const COMPLIMENTARY_TRIAL_DAYS = 7;
/** Stripe Checkout requires trial_end at least ~48 hours in the future. */
export const PROVIDER_TRIAL_ALIGN_MIN_MS = 48 * 60 * 60 * 1000;

export function complimentaryTrialEndFrom(start: Date): Date {
  return new Date(
    start.getTime() + COMPLIMENTARY_TRIAL_DAYS * 24 * 60 * 60 * 1000
  );
}

export function canAlignProviderTrial(trialEndsAt: Date | null): boolean {
  return (
    !!trialEndsAt &&
    trialEndsAt.getTime() > Date.now() + PROVIDER_TRIAL_ALIGN_MIN_MS
  );
}

/** End of the complimentary signup trial, or null if none is stored. */
export async function getComplimentaryTrialEnd(
  userId: string
): Promise<Date | null> {
  if (!userId || !isDatabaseEnabled) return null;

  const [row] = await db
    .select({ trialEndsAt: user.trialEndsAt })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return row?.trialEndsAt ?? null;
}

export async function hasComplimentaryTrial(userId: string): Promise<boolean> {
  const trialEndsAt = await getComplimentaryTrialEnd(userId);
  return !!trialEndsAt && trialEndsAt > new Date();
}

/**
 * Grant the signup trial once. Later calls are no-ops so an upgrade or a
 * second OAuth identity cannot extend the window.
 */
export async function grantComplimentaryTrial(
  userId: string,
  createdAt: Date = new Date()
): Promise<void> {
  if (!userId || !isDatabaseEnabled) return;

  await db
    .update(user)
    .set({ trialEndsAt: complimentaryTrialEndFrom(createdAt) })
    .where(and(eq(user.id, userId), isNull(user.trialEndsAt)));
}
