import "server-only";

import { syncBookmarksForUser } from "@/lib/bookmarks/sync-core";
import { db } from "@/lib/db";
import { xConnections } from "@/lib/db/schema";
import { fetchXMe } from "@/lib/x/client";
import { encryptText } from "@/lib/x/crypto";

export interface XAccountTokens {
  userId: string;
  accountId: string; // X user id (better-auth account.accountId)
  accessToken: string;
  refreshToken?: string | null;
  accessTokenExpiresAt?: Date | null;
  scope?: string | null;
}

/**
 * Mirror the tokens better-auth just stored for the twitter account into
 * x_connections, which is the source of truth the sync engine reads from.
 * Fired from databaseHooks.account create/update on every X sign-in or
 * linkSocial reconnect.
 */
export async function upsertXConnectionFromAccount(
  account: XAccountTokens
): Promise<void> {
  if (!account.accessToken) return;

  const me = await fetchXMe(account.accessToken);
  const accessTokenExpiresAt =
    account.accessTokenExpiresAt ?? new Date(Date.now() + 7200 * 1000);

  const values = {
    userId: account.userId,
    xUserId: account.accountId,
    username: me.username,
    name: me.name,
    profileImageUrl: me.profileImageUrl,
    accessToken: encryptText(account.accessToken),
    refreshToken: account.refreshToken
      ? encryptText(account.refreshToken)
      : null,
    accessTokenExpiresAt,
    scopes: account.scope,
  };

  const inserted = await db
    .insert(xConnections)
    .values(values)
    .onConflictDoUpdate({
      target: xConnections.userId,
      set: {
        xUserId: values.xUserId,
        username: values.username,
        name: values.name,
        profileImageUrl: values.profileImageUrl,
        accessToken: values.accessToken,
        refreshToken: values.refreshToken ?? undefined,
        accessTokenExpiresAt,
        scopes: values.scopes,
        syncStatus: "idle",
        lastSyncError: null,
      },
    })
    .returning({ id: xConnections.id });

  // Fresh connection (first X login): fast first page so the dashboard
  // renders immediately; the cron drain picks up the historical backlog.
  if (inserted.length > 0) {
    try {
      await syncBookmarksForUser(account.userId, {
        maxPages: 1,
        mode: "latest",
      });
    } catch (syncError) {
      console.warn(
        "X initial fast sync skipped:",
        syncError instanceof Error ? syncError.message : String(syncError)
      );
    }
  }
}
