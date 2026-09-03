"use server";

import { ActionResult, actionResponse } from "@/lib/action-response";
import { getSession } from "@/lib/auth/server";
import {
  SyncBusyError,
  SyncRefreshError,
  syncBookmarksForUser,
  XNotConnectedError,
  type SyncResult,
} from "@/lib/bookmarks/sync-core";
import { getErrorMessage } from "@/lib/error-utils";
import { XReconnectRequiredError } from "@/lib/x/connection";

// NOTE: do not re-export types from a "use server" file — the server-actions
// loader evaluates them as values and crashes with "SyncResult is not defined".
// Clients should import these types from "@/lib/bookmarks/sync-core" directly.

export async function syncBookmarks(): Promise<ActionResult<SyncResult>> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  try {
    // Manual Sync means "show me my newest bookmarks": walk from the latest
    // and stop at known history; the cron drain owns the old-backlog crawl.
    // 20 pages covers up to ~2000 fresh bookmarks in one pass.
    return actionResponse.success(
      await syncBookmarksForUser(user.id, { maxPages: 20, mode: "latest" })
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

// Frontend-driven history import: one bounded resume pass over the old
// backlog (the same crawl the cron drain owns). The ImportProgressBanner
// loops this action while a pagination_token checkpoint exists; each pass
// advances and persists the checkpoint, so closing the page and returning
// later continues from where it stopped.
export async function advanceImport(): Promise<ActionResult<SyncResult>> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  try {
    return actionResponse.success(
      await syncBookmarksForUser(user.id, { maxPages: 5, mode: "resume" })
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
    console.error("Error advancing bookmark import", error);
    return actionResponse.error(getErrorMessage(error));
  }
}
