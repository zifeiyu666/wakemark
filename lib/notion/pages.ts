import "server-only";

import { db } from "@/lib/db";
import { bookmarks, notionConnections } from "@/lib/db/schema";
import {
  bookmarkAuthorLabel,
  bookmarkTags,
  bookmarkTitle,
  bookmarkTweetUrl,
  type ExportBookmarkRow,
} from "@/lib/bookmarks/export";
import { createNotionClient } from "@/lib/notion/connection";
import type { BlockObjectRequest, CreatePageParameters } from "@notionhq/client/build/src/api-endpoints";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { and, eq, isNull, sql } from "drizzle-orm";

const NOTION_DATABASE_TITLE = "Wakemark Bookmarks";

export type NotionPageCandidate = {
  id: string;
  title: string;
  url: string;
};

function isFullPage(
  page: { object: string }
): page is PageObjectResponse {
  return page.object === "page" && "properties" in page && "url" in page;
}

export async function searchNotionPages(
  accessTokenEncrypted: string,
  query = ""
): Promise<NotionPageCandidate[]> {
  const notion = createNotionClient(accessTokenEncrypted);
  const response = await notion.search({
    query: query || undefined,
    filter: { property: "object", value: "page" },
    page_size: 20,
  });

  return response.results.flatMap((item) => {
    if (!isFullPage(item)) return [];
    return [
      {
        id: item.id,
        title: extractPageTitle(item),
        url: item.url,
      },
    ];
  });
}

function extractPageTitle(page: PageObjectResponse): string {
  for (const value of Object.values(page.properties)) {
    if (value.type === "title" && value.title.length > 0) {
      return value.title.map((part) => part.plain_text).join("") || "Untitled";
    }
  }
  return "Untitled";
}

export async function createWakemarkDatabase(
  accessTokenEncrypted: string,
  parentPageId: string
): Promise<string> {
  const notion = createNotionClient(accessTokenEncrypted);
  const response = await notion.databases.create({
    parent: { type: "page_id", page_id: parentPageId },
    title: [{ type: "text", text: { content: NOTION_DATABASE_TITLE } }],
    initial_data_source: {
      properties: {
        Title: { title: {} },
        Author: { rich_text: {} },
        URL: { url: {} },
        Tags: { multi_select: {} },
        "Created At": { date: {} },
        "Has Media": { checkbox: {} },
      },
    },
  });
  return response.id;
}

function chunkText(text: string, maxLength = 1800): string[] {
  if (text.length <= maxLength) return [text];
  const chunks: string[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    chunks.push(text.slice(cursor, cursor + maxLength));
    cursor += maxLength;
  }
  return chunks;
}

function buildBookmarkBlocks(row: ExportBookmarkRow): BlockObjectRequest[] {
  const blocks: BlockObjectRequest[] = [
    {
      object: "block",
      type: "quote",
      quote: {
        rich_text: chunkText(row.text).map((chunk) => ({
          type: "text",
          text: { content: chunk },
        })),
      },
    },
  ];

  if (row.summary?.trim()) {
    blocks.push({
      object: "block",
      type: "heading_3",
      heading_3: {
        rich_text: [{ type: "text", text: { content: "AI 核心摘要" } }],
      },
    });
    for (const line of row.summary.trim().split(/\n+/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            {
              type: "text",
              text: { content: trimmed.replace(/^-+\s*/, "") },
            },
          ],
        },
      });
    }
  }

  for (const link of row.urls) {
    blocks.push({
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          {
            type: "text",
            text: { content: link, link: { url: link } },
          },
        ],
      },
    });
  }

  for (const mediaUrl of row.mediaUrls) {
    blocks.push({
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          {
            type: "text",
            text: { content: mediaUrl, link: { url: mediaUrl } },
          },
        ],
      },
    });
  }

  return blocks.slice(0, 90);
}

export async function createNotionBookmarkPage(
  accessTokenEncrypted: string,
  databaseId: string,
  row: ExportBookmarkRow
): Promise<string> {
  const notion = createNotionClient(accessTokenEncrypted);
  const tags = bookmarkTags(row);
  const payload: CreatePageParameters = {
    parent: { database_id: databaseId, type: "database_id" },
    properties: {
      Title: {
        title: [{ type: "text", text: { content: bookmarkTitle(row) } }],
      },
      Author: {
        rich_text: [{ type: "text", text: { content: bookmarkAuthorLabel(row) } }],
      },
      URL: {
        url: bookmarkTweetUrl(row.tweetId),
      },
      Tags: {
        multi_select: tags.map((name) => ({ name })),
      },
      "Created At": row.tweetCreatedAt
        ? { date: { start: row.tweetCreatedAt.toISOString() } }
        : { date: null },
      "Has Media": {
        checkbox: row.mediaUrls.length > 0,
      },
    },
    children: buildBookmarkBlocks(row),
  };

  const page = await notion.pages.create(payload);
  return page.id;
}

export async function clearNotionPageBindings(userId: string): Promise<void> {
  await db
    .update(bookmarks)
    .set({ notionPageId: null, notionSyncedAt: null })
    .where(eq(bookmarks.userId, userId));
}

export async function markNotionConnectionError(
  userId: string,
  message: string
): Promise<void> {
  await db
    .update(notionConnections)
    .set({
      syncStatus: "error",
      lastSyncError: message.slice(0, 500),
    })
    .where(eq(notionConnections.userId, userId));
}

export async function resetNotionSyncCursor(userId: string): Promise<void> {
  await db
    .update(notionConnections)
    .set({
      cursorBookmarkId: null,
      syncStatus: "syncing",
      lastSyncError: null,
    })
    .where(eq(notionConnections.userId, userId));
}

export async function countPendingNotionBookmarks(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        isNull(bookmarks.deletedAt),
        isNull(bookmarks.notionPageId),
        eq(bookmarks.status, "ready")
      )
    );
  return row?.value ?? 0;
}
