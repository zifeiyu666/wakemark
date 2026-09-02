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
import {
  bookmarkFilterSchema,
  queryBookmarks,
  setBookmarksRead,
  type BookmarkFilters,
  type BookmarkRow,
} from "@/lib/bookmarks/query";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/db/schema";
import { getErrorMessage } from "@/lib/error-utils";
import { and, count, eq, sql } from "drizzle-orm";
import { z } from "zod";

export type { BookmarkFilters, BookmarkRow };

export type GetBookmarksResult = ActionResult<{
  bookmarks: BookmarkRow[];
  totalCount: number;
}>;

export async function getBookmarks(
  params: BookmarkFilters
): Promise<GetBookmarksResult> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  try {
    const parsed = bookmarkFilterSchema.parse(params);
    const { bookmarks: rows, totalCount } = await queryBookmarks(
      user.id,
      parsed
    );
    return actionResponse.success({ bookmarks: rows, totalCount });
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
    await setBookmarksRead(user.id, parsed.ids, parsed.isRead);
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
