"use server";

import { ActionResult, actionResponse } from "@/lib/action-response";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { bookmarks, notionConnections } from "@/lib/db/schema";
import { getErrorMessage } from "@/lib/error-utils";
import { getNotionConnectionByUserId } from "@/lib/notion/connection";
import {
  clearNotionPageBindings,
  createWakemarkDatabase,
  searchNotionPages,
} from "@/lib/notion/pages";
import { deleteNotionConnection } from "@/lib/notion/connection-store";
import { enqueueNotionSyncForUser } from "@/lib/notion/sync-core";
import { hasActiveSubscription } from "@/lib/payments/subscription";
import { and, eq, isNotNull, sql } from "drizzle-orm";

export type NotionConnectionPublic = {
  connected: boolean;
  workspaceName?: string | null;
  parentPageId?: string | null;
  databaseId?: string | null;
  autoSyncEnabled: boolean;
  syncStatus: string;
  lastSyncedAt?: Date | null;
  lastSyncError?: string | null;
  syncedCount: number;
  pendingCount: number;
};

async function requirePaidUser() {
  const session = await getSession();
  const user = session?.user;
  if (!user) return { error: actionResponse.unauthorized() as ActionResult };
  if (!(await hasActiveSubscription(user.id))) {
    return {
      error: actionResponse.error(
        "A paid subscription is required for Notion sync.",
        "not-subscribed"
      ) as ActionResult,
    };
  }
  return { user };
}

export async function getNotionConnection(): Promise<
  ActionResult<NotionConnectionPublic>
> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  const conn = await getNotionConnectionByUserId(user.id);
  if (!conn) {
    return actionResponse.success({
      connected: false,
      autoSyncEnabled: false,
      syncStatus: "idle",
      syncedCount: 0,
      pendingCount: 0,
    });
  }

  const [syncedRow] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(bookmarks)
    .where(
      and(eq(bookmarks.userId, user.id), isNotNull(bookmarks.notionPageId))
    );
  const [pendingRow] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, user.id),
        sql`${bookmarks.deletedAt} is null`,
        sql`${bookmarks.notionPageId} is null`,
        eq(bookmarks.status, "ready")
      )
    );

  return actionResponse.success({
    connected: true,
    workspaceName: conn.workspaceName,
    parentPageId: conn.parentPageId,
    databaseId: conn.databaseId,
    autoSyncEnabled: conn.autoSyncEnabled,
    syncStatus: conn.syncStatus,
    lastSyncedAt: conn.lastSyncedAt,
    lastSyncError: conn.lastSyncError,
    syncedCount: syncedRow?.value ?? 0,
    pendingCount: pendingRow?.value ?? 0,
  });
}

export async function disconnectNotion(): Promise<ActionResult> {
  const gate = await requirePaidUser();
  if (gate.error) return gate.error;

  try {
    await deleteNotionConnection(gate.user!.id);
    return actionResponse.success();
  } catch (error) {
    console.error("Error disconnecting Notion", error);
    return actionResponse.error(getErrorMessage(error));
  }
}

export async function searchNotionParentPages(
  query = ""
): Promise<ActionResult<Array<{ id: string; title: string; url: string }>>> {
  const gate = await requirePaidUser();
  if (gate.error) return gate.error;

  const conn = await getNotionConnectionByUserId(gate.user!.id);
  if (!conn) {
    return actionResponse.error("Notion is not connected.", "not-connected");
  }

  try {
    const pages = await searchNotionPages(conn.accessToken, query);
    return actionResponse.success(pages);
  } catch (error) {
    console.error("Error searching Notion pages", error);
    return actionResponse.error(getErrorMessage(error));
  }
}

export async function setupNotionDatabase(
  parentPageId: string
): Promise<ActionResult<{ databaseId: string }>> {
  const gate = await requirePaidUser();
  if (gate.error) return gate.error;

  const conn = await getNotionConnectionByUserId(gate.user!.id);
  if (!conn) {
    return actionResponse.error("Notion is not connected.", "not-connected");
  }

  try {
    const databaseChanged = conn.databaseId && conn.parentPageId !== parentPageId;
    const databaseId = await createWakemarkDatabase(
      conn.accessToken,
      parentPageId
    );

    await db
      .update(notionConnections)
      .set({
        parentPageId,
        databaseId,
        syncStatus: "idle",
        cursorBookmarkId: null,
        lastSyncError: null,
      })
      .where(eq(notionConnections.userId, gate.user!.id));

    if (databaseChanged) {
      await clearNotionPageBindings(gate.user!.id);
    }

    return actionResponse.success({ databaseId });
  } catch (error) {
    console.error("Error creating Notion database", error);
    return actionResponse.error(getErrorMessage(error));
  }
}

export async function updateNotionAutoSync(
  enabled: boolean
): Promise<ActionResult> {
  const gate = await requirePaidUser();
  if (gate.error) return gate.error;

  const conn = await getNotionConnectionByUserId(gate.user!.id);
  if (!conn?.databaseId) {
    return actionResponse.error(
      "Choose a Notion parent page first.",
      "not-configured"
    );
  }

  try {
    await db
      .update(notionConnections)
      .set({ autoSyncEnabled: enabled })
      .where(eq(notionConnections.userId, gate.user!.id));

    if (enabled) {
      await enqueueNotionSyncForUser(gate.user!.id);
    }

    return actionResponse.success();
  } catch (error) {
    console.error("Error updating Notion auto-sync", error);
    return actionResponse.error(getErrorMessage(error));
  }
}

export async function startNotionSync(
  bookmarkIds?: string[]
): Promise<ActionResult> {
  const gate = await requirePaidUser();
  if (gate.error) return gate.error;

  const conn = await getNotionConnectionByUserId(gate.user!.id);
  if (!conn?.databaseId) {
    return actionResponse.error(
      "Connect Notion and choose a destination database first.",
      "not-configured"
    );
  }

  try {
    await enqueueNotionSyncForUser(gate.user!.id, bookmarkIds, true);
    return actionResponse.success();
  } catch (error) {
    console.error("Error starting Notion sync", error);
    return actionResponse.error(getErrorMessage(error));
  }
}
