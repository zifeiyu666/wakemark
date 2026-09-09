import { getSession } from "@/lib/auth/server";
import { hasActiveSubscription } from "@/lib/payments/subscription";
import { encryptText } from "@/lib/x/crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

const STATE_COOKIE = "notion_oauth_state";
const STATE_TTL_SECONDS = 600;

function getRedirectUri(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL is not configured");
  }
  return `${siteUrl.replace(/\/$/, "")}/api/notion/oauth/callback`;
}

export async function GET() {
  const session = await getSession();
  const user = session?.user;
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!(await hasActiveSubscription(user.id))) {
    return NextResponse.json({ error: "not-subscribed" }, { status: 403 });
  }

  const clientId = process.env.NOTION_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "not-configured" }, { status: 503 });
  }

  const nonce = randomBytes(16).toString("hex");
  const state = encryptText(
    JSON.stringify({ userId: user.id, nonce, ts: Date.now() })
  );

  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: STATE_TTL_SECONDS,
    path: "/",
  });

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    owner: "user",
    redirect_uri: getRedirectUri(),
    state,
  });

  return NextResponse.redirect(
    `https://api.notion.com/v1/oauth/authorize?${params.toString()}`
  );
}
