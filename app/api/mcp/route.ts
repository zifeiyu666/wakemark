import { verifyApiKeyFromRequest } from "@/lib/auth/api-key";
import { createMcpServer } from "@/lib/mcp/server";
import { hasBookmarkServiceAccess } from "@/lib/payments/subscription";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

// Stateless Streamable HTTP MCP endpoint for AI agents. Every request is
// authenticated with a user API key ("Authorization: Bearer wkm_...") and
// served by a fresh McpServer bound to that user — no session state is kept
// between requests, which matches Vercel's serverless execution model.

export const runtime = "nodejs";

function unauthorized(message: string): Response {
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32001, message },
      id: null,
    }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": "Bearer",
      },
    }
  );
}

function methodNotAllowed(): Response {
  return new Response(
    JSON.stringify({
      error:
        "WakeMark MCP uses Streamable HTTP in request/response mode. Send JSON-RPC messages via POST with an API key.",
    }),
    {
      status: 405,
      headers: { "Content-Type": "application/json", Allow: "POST" },
    }
  );
}

export async function POST(req: Request): Promise<Response> {
  const apiKey = await verifyApiKeyFromRequest(req);
  if (!apiKey) {
    return unauthorized(
      "Missing or invalid API key. Create one at Dashboard > MCP and send it as Authorization: Bearer wkm_..."
    );
  }
  if (!(await hasBookmarkServiceAccess(apiKey.userId))) {
    return unauthorized(
      "An active subscription is required to use the WakeMark MCP endpoint."
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32700, message: "Parse error: body must be JSON" },
        id: null,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const server = createMcpServer(apiKey.userId);
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless: no session management
      enableJsonResponse: true, // plain JSON responses (serverless friendly)
    });
    await server.connect(transport);
    const response = await transport.handleRequest(req, { parsedBody: body });
    await transport.close();
    return response;
  } catch (error) {
    console.error("[mcp] request handling failed", error);
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal error" },
        id: null,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function GET(): Promise<Response> {
  return methodNotAllowed();
}

export async function DELETE(): Promise<Response> {
  return methodNotAllowed();
}
