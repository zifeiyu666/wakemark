import { getSession } from "@/lib/auth/server";
import { syncBookmarksForUser } from "@/lib/bookmarks/sync-core";
import { db } from "@/lib/db";
import { xConnections } from "@/lib/db/schema";
import { decryptText, encryptText } from "@/lib/x/crypto";
import { fetchXMe } from "@/lib/x/client";
import { exchangeCodeForTokens } from "@/lib/x/oauth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function redirectToDashboard(request: Request, error?: string) {
  const url = new URL("/dashboard/bookmarks", request.url);
  if (error) url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const session = await getSession();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (url.searchParams.get("error")) {
    return redirectToDashboard(request, "denied");
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const pkceCookie = cookieStore.get("x_pkce")?.value;

  if (!code || !state || !pkceCookie) {
    return redirectToDashboard(request, "invalid");
  }

  let payload: { state?: string; codeVerifier?: string };
  try {
    payload = JSON.parse(decryptText(pkceCookie));
  } catch {
    return redirectToDashboard(request, "invalid");
  }
  if (!payload.state || payload.state !== state || !payload.codeVerifier) {
    return redirectToDashboard(request, "invalid");
  }

  const response = redirectToDashboard(request);
  response.cookies.set("x_pkce", "", { maxAge: 0, path: "/" });

  try {
    const redirectUri = new URL("/api/x/callback", request.url).toString();
    const tokens = await exchangeCodeForTokens({
      code,
      codeVerifier: payload.codeVerifier,
      redirectUri,
    });
    const me = await fetchXMe(tokens.accessToken);

    const accessTokenExpiresAt = new Date(
      Date.now() + tokens.expiresIn * 1000
    );
    const values = {
      userId: session.user.id,
      xUserId: me.id,
      username: me.username,
      name: me.name,
      profileImageUrl: me.profileImageUrl,
      accessToken: encryptText(tokens.accessToken),
      refreshToken: tokens.refreshToken
        ? encryptText(tokens.refreshToken)
        : null,
      accessTokenExpiresAt,
      scopes: tokens.scope,
    };

    await db
      .insert(xConnections)
      .values(values)
      .onConflictDoUpdate({
        target: xConnections.userId,
        set: {
          xUserId: me.id,
          username: me.username,
          name: me.name,
          profileImageUrl: me.profileImageUrl,
          accessToken: encryptText(tokens.accessToken),
          refreshToken: tokens.refreshToken
            ? encryptText(tokens.refreshToken)
            : undefined,
          accessTokenExpiresAt,
          scopes: tokens.scope,
          syncStatus: "idle",
          lastSyncError: null,
        },
      });

    // Fast first page so the dashboard renders immediately ("instant sync");
    // the cron drain picks up the historical backlog in the background. Never
    // block the redirect on this.
    try {
      await syncBookmarksForUser(session.user.id, {
        maxPages: 1,
        mode: "latest",
      });
    } catch (syncError) {
      console.warn(
        "X initial fast sync skipped:",
        syncError instanceof Error ? syncError.message : String(syncError)
      );
    }
  } catch (error) {
    console.error("X OAuth callback failed", error);
    return redirectToDashboard(request, "failed");
  }

  return response;
}
