import "server-only";

import {
  BOOKMARK_CATEGORIES,
} from "@/config/bookmark-categories";
import {
  countStats,
  embedQuestion,
  listBookmarks,
  recentBookmarks,
  vectorSearchWithFallback,
} from "@/lib/bookmarks/ask-ai";
import { tool } from "ai";
import { z } from "zod";

const filterSchema = z.object({
  category: z
    .enum(BOOKMARK_CATEGORIES)
    .optional()
    .describe(
      `Preset category filter, one of: ${BOOKMARK_CATEGORIES.join(", ")}`
    ),
  tag: z
    .string()
    .optional()
    .describe("Custom user tag (matched against bookmark tags only)"),
  authorUsername: z
    .string()
    .optional()
    .describe("X (Twitter) username of the author, with or without @"),
  isRead: z
    .boolean()
    .optional()
    .describe("Filter by read state (true = read, false = unread)"),
  keyword: z
    .string()
    .optional()
    .describe("Keyword matched against the tweet text (case-insensitive)"),
});

/**
 * Constrained query tools over the user's own bookmarks. The model picks a
 * tool and fills structured filters; the server translates them into fixed
 * Drizzle queries — the model never writes SQL itself.
 */
export function createBookmarkTools(userId: string) {
  return {
    countBookmarks: tool({
      description:
        "Count the user's X (Twitter) bookmarks, with a per-category breakdown. " +
        "Use for questions about how many / totals / stats, optionally restricted by filters.",
      inputSchema: filterSchema,
      execute: async (filters) => countStats(userId, filters),
    }),
    listBookmarks: tool({
      description:
        "List the user's X (Twitter) bookmarks matching structured filters " +
        "(category / tag / author / read state / keyword), sorted by sync time. " +
        "Use when the user asks to list or enumerate bookmarks by such criteria. " +
        "Each result includes a tweetUrl for citation.",
      inputSchema: filterSchema.extend({
        sortBy: z.enum(["newest", "oldest"]).default("newest"),
        limit: z.number().int().min(1).max(20).default(10),
      }),
      execute: async ({ sortBy, limit, ...filters }) =>
        listBookmarks(userId, filters, sortBy, limit),
    }),
    searchBookmarks: tool({
      description:
        "Semantic vector search over the CONTENT of the user's X (Twitter) bookmarks. " +
        "Use for open-ended content questions (topics, recommendations, what a tweet said). " +
        "Each result includes a tweetUrl for citation.",
      inputSchema: z.object({
        query: z.string().describe("Natural-language search query"),
        limit: z.number().int().min(1).max(10).default(8),
      }),
      execute: async ({ query, limit }) => {
        const vector = await embedQuestion(query);
        if (!vector) return recentBookmarks(userId, limit);
        return vectorSearchWithFallback(userId, vector, limit);
      },
    }),
  };
}
