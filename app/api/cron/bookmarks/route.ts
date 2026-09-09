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
function cronLog(event: string, payload: Record<string, unknown>) {
  console.log(
    `[bookmarks:cron] ${event} ${JSON.stringify(payload)}`
  );
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const authorized =
    !!secret && (auth === secret || auth === `Bearer ${secret}`);
  if (!authorized) {
    cronLog("unauthorized", {
      hasSecret: Boolean(secret),
      hasAuthHeader: Boolean(auth),
    });
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const jobParam = request.nextUrl.searchParams.get("job");
  const job = jobParam === "daily" ? "daily" : "drain";
  const configured = Number(process.env.CRON_TICK_BUDGET_MS ?? 240_000);
  const tickBudgetMs = Math.min(
    Number.isFinite(configured) && configured > 0 ? configured : 240_000,
    280_000
  );
  const deadline = Date.now() + tickBudgetMs;
  const startedAt = Date.now();

  const connections = await db.select().from(xConnections);
  cronLog("start", {
    job,
    jobParam,
    method: request.method,
    connections: connections.length,
    tickBudgetMs,
  });

  const results: Array<Record<string, unknown>> = [];
  let skippedDeadline = 0;

  for (const conn of connections) {
    if (Date.now() >= deadline) {
      skippedDeadline = connections.length - results.length;
      cronLog("deadline", {
        remaining: skippedDeadline,
        elapsedMs: Date.now() - startedAt,
      });
      break;
    }
    const entry: Record<string, unknown> = {
      userId: conn.userId,
      username: conn.username,
    };
    try {
      if (!(await hasBookmarkServiceAccess(conn.userId))) {
        entry.reason = "not-subscribed";
        results.push(entry);
        cronLog("user", entry);
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
      } else if (job !== "daily") {
        entry.reason = "drain-only";
      } else if (syncInFlight) {
        entry.reason = "sync-in-flight";
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
    cronLog("user", entry);
  }

  const summary = {
    job,
    users: results.length,
    skippedDeadline,
    elapsedMs: Date.now() - startedAt,
    synced: results.filter((r) => r.sync).length,
    errors: results.filter((r) => r.error).length,
    skipped: results.filter((r) => r.reason).length,
  };
  cronLog("done", summary);

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
