"use server";

import { ActionResult, actionResponse } from "@/lib/action-response";
import { getSession } from "@/lib/auth/server";
import {
  SubscriptionRequiredError,
  SyncBusyError,
  SyncRefreshError,
  syncBookmarksForUser,
  XNotConnectedError,
  type SyncResult,
} from "@/lib/bookmarks/sync-core";
import { getErrorMessage } from "@/lib/error-utils";
import { hasActiveSubscription } from "@/lib/payments/subscription";
import { XReconnectRequiredError } from "@/lib/x/connection";

export async function syncBookmarks(): Promise<ActionResult<SyncResult>> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  if (!(await hasActiveSubscription(user.id))) {
    return actionResponse.error(
      "A paid subscription is required for manual bookmark sync.",
      "not-subscribed"
    );
  }

  try {
    // Incremental only: newest page (20 tweets), plus up to 2 more pages if
    // every tweet on the previous page was new. Never paginates into history.
    return actionResponse.success(
      await syncBookmarksForUser(user.id, { maxPages: 3, mode: "latest" })
    );
  } catch (error) {
    if (error instanceof SyncBusyError) {
      return actionResponse.error(
        "A sync is already in progress. Please try again in a moment.",
        "sync-busy"
      );
    }
    if (error instanceof XNotConnectedError) {
      return actionResponse.error("X account not connected.", "not-connected");
    }
    if (error instanceof SubscriptionRequiredError) {
      return actionResponse.error(
        "An active subscription is required to sync bookmarks.",
        "not-subscribed"
      );
    }
    if (error instanceof XReconnectRequiredError) {
      return actionResponse.error(
        "X authorization expired. Please reconnect your X account.",
        "auth-error"
      );
    }
    if (error instanceof SyncRefreshError) {
      return actionResponse.error(
        "X token refresh failed. Please try again in a moment.",
        "refresh-failed"
      );
    }
    console.error("Error syncing bookmarks", error);
    return actionResponse.error(getErrorMessage(error));
  }
}
