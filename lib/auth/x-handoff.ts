import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "wakemark_x_handoff";
const MAX_AGE_SEC = 10 * 60;

function secret() {
  return process.env.BETTER_AUTH_SECRET || "";
}

function sign(payload: string): string {
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function unsign(value: string): string | null {
  const cut = value.lastIndexOf(".");
  if (cut <= 0) return null;
  const payload = value.slice(0, cut);
  const sig = value.slice(cut + 1);
  const expected = createHmac("sha256", secret()).update(payload).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? payload : null;
}

export async function rememberXHandoff(profile: {
  id: string;
  username: string;
}): Promise<void> {
  if (!secret() || !profile.id || !profile.username) return;
  const payload = `${profile.id}:${profile.username}`;
  const store = await cookies();
  store.set(COOKIE, sign(payload), {
    path: "/",
    maxAge: MAX_AGE_SEC,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function readXHandoffUsername(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;
  const payload = unsign(raw);
  if (!payload) return null;
  const sep = payload.indexOf(":");
  if (sep <= 0) return null;
  const username = payload.slice(sep + 1).trim();
  return username || null;
}
