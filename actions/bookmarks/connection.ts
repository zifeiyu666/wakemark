"use server";

import { ActionResult, actionResponse } from "@/lib/action-response";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { bookmarks, xConnections } from "@/lib/db/schema";
import { getErrorMessage } from "@/lib/error-utils";
import { getXConnectionByUserId } from "@/lib/x/connection";
import { eq } from "drizzle-orm";

export type XConnectionPublic = {
  connected: boolean;
  username?: string | null;
  name?: string | null;
  profileImageUrl?: string | null;
  syncStatus: string;
  lastSyncedAt?: Date | null;
  lastSyncAdded?: number | null;
  lastSyncError?: string | null;
};

export async function getXConnection(): Promise<
  ActionResult<XConnectionPublic>
> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  try {
    const conn = await getXConnectionByUserId(user.id);
    if (!conn) {
      return actionResponse.success({ connected: false, syncStatus: "idle" });
    }
    return actionResponse.success({
      connected: true,
      username: conn.username,
      name: conn.name,
      profileImageUrl: conn.profileImageUrl,
      syncStatus: conn.syncStatus,
      lastSyncedAt: conn.lastSyncedAt,
      lastSyncAdded: conn.lastSyncAdded,
      lastSyncError: conn.lastSyncError,
    });
  } catch (error) {
    console.error("Error getting X connection", error);
    return actionResponse.error(getErrorMessage(error));
  }
}

export async function disconnectX(): Promise<ActionResult> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  try {
    await db.delete(bookmarks).where(eq(bookmarks.userId, user.id));
    await db.delete(xConnections).where(eq(xConnections.userId, user.id));
    return actionResponse.success();
  } catch (error) {
    console.error("Error disconnecting X", error);
    return actionResponse.error(getErrorMessage(error));
  }
}
