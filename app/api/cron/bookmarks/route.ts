import { processPendingForUser } from "@/lib/bookmarks/process-core";
import {
  SubscriptionRequiredError,
  SyncBusyError,
  SyncRefreshError,
  syncBookmarksForUser,
  XNotConnectedError,
} from "@/lib/bookmarks/sync-core";
import { db } from "@/lib/db";
import { xConnections } from "@/lib/db/schema";
import { getErrorMessage } from "@/lib/error-utils";
import { hasBookmarkServiceAccess } from "@/lib/payments/subscription";
import { XReconnectRequiredError } from "@/lib/x/connection";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Scheduled by Upstash QStash (see README). `?job=daily` runs a newest-page
// incremental X API sync (max 20 tweets, up to 3 pages if all new) for every
// entitled connection, then drains the AI pending queue.
// `?job=drain` is kept as an alias that only processes the AI queue — it no
// longer paginates historical bookmarks via the official API.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const authorized =
    !!secret && (auth === secret || auth === `Bearer ${secret}`);
  if (!authorized) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const job =
    request.nextUrl.searchParams.get("job") === "daily" ? "daily" : "drain";
  const configured = Number(process.env.CRON_TICK_BUDGET_MS ?? 240_000);
  const tickBudgetMs = Math.min(
    Number.isFinite(configured) && configured > 0 ? configured : 240_000,
    280_000
  );
  const deadline = Date.now() + tickBudgetMs;

  const connections = await db.select().from(xConnections);
  const results: Array<Record<string, unknown>> = [];

  for (const conn of connections) {
    if (Date.now() >= deadline) break;
    const entry: Record<string, unknown> = { userId: conn.userId };
    try {
      if (!(await hasBookmarkServiceAccess(conn.userId))) {
        entry.reason = "not-subscribed";
        results.push(entry);
        continue;
      }
      const syncInFlight =
        conn.syncStatus === "syncing" &&
        conn.updatedAt.getTime() > Date.now() - 10 * 60 * 1000;
      if (job === "daily" && !syncInFlight) {
        entry.sync = await syncBookmarksForUser(conn.userId, {
          maxPages: 3,
          mode: "latest",
        });
      }

      const budgetLeft = deadline - Date.now();
      if (budgetLeft > 60_000 && process.env.OPENROUTER_API_KEY) {
        entry.process = await processPendingForUser(conn.userId, {
          timeBudgetMs: Math.min(budgetLeft - 30_000, 150_000),
        });
      }
    } catch (error) {
      entry.error = getErrorMessage(error);
      const expected =
        error instanceof XNotConnectedError ||
        error instanceof XReconnectRequiredError ||
        error instanceof SyncRefreshError ||
        error instanceof SubscriptionRequiredError ||
        error instanceof SyncBusyError;
      if (!expected) {
        console.error(
          `[bookmarks:cron] user ${conn.userId} tick failed`,
          error
        );
      }
    }
    results.push(entry);
  }

  return NextResponse.json({
    job,
    tickBudgetMs,
    users: results.length,
    results,
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
