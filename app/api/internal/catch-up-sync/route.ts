import { catchUpBookmarksForUser } from "@/lib/bookmarks/catch-up";
import { getErrorMessage } from "@/lib/error-utils";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Fired non-blocking from payment webhooks / verify-success when a user
// first gains or regains an active/trialing subscription. Pulls newest
// bookmarks (gap catch-up) then a bounded AI pass. Same CRON_SECRET auth
// as /api/cron/* and /api/internal/welcome-digest.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const authorized =
    !!secret && (auth === secret || auth === `Bearer ${secret}`);
  if (!authorized) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    const result = await catchUpBookmarksForUser(userId);
    return NextResponse.json({ userId, ...result });
  } catch (error) {
    console.error(
      `[catch-up-sync] user ${userId} failed: ${getErrorMessage(error)}`
    );
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
