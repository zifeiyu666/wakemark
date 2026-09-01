import "server-only";

import { BOOKMARK_CATEGORIES } from "@/config/bookmark-categories";
import { db } from "@/lib/db";
import { bookmarkTags } from "@/lib/db/schema";
import { and, asc, desc, eq, gt, sql } from "drizzle-orm";

// Primary categories already have their own filter chips; keep them out of
// the custom-tag pool so chips never duplicate.
const CATEGORY_SET = new Set<string>(BOOKMARK_CATEGORIES);

// Compute +1/-1 deltas between the old and new subTags of one bookmark.
export function tagDeltas(
  oldTags: string[],
  newTags: string[]
): Map<string, number> {
  const deltas = new Map<string, number>();
  for (const tag of oldTags) {
    const trimmed = tag.trim();
    if (trimmed) deltas.set(trimmed, (deltas.get(trimmed) ?? 0) - 1);
  }
  for (const tag of newTags) {
    const trimmed = tag.trim();
    if (trimmed) deltas.set(trimmed, (deltas.get(trimmed) ?? 0) + 1);
  }
  return deltas;
}

// Apply usage deltas in one upsert; rows that drop to zero are removed so the
// table only holds live tags. Optional per-tag palette color is set on insert
// and refreshed whenever provided again.
export async function applyTagDeltas(
  userId: string,
  deltas: Map<string, number>,
  colors?: Map<string, string>
): Promise<void> {
  const entries = [...deltas.entries()].filter(
    ([name, delta]) => delta !== 0 && !CATEGORY_SET.has(name)
  );
  if (entries.length === 0) return;
  const values = entries.map(
    ([name, delta]) =>
      sql`(${userId}, ${name}, ${delta}, ${colors?.get(name) ?? null})`
  );
  await db.execute(sql`
    INSERT INTO bookmark_tags (user_id, name, usage, color)
    VALUES ${sql.join(values, sql`, `)}
    ON CONFLICT (user_id, name) DO UPDATE
      SET usage = bookmark_tags.usage + EXCLUDED.usage,
          color = COALESCE(EXCLUDED.color, bookmark_tags.color),
          updated_at = now()
  `);
  await db.execute(
    sql`DELETE FROM bookmark_tags WHERE user_id = ${userId} AND usage <= 0`
  );
}

// The user's live tag pool, most-used first. Backs both the AI-tagging
// whitelist and the filter bar's custom tag chips.
export async function listUserTags(
  userId: string,
  limit = 100
): Promise<Array<{ name: string; color: string | null }>> {
  const rows = await db
    .select({ name: bookmarkTags.name, color: bookmarkTags.color })
    .from(bookmarkTags)
    .where(and(eq(bookmarkTags.userId, userId), gt(bookmarkTags.usage, 0)))
    .orderBy(desc(bookmarkTags.usage), asc(bookmarkTags.name))
    .limit(limit);
  return rows;
}
