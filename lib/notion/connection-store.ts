import "server-only";

import { db } from "@/lib/db";
import { notionConnections } from "@/lib/db/schema";
import { encryptText } from "@/lib/x/crypto";
import { eq } from "drizzle-orm";

export type NotionOAuthTokenResponse = {
  access_token: string;
  bot_id: string;
  workspace_id: string;
  workspace_name?: string;
};

export async function upsertNotionConnectionFromOAuth(
  userId: string,
  token: NotionOAuthTokenResponse
): Promise<void> {
  const values = {
    userId,
    accessToken: encryptText(token.access_token),
    botId: token.bot_id,
    workspaceId: token.workspace_id,
    workspaceName: token.workspace_name ?? null,
  };

  await db
    .insert(notionConnections)
    .values(values)
    .onConflictDoUpdate({
      target: notionConnections.userId,
      set: {
        accessToken: values.accessToken,
        botId: values.botId,
        workspaceId: values.workspaceId,
        workspaceName: values.workspaceName,
        syncStatus: "idle",
        lastSyncError: null,
      },
    });
}

export async function deleteNotionConnection(userId: string): Promise<void> {
  await db
    .delete(notionConnections)
    .where(eq(notionConnections.userId, userId));
}
