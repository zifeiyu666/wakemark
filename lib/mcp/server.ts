import "server-only";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "@/lib/mcp/tools";

export const MCP_SERVER_NAME = "wakemark";
export const MCP_SERVER_VERSION = "1.0.0";
export const MCP_ENDPOINT_PATH = "/api/mcp";
export const API_KEY_PREFIX = "wkm_";

/** Absolute MCP endpoint URL (Streamable HTTP) for the current deployment. */
export function mcpServerUrl(baseUrl?: string): string {
  const base = baseUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return `${base.replace(/\/$/, "")}${MCP_ENDPOINT_PATH}`;
}

const INSTRUCTIONS = `WakeMark manages the user's X (Twitter) bookmarks: they are synced automatically, then AI-tagged with a category, custom tags and a summary, and organized into Lists.

Available tools let you list, search, filter and read bookmarks, browse the user's tags and Lists, mark bookmarks read/unread, and run semantic search (ask_bookmarks) for conceptual questions.

Notes for agents:
- All ids are WakeMark bookmark uuids; tweetId is the original X tweet id.
- Results are paginated (pageIndex is zero-based, pageSize caps at 100).
- ask_bookmarks returns retrieved bookmarks ranked by semantic similarity; compose the final answer yourself and cite tweetUrl.`;

/**
 * Build a per-request MCP server bound to one user. The Vercel serverless
 * model has no shared process state, so every request creates its own
 * stateless server + transport pair.
 */
export function createMcpServer(userId: string): McpServer {
  const server = new McpServer(
    {
      name: MCP_SERVER_NAME,
      version: MCP_SERVER_VERSION,
    },
    {
      capabilities: { tools: {} },
      instructions: INSTRUCTIONS,
    }
  );
  registerTools(server, userId);
  return server;
}
