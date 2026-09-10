import "server-only";

import { db } from "@/lib/db";
import { bookmarkListItems, bookmarkLists, bookmarks } from "@/lib/db/schema";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { z } from "zod";

// Shared, session-free query layer for bookmarks. Consumed by the dashboard
// server actions (cookie session) and the MCP tools (API-key auth), so all
// functions take an explicit userId instead of reading the session.

export const PAGE_SIZE_DEFAULT = 24;

export const bookmarkFilterSchema = z.object({
  view: z.enum(["all", "unread", "read", "trash"]).default("all"),
  pageIndex: z.coerce.number().default(0),
  pageSize: z.coerce.number().default(PAGE_SIZE_DEFAULT),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  search: z.string().optional(),
  categories: z.array(z.string()).default([]),
  listId: z.string().uuid().optional(),
});

export type BookmarkFilters = z.infer<typeof bookmarkFilterSchema>;

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
  mediaPlaybackUrls: string[];
  metrics: { likes: number; retweets: number; replies: number } | null;
  primaryCategory: string | null;
  subTags: string[];
  summary: string | null;
  status: string;
  isRead: boolean;
  syncedAt: Date;
};

export function buildBookmarkWhere(
  userId: string,
  params: BookmarkFilters,
): SQL {
  const conditions: SQL[] = [eq(bookmarks.userId, userId)];

  if (params.view === "trash") {
    conditions.push(isNotNull(bookmarks.deletedAt));
  } else {
    conditions.push(isNull(bookmarks.deletedAt));
    if (params.view === "unread") {
      conditions.push(eq(bookmarks.isRead, false));
    } else if (params.view === "read") {
      conditions.push(eq(bookmarks.isRead, true));
    }
  }

  if (params.categories.length > 0) {
    const categoryConditions: SQL[] = [
      inArray(bookmarks.primaryCategory, params.categories),
    ];
    for (const category of params.categories) {
      categoryConditions.push(
        sql`${bookmarks.subTags} @> ${JSON.stringify([category])}::jsonb`,
      );
    }
    conditions.push(or(...categoryConditions) as SQL);
  }

  const search = params.search?.trim();
  if (search) {
    conditions.push(
      or(
        ilike(bookmarks.text, `%${search}%`),
        ilike(bookmarks.authorUsername, `%${search}%`),
        ilike(bookmarks.authorName, `%${search}%`),
        ilike(bookmarks.summary, `%${search}%`),
        ilike(bookmarks.primaryCategory, `%${search}%`),
        ilike(sql<string>`${bookmarks.subTags}::text`, `%${search}%`),
      ) as SQL,
    );
  }

  if (params.listId) {
    conditions.push(
      sql`exists (select 1 from bookmark_list_items bli where bli.bookmark_id = ${bookmarks.id} and bli.list_id = ${params.listId})`,
    );
  }

  return and(...conditions) as SQL;
}

const bookmarkColumns = {
  id: bookmarks.id,
  tweetId: bookmarks.tweetId,
  text: bookmarks.text,
  authorUsername: bookmarks.authorUsername,
  authorName: bookmarks.authorName,
  authorProfileImageUrl: bookmarks.authorProfileImageUrl,
  tweetCreatedAt: bookmarks.tweetCreatedAt,
  mediaUrls: bookmarks.mediaUrls,
  mediaTypes: bookmarks.mediaTypes,
  mediaPlaybackUrls: bookmarks.mediaPlaybackUrls,
  metrics: bookmarks.metrics,
  primaryCategory: bookmarks.primaryCategory,
  subTags: bookmarks.subTags,
  summary: bookmarks.summary,
  status: bookmarks.status,
  isRead: bookmarks.isRead,
  syncedAt: bookmarks.syncedAt,
};

function toBookmarkRow(row: {
  id: string;
  tweetId: string;
  text: string;
  authorUsername: string | null;
  authorName: string | null;
  authorProfileImageUrl: string | null;
  tweetCreatedAt: Date | null;
  mediaUrls: unknown;
  mediaTypes: unknown;
  mediaPlaybackUrls: unknown;
  metrics: unknown;
  primaryCategory: string | null;
  subTags: unknown;
  summary: string | null;
  status: string;
  isRead: boolean;
  syncedAt: Date;
}): BookmarkRow {
  return {
    ...row,
    mediaUrls: (row.mediaUrls as string[] | null) ?? [],
    mediaTypes: (row.mediaTypes as string[] | null) ?? [],
    mediaPlaybackUrls: (row.mediaPlaybackUrls as string[] | null) ?? [],
    metrics: (row.metrics as BookmarkRow["metrics"] | null) ?? null,
    subTags: (row.subTags as string[] | null) ?? [],
  };
}

export function bookmarkSortOrder(sort: "newest" | "oldest") {
  // Sort by when the tweet was published, not when we imported it. Extension
  // history import writes older pages later, so synced_at would invert order.
  if (sort === "oldest") {
    return [
      sql`${bookmarks.tweetCreatedAt} asc nulls last`,
      asc(bookmarks.tweetId),
    ];
  }
  return [
    sql`${bookmarks.tweetCreatedAt} desc nulls last`,
    desc(bookmarks.tweetId),
  ];
}

export async function queryBookmarks(
  userId: string,
  params: BookmarkFilters,
): Promise<{ bookmarks: BookmarkRow[]; totalCount: number }> {
  const where = buildBookmarkWhere(userId, params);

  const [rows, totalCountResult] = await Promise.all([
    db
      .select(bookmarkColumns)
      .from(bookmarks)
      .where(where)
      .orderBy(...bookmarkSortOrder(params.sort))
      .offset(params.pageIndex * params.pageSize)
      .limit(params.pageSize),
    db.select({ value: count() }).from(bookmarks).where(where),
  ]);

  return {
    bookmarks: rows.map(toBookmarkRow),
    totalCount: totalCountResult[0]?.value ?? 0,
  };
}

export async function getBookmarkById(
  userId: string,
  id: string,
): Promise<BookmarkRow | null> {
  const [row] = await db
    .select(bookmarkColumns)
    .from(bookmarks)
    .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)))
    .limit(1);
  return row ? toBookmarkRow(row) : null;
}

export async function getBookmarkByTweetId(
  userId: string,
  tweetId: string,
): Promise<BookmarkRow | null> {
  const [row] = await db
    .select(bookmarkColumns)
    .from(bookmarks)
    .where(and(eq(bookmarks.tweetId, tweetId), eq(bookmarks.userId, userId)))
    .limit(1);
  return row ? toBookmarkRow(row) : null;
}

export async function setBookmarksRead(
  userId: string,
  ids: string[],
  isRead: boolean,
): Promise<void> {
  await db
    .update(bookmarks)
    .set({ isRead })
    .where(
      and(
        eq(bookmarks.userId, userId),
        inArray(bookmarks.id, ids),
        isNull(bookmarks.deletedAt),
      ),
    );
}

export async function trashBookmarks(
  userId: string,
  ids: string[],
): Promise<void> {
  await db
    .update(bookmarks)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(bookmarks.userId, userId),
        inArray(bookmarks.id, ids),
        isNull(bookmarks.deletedAt),
      ),
    );
}

export async function restoreBookmarks(
  userId: string,
  ids: string[],
): Promise<void> {
  await db
    .update(bookmarks)
    .set({ deletedAt: null })
    .where(
      and(
        eq(bookmarks.userId, userId),
        inArray(bookmarks.id, ids),
        isNotNull(bookmarks.deletedAt),
      ),
    );
}

export async function permanentlyDeleteBookmarks(
  userId: string,
  ids: string[],
): Promise<void> {
  await db
    .delete(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        inArray(bookmarks.id, ids),
        isNotNull(bookmarks.deletedAt),
      ),
    );
}

export type BookmarkListWithCount = {
  id: string;
  name: string;
  slug: string;
  isPublic: boolean;
  createdAt: Date;
  count: number;
};

export async function listListsWithCounts(
  userId: string,
): Promise<BookmarkListWithCount[]> {
  const rows = await db
    .select({
      id: bookmarkLists.id,
      name: bookmarkLists.name,
      slug: bookmarkLists.slug,
      isPublic: bookmarkLists.isPublic,
      createdAt: bookmarkLists.createdAt,
      count: sql<number>`count(${bookmarkListItems.bookmarkId}) filter (where ${bookmarks.deletedAt} is null)::int`,
    })
    .from(bookmarkLists)
    .leftJoin(bookmarkListItems, eq(bookmarkListItems.listId, bookmarkLists.id))
    .leftJoin(bookmarks, eq(bookmarks.id, bookmarkListItems.bookmarkId))
    .where(eq(bookmarkLists.userId, userId))
    .groupBy(bookmarkLists.id)
    .orderBy(asc(bookmarkLists.createdAt));
  return rows.map((r) => ({ ...r, count: Number(r.count ?? 0) }));
}
