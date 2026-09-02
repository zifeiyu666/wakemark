"use server";

import { actionResponse, type ActionResult } from "@/lib/action-response";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { userPreferences } from "@/lib/db/schema";
import { getErrorMessage } from "@/lib/error-utils";

/**
 * Marks the new-user onboarding tour as completed. Called both when the user
 * finishes the last step and when they skip / dismiss the dialog, so the tour
 * never re-opens once seen.
 */
export async function completeOnboarding(): Promise<ActionResult<null>> {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return actionResponse.unauthorized();

    const completedAt = new Date();
    await db
      .insert(userPreferences)
      .values({ userId, onboardingCompletedAt: completedAt })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { onboardingCompletedAt: completedAt },
      });
    return actionResponse.success(null);
  } catch (error) {
    console.error("Error completing onboarding", error);
    return actionResponse.error(getErrorMessage(error));
  }
}
