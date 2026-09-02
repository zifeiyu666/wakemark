import "server-only";

import {
  embedQuestion,
  recentBookmarks,
  tweetUrlOf,
  vectorSearchWithFallback,
  type SerializedBookmark,
} from "@/lib/bookmarks/ask-ai";
import {
  getBookmarkById,
  getBookmarkByTweetId,
  listListsWithCounts,
  queryBookmarks,
  setBookmarksRead,
  type BookmarkRow,
} from "@/lib/bookmarks/query";
import { listUserTags } from "@/lib/bookmarks/tag-counts";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Tool metadata shared with the dashboard MCP page and the docs site so the
// docs never drift from the actual tool registration below.
export const MCP_TOOL_DOCS: Array<{ name: string; description: string }> = [
  {
    name: "list_bookmarks",
    description:
      "List the user's X bookmarks with pagination, read/unread filter, category/tag filter and sorting.",
  },
  {
    name: "search_bookmarks",
    description:
      "Keyword search across bookmark text and author name/username.",
  },
  {
    name: "get_bookmark",
    description:
      "Fetch a single bookmark by its WakeMark id or by the original X tweet id.",
  },
  {
    name: "list_tags",
    description:
      "List the user's bookmark tags (most used first) with their palette color.",
  },
  {
    name: "list_lists",
    description:
      "List the user's bookmark Lists (curated collections) with item counts.",
  },
  {
    name: "get_list_bookmarks",
    description: "List the bookmarks contained in one of the user's Lists.",
  },
  {
    name: "set_bookmark_read",
    description:
      "Mark one or more bookmarks as read or unread (batch, by WakeMark ids).",
  },
  {
    name: "ask_bookmarks",
    description:
      "Semantic search: returns the bookmarks most relevant to a natural-language question (vector retrieval over bookmark embeddings).",
  },
];

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const TEXT_PREVIEW_LIMIT = 1000;

function toJson(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

// Compact, agent-friendly projection of a bookmark row (drops media blobs
// and profile images to keep responses small).
function compactBookmark(row: BookmarkRow) {
  return {
    id: row.id,
    tweetId: row.tweetId,
    tweetUrl: tweetUrlOf(row),
    author: row.authorUsername
      ? `@${row.authorUsername}${row.authorName ? ` (${row.authorName})` : ""}`
      : row.authorName,
    text:
      row.text.length > TEXT_PREVIEW_LIMIT
        ? `${row.text.slice(0, TEXT_PREVIEW_LIMIT)}…`
        : row.text,
    summary: row.summary,
    category: row.primaryCategory,
    tags: row.subTags,
    isRead: row.isRead,
    metrics: row.metrics,
    tweetCreatedAt: row.tweetCreatedAt?.toISOString() ?? null,
    syncedAt: row.syncedAt.toISOString(),
  };
}

const pagingShape = {
  pageIndex: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe("Zero-based page index"),
  pageSize: z
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE)
    .describe(`Results per page (max ${MAX_PAGE_SIZE})`),
};

function pagedEnvelope(
  rows: ReturnType<typeof compactBookmark>[],
  totalCount: number,
  pageIndex: number,
  pageSize: number
) {
  return toJson({
    bookmarks: rows,
    totalCount,
    pageIndex,
    pageSize,
    hasMore: (pageIndex + 1) * pageSize < totalCount,
  });
}

export function registerTools(server: McpServer, userId: string): void {
  server.registerTool(
    "list_bookmarks",
    {
      title: "List bookmarks",
      description:
        "List the user's X bookmarks. Supports read/unread filtering, preset category or custom tag filtering, and newest/oldest sorting.",
      inputSchema: {
        view: z
          .enum(["all", "unread", "read"])
          .default("all")
          .describe("Read-state filter"),
        category: z
          .string()
          .optional()
          .describe("Preset category (e.g. Tech, Design) or custom tag"),
        sort: z.enum(["newest", "oldest"]).default("newest"),
        ...pagingShape,
      },
    },
    async ({ view, category, sort, pageIndex, pageSize }) => {
      const { bookmarks: rows, totalCount } = await queryBookmarks(userId, {
        view,
        pageIndex,
        pageSize,
        sort,
        categories: category ? [category] : [],
      });
      return pagedEnvelope(
        rows.map(compactBookmark),
        totalCount,
        pageIndex,
        pageSize
      );
    }
  );

  server.registerTool(
    "search_bookmarks",
    {
      title: "Search bookmarks",
      description:
        "Keyword search across bookmark text, author username and author name. Results are paginated.",
      inputSchema: {
        query: z.string().min(1).describe("Keyword to search for"),
        view: z.enum(["all", "unread", "read"]).default("all"),
        ...pagingShape,
      },
    },
    async ({ query, view, pageIndex, pageSize }) => {
      const { bookmarks: rows, totalCount } = await queryBookmarks(userId, {
        view,
        pageIndex,
        pageSize,
        sort: "newest",
        search: query,
        categories: [],
      });
      return pagedEnvelope(
        rows.map(compactBookmark),
        totalCount,
        pageIndex,
        pageSize
      );
    }
  );

  server.registerTool(
    "get_bookmark",
    {
      title: "Get bookmark",
      description:
        "Fetch a single bookmark. Pass either the WakeMark bookmark id (uuid) or the original X tweet id.",
      inputSchema: {
        id: z.string().uuid().optional().describe("WakeMark bookmark id"),
        tweetId: z.string().optional().describe("Original X tweet id"),
      },
    },
    async ({ id, tweetId }) => {
      if (!id && !tweetId) {
        return toJson({ error: "Provide either id or tweetId" });
      }
      const row = id
        ? await getBookmarkById(userId, id)
        : await getBookmarkByTweetId(userId, tweetId!);
      if (!row) return toJson({ error: "Bookmark not found" });
      return toJson({ bookmark: compactBookmark(row) });
    }
  );

  server.registerTool(
    "list_tags",
    {
      title: "List tags",
      description:
        "List the user's bookmark tags ordered by usage (most used first).",
      inputSchema: {
        limit: z.number().int().min(1).max(100).default(50),
      },
    },
    async ({ limit }) => {
      const tags = await listUserTags(userId, limit);
      return toJson({ tags });
    }
  );

  server.registerTool(
    "list_lists",
    {
      title: "List Lists",
      description:
        "List the user's bookmark Lists (curated collections) with their ids, names and item counts. Use get_list_bookmarks to read a list's contents.",
      inputSchema: {},
    },
    async () => {
      const lists = await listListsWithCounts(userId);
      return toJson({
        lists: lists.map((l) => ({
          id: l.id,
          name: l.name,
          slug: l.slug,
          isPublic: l.isPublic,
          count: l.count,
        })),
      });
    }
  );

  server.registerTool(
    "get_list_bookmarks",
    {
      title: "Get List bookmarks",
      description: "List the bookmarks contained in one of the user's Lists.",
      inputSchema: {
        listId: z.string().uuid().describe("List id (from list_lists)"),
        ...pagingShape,
      },
    },
    async ({ listId, pageIndex, pageSize }) => {
      const lists = await listListsWithCounts(userId);
      if (!lists.some((l) => l.id === listId)) {
        return toJson({ error: "List not found" });
      }
      const { bookmarks: rows, totalCount } = await queryBookmarks(userId, {
        view: "all",
        pageIndex,
        pageSize,
        sort: "newest",
        categories: [],
        listId,
      });
      return pagedEnvelope(
        rows.map(compactBookmark),
        totalCount,
        pageIndex,
        pageSize
      );
    }
  );

  server.registerTool(
    "set_bookmark_read",
    {
      title: "Set read state",
      description:
        "Mark one or more bookmarks as read or unread, by WakeMark bookmark ids.",
      inputSchema: {
        ids: z
          .array(z.string().uuid())
          .min(1)
          .max(200)
          .describe("Bookmark ids to update"),
        isRead: z.boolean().describe("true = mark read, false = mark unread"),
      },
    },
    async ({ ids, isRead }) => {
      await setBookmarksRead(userId, ids, isRead);
      return toJson({ updated: ids.length, isRead });
    }
  );

  server.registerTool(
    "ask_bookmarks",
    {
      title: "Ask bookmarks",
      description:
        "Semantic search over the user's bookmarks: finds the bookmarks most relevant to a natural-language question using vector embeddings. Use this instead of search_bookmarks when the question is conceptual rather than keyword-based. Returns retrieved bookmarks; compose the final answer yourself.",
      inputSchema: {
        question: z.string().min(1).describe("Natural-language question"),
        limit: z.number().int().min(1).max(20).default(8),
      },
    },
    async ({ question, limit }) => {
      const vector = await embedQuestion(question);
      let results: SerializedBookmark[];
      if (vector) {
        results = await vectorSearchWithFallback(userId, vector, limit);
      } else {
        // Embeddings unavailable (OpenRouter not configured): degrade to the
        // most recent bookmarks so the tool still returns something usable.
        results = await recentBookmarks(userId, limit);
      }
      return toJson({
        question,
        retrieved: results,
        note: "Bookmarks are ranked by semantic similarity to the question; citations use tweetUrl.",
      });
    }
  );
}
