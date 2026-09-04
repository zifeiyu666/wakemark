import { generateWeeklyDigestForUser } from "@/lib/digests/generate-core";
import { fridayWeekKey, getLocalParts } from "@/lib/digests/local-time";
import { db } from "@/lib/db";
import { digests, userPreferences, xConnections } from "@/lib/db/schema";
import { getErrorMessage } from "@/lib/error-utils";
import { hasBookmarkServiceAccess } from "@/lib/payments/subscription";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Scheduled externally by Upstash QStash (see README): one tick per hour
// (`0 * * * *`). Each tick checks every subscribed connected user's LOCAL
// clock — when it is Friday and past their preferred hour in their own
// timezone, and no digest exists for that local week (week_key), the weekly
// digest is generated and emailed. Unsubscribed users are skipped. IANA
// time zones + Intl handle DST; no per-user schedules are needed.
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

  // Fast path: it is Friday somewhere on Earth only between Thursday 10:00
  // UTC (UTC+14 just hit Friday midnight) and Saturday 12:00 UTC (UTC-12
  // just left Friday). Outside that window no user can be in their send
  // window, so return without touching the database — keeps the Neon
  // serverless instance suspended for most hourly ticks.
  const utcSlot = new Date().getUTCDay() * 24 + new Date().getUTCHours();
  if (utcSlot < 4 * 24 + 10 || utcSlot >= 6 * 24 + 12) {
    return NextResponse.json({
      job: "weekly",
      skipped: "no-local-friday-anywhere",
    });
  }

  const configured = Number(process.env.CRON_TICK_BUDGET_MS ?? 240_000);
  const tickBudgetMs = Math.min(
    Number.isFinite(configured) && configured > 0 ? configured : 240_000,
    280_000
  );
  const deadline = Date.now() + tickBudgetMs;

  const rows = await db
    .select({
      userId: xConnections.userId,
      timeZone: userPreferences.timeZone,
      digestHour: userPreferences.digestHour,
      digestEnabled: userPreferences.digestEnabled,
    })
    .from(xConnections)
    .leftJoin(userPreferences, eq(xConnections.userId, userPreferences.userId));

  const results: Array<Record<string, unknown>> = [];
  let digested = 0;
  let skipped = 0;

  for (const row of rows) {
    if (Date.now() >= deadline) break;
    const entry: Record<string, unknown> = { userId: row.userId };
    try {
      if (row.digestEnabled === false) {
        entry.reason = "disabled";
        skipped += 1;
        results.push(entry);
        continue;
      }
      if (!(await hasBookmarkServiceAccess(row.userId))) {
        entry.reason = "not-subscribed";
        skipped += 1;
        results.push(entry);
        continue;
      }
      const timeZone = row.timeZone ?? "UTC";
      const weekKey = fridayWeekKey(timeZone);
      if (!weekKey) {
        // Not Friday in this user's timezone yet.
        skipped += 1;
        continue;
      }
      const { hour } = getLocalParts(timeZone);
      const digestHour = row.digestHour ?? 9;
      if (hour < digestHour) {
        entry.reason = "before-local-hour";
        skipped += 1;
        results.push(entry);
        continue;
      }
      const [existing] = await db
        .select({ id: digests.id })
        .from(digests)
        .where(
          and(eq(digests.userId, row.userId), eq(digests.weekKey, weekKey))
        )
        .limit(1);
      if (existing) {
        entry.reason = "already-digested";
        skipped += 1;
        results.push(entry);
        continue;
      }

      entry.weekKey = weekKey;
      entry.timeZone = timeZone;
      entry.result = await generateWeeklyDigestForUser(row.userId, weekKey);
      if (entry.result) digested += 1;
      else skipped += 1;
    } catch (error) {
      // Per-user isolation: one broken account must not stop the tick.
      entry.error = getErrorMessage(error);
      console.error(`[digests:cron] user ${row.userId} tick failed`, error);
    }
    results.push(entry);
  }

  return NextResponse.json({
    job: "weekly",
    tickBudgetMs,
    users: results.length,
    digested,
    skipped,
    results,
  });
}

// QStash schedules use POST by default. Keep GET for manual checks and expose
// the same authenticated behavior for QStash's POST delivery.
export async function POST(request: NextRequest) {
  return GET(request);
}
