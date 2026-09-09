import "server-only";

import { db } from "@/lib/db";
import { bookmarks } from "@/lib/db/schema";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";

export type ExportBookmarkRow = {
  id: string;
  tweetId: string;
  text: string;
  authorUsername: string | null;
  authorName: string | null;
  tweetCreatedAt: Date | null;
  mediaUrls: string[];
  mediaTypes: string[];
  urls: string[];
  primaryCategory: string | null;
  subTags: string[];
  summary: string | null;
  status: string;
  isRead: boolean;
  syncedAt: Date;
};

export function bookmarkTweetUrl(tweetId: string): string {
  return `https://x.com/i/status/${tweetId}`;
}

export function bookmarkAuthorLabel(row: ExportBookmarkRow): string {
  if (row.authorUsername) return `@${row.authorUsername}`;
  if (row.authorName) return row.authorName;
  return "Unknown";
}

export function bookmarkTags(row: ExportBookmarkRow): string[] {
  const tags = new Set<string>();
  if (row.primaryCategory) tags.add(row.primaryCategory);
  for (const tag of row.subTags) tags.add(tag);
  return [...tags];
}

export function bookmarkTitle(row: ExportBookmarkRow): string {
  const plain = row.text.replace(/\s+/g, " ").trim();
  if (plain.length <= 30) return plain || "Bookmark";
  return `${plain.slice(0, 30)}…`;
}

function yamlEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function formatDate(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toExportRow(row: {
  id: string;
  tweetId: string;
  text: string;
  authorUsername: string | null;
  authorName: string | null;
  tweetCreatedAt: Date | null;
  mediaUrls: unknown;
  mediaTypes: unknown;
  urls: unknown;
  primaryCategory: string | null;
  subTags: unknown;
  summary: string | null;
  status: string;
  isRead: boolean;
  syncedAt: Date;
}): ExportBookmarkRow {
  return {
    ...row,
    mediaUrls: (row.mediaUrls as string[] | null) ?? [],
    mediaTypes: (row.mediaTypes as string[] | null) ?? [],
    urls: (row.urls as string[] | null) ?? [],
    subTags: (row.subTags as string[] | null) ?? [],
  };
}

export async function fetchBookmarksForExport(
  userId: string,
  bookmarkIds?: string[]
): Promise<ExportBookmarkRow[]> {
  const conditions = [
    eq(bookmarks.userId, userId),
    isNull(bookmarks.deletedAt),
  ];
  if (bookmarkIds && bookmarkIds.length > 0) {
    conditions.push(inArray(bookmarks.id, bookmarkIds));
  }

  const rows = await db
    .select({
      id: bookmarks.id,
      tweetId: bookmarks.tweetId,
      text: bookmarks.text,
      authorUsername: bookmarks.authorUsername,
      authorName: bookmarks.authorName,
      tweetCreatedAt: bookmarks.tweetCreatedAt,
      mediaUrls: bookmarks.mediaUrls,
      mediaTypes: bookmarks.mediaTypes,
      urls: bookmarks.urls,
      primaryCategory: bookmarks.primaryCategory,
      subTags: bookmarks.subTags,
      summary: bookmarks.summary,
      status: bookmarks.status,
      isRead: bookmarks.isRead,
      syncedAt: bookmarks.syncedAt,
    })
    .from(bookmarks)
    .where(and(...conditions))
    .orderBy(
      sql`${bookmarks.tweetCreatedAt} desc nulls last`,
      desc(bookmarks.tweetId)
    );

  return rows.map(toExportRow);
}

export function serializeBookmarkMarkdown(row: ExportBookmarkRow): string {
  const tags = bookmarkTags(row);
  const title = bookmarkTitle(row);
  const author = bookmarkAuthorLabel(row);
  const url = bookmarkTweetUrl(row.tweetId);
  const date = formatDate(row.tweetCreatedAt);
  const lines: string[] = [
    "---",
    `title: "${yamlEscape(title)}"`,
    `author: "${yamlEscape(author)}"`,
    `url: "${yamlEscape(url)}"`,
    `date: "${date}"`,
    `tags: [${tags.map((tag) => `"${yamlEscape(tag)}"`).join(", ")}]`,
    "---",
    "",
    `> ${row.text.replace(/\n/g, "\n> ")}`,
    "",
  ];

  if (row.summary?.trim()) {
    lines.push("### AI 核心摘要", "");
    for (const line of row.summary.trim().split(/\n+/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      lines.push(trimmed.startsWith("-") ? trimmed : `- ${trimmed}`);
    }
    lines.push("");
  }

  if (row.urls.length > 0) {
    lines.push("### Links", "");
    for (const link of row.urls) {
      lines.push(`- ${link}`);
    }
    lines.push("");
  }

  if (row.mediaUrls.length > 0) {
    lines.push("### Media", "");
    row.mediaUrls.forEach((mediaUrl, index) => {
      const type = row.mediaTypes[index] ?? "media";
      lines.push(`- [${type}] ${mediaUrl}`);
    });
    lines.push("");
  }

  return lines.join("\n");
}

export function serializeExportJson(rows: ExportBookmarkRow[]): string {
  const payload = rows.map((row) => ({
    id: row.id,
    tweetId: row.tweetId,
    url: bookmarkTweetUrl(row.tweetId),
    text: row.text,
    author: bookmarkAuthorLabel(row),
    authorUsername: row.authorUsername,
    authorName: row.authorName,
    tweetCreatedAt: row.tweetCreatedAt?.toISOString() ?? null,
    tags: bookmarkTags(row),
    primaryCategory: row.primaryCategory,
    subTags: row.subTags,
    summary: row.summary,
    links: row.urls,
    mediaUrls: row.mediaUrls,
    mediaTypes: row.mediaTypes,
    status: row.status,
    isRead: row.isRead,
    syncedAt: row.syncedAt.toISOString(),
  }));
  return JSON.stringify(payload, null, 2);
}

export function serializeExportCsv(rows: ExportBookmarkRow[]): string {
  const header = [
    "id",
    "tweet_id",
    "url",
    "text",
    "author",
    "tweet_created_at",
    "tags",
    "summary",
    "links",
    "status",
    "is_read",
    "synced_at",
  ].join(",");

  const body = rows.map((row) =>
    [
      row.id,
      row.tweetId,
      bookmarkTweetUrl(row.tweetId),
      row.text,
      bookmarkAuthorLabel(row),
      row.tweetCreatedAt?.toISOString() ?? "",
      bookmarkTags(row).join("; "),
      row.summary ?? "",
      row.urls.join("; "),
      row.status,
      row.isRead ? "true" : "false",
      row.syncedAt.toISOString(),
    ]
      .map((value) => csvEscape(String(value)))
      .join(",")
  );

  return [header, ...body].join("\n");
}

export function markdownFileName(row: ExportBookmarkRow): string {
  const date = formatDate(row.tweetCreatedAt) || "unknown-date";
  return `${date}-${row.tweetId}.md`;
}
