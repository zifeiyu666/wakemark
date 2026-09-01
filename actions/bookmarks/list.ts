"use server";

import { ActionResult, actionResponse } from "@/lib/action-response";
import { getSession } from "@/lib/auth/server";
import {
  isBookmarkCategory,
  isTagColorId,
} from "@/config/bookmark-categories";
import {
  applyTagDeltas,
  listUserTags,
  tagDeltas,
} from "@/lib/bookmarks/tag-counts";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/db/schema";
import { getErrorMessage } from "@/lib/error-utils";
import { and, count, desc, asc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";

const PAGE_SIZE_DEFAULT = 24;

const FilterSchema = z.object({
  view: z.enum(["all", "unread", "read"]).default("all"),
  pageIndex: z.coerce.number().default(0),
  pageSize: z.coerce.number().default(PAGE_SIZE_DEFAULT),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  search: z.string().optional(),
  categories: z.array(z.string()).default([]),
  listId: z.string().uuid().optional(),
});

export type BookmarkFilters = z.infer<typeof FilterSchema>;

export type BookmarkRow = {
  id: string;
  tweetId: string;
  text: string;
  authorUsername: string | null;
  authorName: string | null;
  authorProfileImageUrl: string | null;
  tweetCreatedAt: Date | null;
  mediaUrls: string[];
  mediaTypes: string[];
  metrics: { likes: number; retweets: number; replies: number } | null;
  primaryCategory: string | null;
  subTags: string[];
  summary: string | null;
  status: string;
  isRead: boolean;
  syncedAt: Date;
};

export type GetBookmarksResult = ActionResult<{
  bookmarks: BookmarkRow[];
  totalCount: number;
}>;

function buildWhere(
  userId: string,
  params: BookmarkFilters
): SQL {
  const conditions: SQL[] = [eq(bookmarks.userId, userId)];

  if (params.view === "unread") {
    conditions.push(eq(bookmarks.isRead, false));
  } else if (params.view === "read") {
    conditions.push(eq(bookmarks.isRead, true));
  }

  if (params.categories.length > 0) {
    const categoryConditions: SQL[] = [
      inArray(bookmarks.primaryCategory, params.categories),
    ];
    for (const category of params.categories) {
      categoryConditions.push(
        sql`${bookmarks.subTags} @> ${JSON.stringify([category])}::jsonb`
      );
    }
    conditions.push(or(...categoryConditions) as SQL);
  }

  if (params.search) {
    conditions.push(
      or(
        ilike(bookmarks.text, `%${params.search}%`),
        ilike(bookmarks.authorUsername, `%${params.search}%`),
        ilike(bookmarks.authorName, `%${params.search}%`)
      ) as SQL
    );
  }

  if (params.listId) {
    conditions.push(
      sql`exists (select 1 from bookmark_list_items bli where bli.bookmark_id = ${bookmarks.id} and bli.list_id = ${params.listId})`
    );
  }

  return and(...conditions) as SQL;
}

export async function getBookmarks(
  params: BookmarkFilters
): Promise<GetBookmarksResult> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  try {
    const parsed = FilterSchema.parse(params);
    const where = buildWhere(user.id, parsed);

    const [rows, totalCountResult] = await Promise.all([
      db
        .select({
          id: bookmarks.id,
          tweetId: bookmarks.tweetId,
          text: bookmarks.text,
          authorUsername: bookmarks.authorUsername,
          authorName: bookmarks.authorName,
          authorProfileImageUrl: bookmarks.authorProfileImageUrl,
          tweetCreatedAt: bookmarks.tweetCreatedAt,
          mediaUrls: bookmarks.mediaUrls,
          mediaTypes: bookmarks.mediaTypes,
          metrics: bookmarks.metrics,
          primaryCategory: bookmarks.primaryCategory,
          subTags: bookmarks.subTags,
          summary: bookmarks.summary,
          status: bookmarks.status,
          isRead: bookmarks.isRead,
          syncedAt: bookmarks.syncedAt,
        })
        .from(bookmarks)
        .where(where)
        .orderBy(
          parsed.sort === "oldest"
            ? asc(bookmarks.syncedAt)
            : desc(bookmarks.syncedAt)
        )
        .offset(parsed.pageIndex * parsed.pageSize)
        .limit(parsed.pageSize),
      db.select({ value: count() }).from(bookmarks).where(where),
    ]);

    const bookmarksOut: BookmarkRow[] = rows.map((row) => ({
      ...row,
      mediaUrls: (row.mediaUrls as string[] | null) ?? [],
      mediaTypes: (row.mediaTypes as string[] | null) ?? [],
      metrics:
        (row.metrics as BookmarkRow["metrics"] | null) ?? null,
      subTags: (row.subTags as string[] | null) ?? [],
    }));

    return actionResponse.success({
      bookmarks: bookmarksOut,
      totalCount: totalCountResult[0]?.value ?? 0,
    });
  } catch (error) {
    console.error("Error getting bookmarks", error);
    return actionResponse.error(getErrorMessage(error));
  }
}

export type BookmarkStats = {
  connected: boolean;
  username: string | null;
  total: number;
  unread: number;
  pending: number;
};

export async function getBookmarkStats(): Promise<ActionResult<BookmarkStats>> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  try {
    const { getXConnectionByUserId } = await import("@/lib/x/connection");
    const conn = await getXConnectionByUserId(user.id);

    const [stats] = await db
      .select({
        total: count(),
        unread: sql<number>`count(*) filter (where ${bookmarks.isRead} = false)`,
        pending: sql<number>`count(*) filter (where ${bookmarks.status} in ('pending', 'processing', 'failed'))`,
      })
      .from(bookmarks)
      .where(eq(bookmarks.userId, user.id));

    return actionResponse.success({
      connected: !!conn,
      username: conn?.username ?? null,
      total: Number(stats?.total ?? 0),
      unread: Number(stats?.unread ?? 0),
      pending: Number(stats?.pending ?? 0),
    });
  } catch (error) {
    console.error("Error getting bookmark stats", error);
    return actionResponse.error(getErrorMessage(error));
  }
}

const ReadUpdateSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  isRead: z.boolean(),
});

export async function updateBookmarksRead(
  ids: string[],
  isRead: boolean
): Promise<ActionResult> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  try {
    const parsed = ReadUpdateSchema.parse({ ids, isRead });
    await db
      .update(bookmarks)
      .set({ isRead: parsed.isRead })
      .where(
        and(eq(bookmarks.userId, user.id), inArray(bookmarks.id, parsed.ids))
      );
    return actionResponse.success();
  } catch (error) {
    console.error("Error updating bookmarks read state", error);
    return actionResponse.error(getErrorMessage(error));
  }
}

const TagUpdateSchema = z.object({
  id: z.string().uuid(),
  add: z.string().trim().min(1).max(30).optional(),
  remove: z.string().trim().min(1).max(30).optional(),
  color: z.string().trim().max(20).optional(),
});

export async function updateBookmarkTags(params: {
  id: string;
  add?: string;
  remove?: string;
  color?: string;
}): Promise<ActionResult> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  try {
    const parsed = TagUpdateSchema.parse(params);
    const [row] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.id, parsed.id), eq(bookmarks.userId, user.id)))
      .limit(1);
    if (!row) return actionResponse.notFound();

    let primaryCategory = row.primaryCategory;
    let subTags = [...((row.subTags as string[] | null) ?? [])];

    if (parsed.add) {
      const tag = parsed.add;
      if (isBookmarkCategory(tag) && !primaryCategory) {
        primaryCategory = tag;
      } else if (!subTags.includes(tag) && tag !== primaryCategory) {
        subTags.push(tag);
      }
    }

    if (parsed.remove) {
      if (primaryCategory === parsed.remove) {
        primaryCategory = null;
      }
      subTags = subTags.filter((t) => t !== parsed.remove);
    }

    await db
      .update(bookmarks)
      .set({ primaryCategory, subTags })
      .where(eq(bookmarks.id, row.id));
    await applyTagDeltas(
      user.id,
      tagDeltas((row.subTags as string[] | null) ?? [], subTags),
      parsed.add && parsed.color && isTagColorId(parsed.color)
        ? new Map([[parsed.add, parsed.color]])
        : undefined
    );
    return actionResponse.success();
  } catch (error) {
    console.error("Error updating bookmark tags", error);
    return actionResponse.error(getErrorMessage(error));
  }
}

// Custom tags for the filter bar, most-used first (usage counters live in
// bookmark_tags, maintained on every subTags write).
export async function getBookmarkTags(): Promise<
  ActionResult<{ tags: Array<{ name: string; color: string | null }> }>
> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  try {
    return actionResponse.success({ tags: await listUserTags(user.id, 40) });
  } catch (error) {
    console.error("Error getting bookmark tags", error);
    return actionResponse.error(getErrorMessage(error));
  }
}
