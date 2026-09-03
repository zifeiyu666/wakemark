import { processPendingForUser } from "@/lib/bookmarks/process-core";
import { db } from "@/lib/db";
import { user, userPreferences } from "@/lib/db/schema";
import { generateWeeklyDigestForUser } from "@/lib/digests/generate-core";
import { todayWeekKey } from "@/lib/digests/local-time";
import { isSyntheticEmail } from "@/lib/email";
import { getErrorMessage } from "@/lib/error-utils";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Internal one-shot endpoint, fired non-blocking from the OAuth connect hook
// after a brand-new user's first bookmarks page lands (see
// lib/x/connection-store.ts). Runs the bounded AI pass over the first page,
// then generates and emails the welcome digest immediately — independent of
// the Friday weekly schedule. Same CRON_SECRET auth as /api/cron/*.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  // QStash's Upstash-Forward header sends the configured value verbatim,
  // while direct/manual callers commonly use the Bearer convention.
  const authorized =
    !!secret && (auth === secret || auth === `Bearer ${secret}`);
  if (!authorized) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const [account] = await db
    .select({
      email: user.email,
      timeZone: userPreferences.timeZone,
      digestEnabled: userPreferences.digestEnabled,
    })
    .from(user)
    .leftJoin(userPreferences, eq(userPreferences.userId, user.id))
    .where(eq(user.id, userId))
    .limit(1);
  if (!account) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }
  if (account.digestEnabled === false) {
    return NextResponse.json({ skipped: "digest-disabled" });
  }
  // X-login placeholders cannot receive mail; skip the whole pipeline, same
  // as the signup welcome email does.
  if (!account.email || isSyntheticEmail(account.email)) {
    return NextResponse.json({ skipped: "synthetic-email" });
  }

  // Summaries/tags first so the digest highlights match weekly quality.
  // A missing/dead AI provider must not block the welcome digest: the
  // generator degrades to its fallback overview.
  let processed: { processed: number; remaining: number } | null = null;
  try {
    processed = await processPendingForUser(userId, { maxItems: 100 });
  } catch (error) {
    console.warn(
      `[welcome-digest] user ${userId}: AI processing skipped: ${getErrorMessage(error)}`
    );
  }

  const timeZone = account.timeZone ?? "UTC";
  const weekKey = todayWeekKey(timeZone);
  const result = await generateWeeklyDigestForUser(userId, weekKey);

  return NextResponse.json({ userId, weekKey, processed, result });
}

// The connect hook posts; keep GET for manual checks with identical auth.
export async function POST(request: NextRequest) {
  return GET(request);
}
