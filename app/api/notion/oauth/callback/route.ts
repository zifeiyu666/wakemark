import { upsertNotionConnectionFromOAuth } from "@/lib/notion/connection-store";
import { decryptText } from "@/lib/x/crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const STATE_COOKIE = "notion_oauth_state";

function getRedirectUri(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL is not configured");
  }
  return `${siteUrl.replace(/\/$/, "")}/api/notion/oauth/callback`;
}

function settingsUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${siteUrl.replace(/\/$/, "")}/dashboard/settings?notion=connected`;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const savedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(`${settingsUrl()}&notion=error`);
  }

  let payload: { userId: string; nonce: string; ts: number };
  try {
    payload = JSON.parse(decryptText(state));
  } catch {
    return NextResponse.redirect(`${settingsUrl()}&notion=error`);
  }

  const clientId = process.env.NOTION_CLIENT_ID;
  const clientSecret = process.env.NOTION_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${settingsUrl()}&notion=error`);
  }

  const tokenResponse = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(),
    }),
  });

  if (!tokenResponse.ok) {
    console.error(
      "[notion:oauth] token exchange failed:",
      await tokenResponse.text()
    );
    return NextResponse.redirect(`${settingsUrl()}&notion=error`);
  }

  const token = (await tokenResponse.json()) as {
    access_token: string;
    bot_id: string;
    workspace_id: string;
    workspace_name?: string;
  };

  await upsertNotionConnectionFromOAuth(payload.userId, token);
  return NextResponse.redirect(settingsUrl());
}
