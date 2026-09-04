"use server";

import { ActionResult, actionResponse } from "@/lib/action-response";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { digests, userPreferences } from "@/lib/db/schema";
import {
  isDigestLanguage,
  normalizeDigestLanguage,
  type DigestLanguage,
} from "@/lib/digests/language";
import type { DigestContent } from "@/lib/digests/types";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

export type DigestListItem = {
  id: string;
  weekKey: string;
  periodEnd: Date;
  highlightCount: number;
  bookmarkCount: number;
  emailStatus: string;
  createdAt: Date;
};

export type DigestDetail = DigestListItem & {
  overview: string;
  content: DigestContent;
};

export type DigestPreferences = {
  timeZone: string | null;
  digestHour: number;
  digestEnabled: boolean;
  digestLanguage: DigestLanguage;
};

function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

const PreferencesSchema = z.object({
  timeZone: z.string().max(64).nullable(),
  digestHour: z.coerce.number().int().min(0).max(23),
  digestEnabled: z.boolean(),
});

// Implicit browser-timezone capture (TimezoneReporter). Only touches
// timeZone; the user's explicit hour/enabled choices are preserved.
export async function recordUserTimezone(
  timeZone: string
): Promise<ActionResult<null>> {
  const session = await getSession();
  if (!session?.user?.id) return actionResponse.unauthorized();
  if (typeof timeZone !== "string" || !isValidTimeZone(timeZone)) {
    return actionResponse.badRequest("Invalid time zone.");
  }
  const userId = session.user.id;
  const [existing] = await db
    .select({ timeZone: userPreferences.timeZone })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  if (existing?.timeZone === timeZone) return actionResponse.success(null);
  await db
    .insert(userPreferences)
    .values({ userId, timeZone })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { timeZone },
    });
  return actionResponse.success(null);
}

export async function getDigestPreferences(): Promise<
  ActionResult<DigestPreferences>
> {
  const session = await getSession();
  if (!session?.user?.id) return actionResponse.unauthorized();
  const [row] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, session.user.id))
    .limit(1);
  return actionResponse.success({
    timeZone: row?.timeZone ?? null,
    digestHour: row?.digestHour ?? 9,
    digestEnabled: row?.digestEnabled ?? true,
    digestLanguage: normalizeDigestLanguage(row?.digestLanguage),
  });
}

export async function updateDigestPreferences(
  input: z.input<typeof PreferencesSchema>
): Promise<ActionResult<DigestPreferences>> {
  const session = await getSession();
  if (!session?.user?.id) return actionResponse.unauthorized();
  const parsed = PreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return actionResponse.badRequest("Invalid digest preferences.");
  }
  if (parsed.data.timeZone !== null && !isValidTimeZone(parsed.data.timeZone)) {
    return actionResponse.badRequest("Invalid time zone.");
  }
  const userId = session.user.id;
  await db
    .insert(userPreferences)
    .values({ userId, ...parsed.data })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        timeZone: parsed.data.timeZone,
        digestHour: parsed.data.digestHour,
        digestEnabled: parsed.data.digestEnabled,
      },
    });
  return actionResponse.success(parsed.data);
}

export async function updateDigestLanguage(
  language: string
): Promise<ActionResult<{ digestLanguage: DigestLanguage }>> {
  const session = await getSession();
  if (!session?.user?.id) return actionResponse.unauthorized();
  if (!isDigestLanguage(language)) {
    return actionResponse.badRequest("Invalid digest language.");
  }
  const userId = session.user.id;
  await db
    .insert(userPreferences)
    .values({ userId, digestLanguage: language })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { digestLanguage: language },
    });
  return actionResponse.success({ digestLanguage: language });
}

export async function getDigests(): Promise<ActionResult<DigestListItem[]>> {
  const session = await getSession();
  if (!session?.user?.id) return actionResponse.unauthorized();
  const rows = await db
    .select({
      id: digests.id,
      weekKey: digests.weekKey,
      periodEnd: digests.periodEnd,
      highlightCount: digests.highlightCount,
      bookmarkCount: digests.bookmarkCount,
      emailStatus: digests.emailStatus,
      createdAt: digests.createdAt,
    })
    .from(digests)
    .where(eq(digests.userId, session.user.id))
    .orderBy(desc(digests.createdAt));
  return actionResponse.success(rows);
}

export async function getDigest(id: string): Promise<
  ActionResult<DigestDetail>
> {
  const session = await getSession();
  if (!session?.user?.id) return actionResponse.unauthorized();
  const [row] = await db
    .select()
    .from(digests)
    .where(and(eq(digests.id, id), eq(digests.userId, session.user.id)))
    .limit(1);
  if (!row) return actionResponse.notFound();
  return actionResponse.success({
    id: row.id,
    weekKey: row.weekKey,
    periodEnd: row.periodEnd,
    highlightCount: row.highlightCount,
    bookmarkCount: row.bookmarkCount,
    emailStatus: row.emailStatus,
    createdAt: row.createdAt,
    overview: row.overview,
    content: (row.content ?? {
      highlightGroups: [],
      alsoBookmarked: [],
    }) as DigestContent,
  });
}
