"use server";

import { ActionResult, actionResponse } from "@/lib/action-response";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import {
  bookmarkListItems,
  bookmarkLists,
  bookmarks,
  xConnections,
} from "@/lib/db/schema";
import { getErrorMessage } from "@/lib/error-utils";
import { and, asc, count, eq, sql } from "drizzle-orm";
import slugify from "slugify";
import { z } from "zod";

export type BookmarkListRow = {
  id: string;
  name: string;
  slug: string;
  isPublic: boolean;
  count: number;
};

export type BookmarkListWithMembership = BookmarkListRow & {
  inList: boolean;
};

const ListNameSchema = z.string().trim().min(1).max(60);
const ListIdSchema = z.string().uuid();

function baseSlug(name: string): string {
  return slugify(name, { lower: true, strict: true }) || "list";
}

// Slugs are unique per user. Fresh lists get a clean slug derived from the
// name ("test"); every visibility flip regenerates one with a random suffix
// so previously shared public links stop resolving after the toggle.
async function buildSlug(
  userId: string,
  name: string,
  opts: { randomize: boolean }
): Promise<string> {
  const base = baseSlug(name);
  const rows = await db
    .select({ slug: bookmarkLists.slug })
    .from(bookmarkLists)
    .where(eq(bookmarkLists.userId, userId));
  const taken = new Set(rows.map((r) => r.slug));
  if (!opts.randomize) {
    let candidate = base;
    let n = 2;
    while (taken.has(candidate)) candidate = `${base}-${n++}`;
    return candidate;
  }
  let candidate = "";
  do {
    candidate = `${base}-${Math.random().toString(36).slice(2, 8)}`;
  } while (taken.has(candidate));
  return candidate;
}

async function selectListsWithCounts(userId: string) {
  const rows = await db
    .select({
      id: bookmarkLists.id,
      name: bookmarkLists.name,
      slug: bookmarkLists.slug,
      isPublic: bookmarkLists.isPublic,
      createdAt: bookmarkLists.createdAt,
      count: sql<number>`count(${bookmarkListItems.bookmarkId})::int`,
    })
    .from(bookmarkLists)
    .leftJoin(bookmarkListItems, eq(bookmarkListItems.listId, bookmarkLists.id))
    .where(eq(bookmarkLists.userId, userId))
    .groupBy(bookmarkLists.id)
    .orderBy(asc(bookmarkLists.createdAt));
  return rows.map((r) => ({ ...r, count: Number(r.count ?? 0) }));
}

export async function getLists(): Promise<
  ActionResult<BookmarkListRow[]>
> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  try {
    return actionResponse.success(await selectListsWithCounts(user.id));
  } catch (error) {
    console.error("Error getting bookmark lists", error);
    return actionResponse.error(getErrorMessage(error));
  }
}

export async function getList(
  listId: string
): Promise<ActionResult<BookmarkListRow>> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  try {
    ListIdSchema.parse(listId);
    const [row] = await selectListsWithCounts(user.id).then((rows) =>
      rows.filter((r) => r.id === listId)
    );
    if (!row) return actionResponse.notFound();
    return actionResponse.success(row);
  } catch (error) {
    console.error("Error getting bookmark list", error);
    return actionResponse.error(getErrorMessage(error));
  }
}

export async function createList(
  name: string
): Promise<ActionResult<BookmarkListRow>> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  try {
    const parsedName = ListNameSchema.parse(name);
    const slug = await buildSlug(user.id, parsedName, { randomize: false });
    const [row] = await db
      .insert(bookmarkLists)
      .values({ userId: user.id, name: parsedName, slug })
      .returning();
    return actionResponse.success({ ...row, count: 0 });
  } catch (error) {
    console.error("Error creating bookmark list", error);
    return actionResponse.error(getErrorMessage(error));
  }
}

export async function renameList(
  listId: string,
  name: string
): Promise<ActionResult> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  try {
    const parsedId = ListIdSchema.parse(listId);
    const parsedName = ListNameSchema.parse(name);
    const [row] = await db
      .update(bookmarkLists)
      .set({ name: parsedName })
      .where(
        and(eq(bookmarkLists.id, parsedId), eq(bookmarkLists.userId, user.id))
      )
      .returning();
    if (!row) return actionResponse.notFound();
    return actionResponse.success();
  } catch (error) {
    console.error("Error renaming bookmark list", error);
    return actionResponse.error(getErrorMessage(error));
  }
}

export async function deleteList(listId: string): Promise<ActionResult> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  try {
    const parsedId = ListIdSchema.parse(listId);
    await db
      .delete(bookmarkLists)
      .where(
        and(eq(bookmarkLists.id, parsedId), eq(bookmarkLists.userId, user.id))
      );
    return actionResponse.success();
  } catch (error) {
    console.error("Error deleting bookmark list", error);
    return actionResponse.error(getErrorMessage(error));
  }
}

// Flipping visibility regenerates the slug, so a link copied while public
// never resolves again once the list goes private (and vice versa).
export async function setListVisibility(
  listId: string,
  isPublic: boolean
): Promise<ActionResult<BookmarkListRow>> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  try {
    const parsedId = ListIdSchema.parse(listId);
    const [existing] = await db
      .select()
      .from(bookmarkLists)
      .where(
        and(eq(bookmarkLists.id, parsedId), eq(bookmarkLists.userId, user.id))
      )
      .limit(1);
    if (!existing) return actionResponse.notFound();

    if (isPublic) {
      // The public URL is /u/{x-username}/{slug}, so sharing requires a
      // connected X account to own the handle segment.
      const [conn] = await db
        .select()
        .from(xConnections)
        .where(eq(xConnections.userId, user.id))
        .limit(1);
      if (!conn?.username) {
        return actionResponse.error(
          "Connect your X account first.",
          "not-connected"
        );
      }
    }

    const slug = await buildSlug(user.id, existing.name, { randomize: true });
    const [row] = await db
      .update(bookmarkLists)
      .set({ isPublic, slug })
      .where(eq(bookmarkLists.id, existing.id))
      .returning();
    const [withCount] = await selectListsWithCounts(user.id).then((rows) =>
      rows.filter((r) => r.id === row.id)
    );
    return actionResponse.success(withCount ?? { ...row, count: 0 });
  } catch (error) {
    console.error("Error updating bookmark list visibility", error);
    return actionResponse.error(getErrorMessage(error));
  }
}

export async function getListsForBookmark(
  bookmarkId: string
): Promise<ActionResult<BookmarkListWithMembership[]>> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  try {
    const lists = await selectListsWithCounts(user.id);
    const memberships = await db
      .select({ listId: bookmarkListItems.listId })
      .from(bookmarkListItems)
      .where(eq(bookmarkListItems.bookmarkId, bookmarkId));
    const inSet = new Set(memberships.map((m) => m.listId));
    return actionResponse.success(
      lists.map((l) => ({ ...l, inList: inSet.has(l.id) }))
    );
  } catch (error) {
    console.error("Error getting lists for bookmark", error);
    return actionResponse.error(getErrorMessage(error));
  }
}

export async function setBookmarkInList(
  bookmarkId: string,
  listId: string,
  inList: boolean
): Promise<ActionResult> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  try {
    const parsedListId = ListIdSchema.parse(listId);
    // Both the list and the bookmark must belong to this user.
    const [list] = await db
      .select({ id: bookmarkLists.id })
      .from(bookmarkLists)
      .where(
        and(eq(bookmarkLists.id, parsedListId), eq(bookmarkLists.userId, user.id))
      )
      .limit(1);
    if (!list) return actionResponse.notFound();
    const [bookmark] = await db
      .select({ id: bookmarks.id })
      .from(bookmarks)
      .where(
        and(eq(bookmarks.id, bookmarkId), eq(bookmarks.userId, user.id))
      )
      .limit(1);
    if (!bookmark) return actionResponse.notFound();

    if (inList) {
      await db
        .insert(bookmarkListItems)
        .values({ listId: parsedListId, bookmarkId })
        .onConflictDoNothing();
    } else {
      await db
        .delete(bookmarkListItems)
        .where(
          and(
            eq(bookmarkListItems.listId, parsedListId),
            eq(bookmarkListItems.bookmarkId, bookmarkId)
          )
        );
    }
    return actionResponse.success();
  } catch (error) {
    console.error("Error updating bookmark list membership", error);
    return actionResponse.error(getErrorMessage(error));
  }
}

export async function getListCount(listId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(bookmarkListItems)
    .where(eq(bookmarkListItems.listId, listId));
  return Number(row?.value ?? 0);
}
