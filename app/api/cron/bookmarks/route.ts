import { processPendingForUser } from "@/lib/bookmarks/process-core";
import {
  SyncBusyError,
  SyncRefreshError,
  syncBookmarksForUser,
  XNotConnectedError,
} from "@/lib/bookmarks/sync-core";
import { db } from "@/lib/db";
import { xConnections } from "@/lib/db/schema";
import { getErrorMessage } from "@/lib/error-utils";
import { XReconnectRequiredError } from "@/lib/x/connection";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// This endpoint is scheduled externally by Upstash QStash (see README). Vercel
// Cron is intentionally disabled so the app remains compatible with the Hobby
// plan. QStash should call `?job=drain` frequently to advance unfinished
// initial imports and the AI backlog; `?job=daily` can be scheduled separately
// when a daily fresh sync is desired.
// The DB is the queue (pagination_token checkpoint + pending row statuses), so
// each invocation is bounded, resumable and idempotent. If drain is restored
// on a frequent external schedule, keep its interval above the tick budget.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  // QStash's Upstash-Forward header sends the configured value verbatim,
  // while direct/manual callers commonly use the Bearer convention. Accept
  // both forms without exposing the secret in logs or responses.
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
      // drain: continue unfinished first imports (checkpoint present) and
      // never-synced accounts; daily: everyone gets a fresh pass. Skip users
      // whose manual Sync is currently in flight (fresh 'syncing' status) so
      // cron never races the foreground for X quota; stale 'syncing' from a
      // killed tick (>10 min) is ignored and self-heals here.
      const syncInFlight =
        conn.syncStatus === "syncing" &&
        conn.updatedAt.getTime() > Date.now() - 10 * 60 * 1000;
      const needsSync =
        !syncInFlight &&
        (job === "daily" ||
          conn.paginationToken !== null ||
          conn.lastSyncedAt === null);
      if (needsSync) {
        entry.sync = await syncBookmarksForUser(conn.userId, {
          // daily catches up newest-first; drain (default resume mode)
          // continues the old-backlog checkpoint instead.
          mode: job === "daily" ? "latest" : "resume",
        });
      }

      const budgetLeft = deadline - Date.now();
      if (budgetLeft > 60_000 && process.env.OPENROUTER_API_KEY) {
        entry.process = await processPendingForUser(conn.userId, {
          timeBudgetMs: Math.min(budgetLeft - 30_000, 150_000),
        });
      }
    } catch (error) {
      // Per-user isolation: one broken connection must not stop the tick.
      entry.error = getErrorMessage(error);
      const expected =
        error instanceof XNotConnectedError ||
        error instanceof XReconnectRequiredError ||
        error instanceof SyncRefreshError ||
        // Foreground Sync holds the distributed lock: skip and revisit on a
        // later tick without alarming the logs.
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

// QStash schedules use POST by default. Keep GET for manual checks and expose
// the same authenticated behavior for QStash's POST delivery.
export async function POST(request: NextRequest) {
  return GET(request);
}
