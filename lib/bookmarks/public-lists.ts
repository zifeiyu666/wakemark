import { bookmarkSortOrder } from "@/lib/bookmarks/query";
import { db } from "@/lib/db";
import {
  bookmarkListItems,
  bookmarkLists,
  bookmarks,
  xConnections,
} from "@/lib/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";

export type PublicListBookmark = {
  id: string;
  tweetId: string;
  text: string;
  authorUsername: string | null;
  authorName: string | null;
  authorProfileImageUrl: string | null;
  mediaUrls: string[];
  mediaTypes: string[];
  metrics: { likes: number; retweets: number; replies: number } | null;
  primaryCategory: string | null;
  subTags: string[];
  syncedAt: Date;
};

export type PublicListData = {
  list: { id: string; name: string; slug: string };
  ownerUserId: string;
  ownerUsername: string;
  bookmarks: PublicListBookmark[];
};

// Resolves a shared /u/{username}/{slug} URL. Private or unknown lists return
// null so the page renders the "list not found" state.
export async function loadPublicList(
  username: string,
  slug: string
): Promise<PublicListData | null> {
  const [conn] = await db
    .select({
      userId: xConnections.userId,
      username: xConnections.username,
    })
    .from(xConnections)
    .where(sql`lower(${xConnections.username}) = ${username.toLowerCase()}`)
    .limit(1);
  if (!conn) return null;

  const [list] = await db
    .select({
      id: bookmarkLists.id,
      name: bookmarkLists.name,
      slug: bookmarkLists.slug,
    })
    .from(bookmarkLists)
    .where(
      and(
        eq(bookmarkLists.userId, conn.userId),
        eq(bookmarkLists.slug, slug),
        eq(bookmarkLists.isPublic, true)
      )
    )
    .limit(1);
  if (!list) return null;

  const rows = await db
    .select({
      id: bookmarks.id,
      tweetId: bookmarks.tweetId,
      text: bookmarks.text,
      authorUsername: bookmarks.authorUsername,
      authorName: bookmarks.authorName,
      authorProfileImageUrl: bookmarks.authorProfileImageUrl,
      mediaUrls: bookmarks.mediaUrls,
      mediaTypes: bookmarks.mediaTypes,
      metrics: bookmarks.metrics,
      primaryCategory: bookmarks.primaryCategory,
      subTags: bookmarks.subTags,
      syncedAt: bookmarks.syncedAt,
    })
    .from(bookmarkListItems)
    .innerJoin(bookmarks, eq(bookmarks.id, bookmarkListItems.bookmarkId))
    .where(
      and(
        eq(bookmarkListItems.listId, list.id),
        isNull(bookmarks.deletedAt),
      ),
    )
    // Newest tweets first (by publish time, not import/sync time).
    .orderBy(...bookmarkSortOrder("newest"))
    .limit(200);

  return {
    list,
    ownerUserId: conn.userId,
    ownerUsername: conn.username ?? username,
    bookmarks: rows.map((row) => ({
      ...row,
      mediaUrls: (row.mediaUrls as string[] | null) ?? [],
      mediaTypes: (row.mediaTypes as string[] | null) ?? [],
      metrics: (row.metrics as PublicListBookmark["metrics"] | null) ?? null,
      subTags: (row.subTags as string[] | null) ?? [],
    })),
  };
}
