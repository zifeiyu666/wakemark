import { auth } from "@/lib/auth";
import { createMcpServer } from "@/lib/mcp/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

// Stateless Streamable HTTP MCP endpoint for AI agents. Every request is
// authenticated with a user API key ("Authorization: Bearer wkm_...") and
// served by a fresh McpServer bound to that user — no session state is kept
// between requests, which matches Vercel's serverless execution model.

export const runtime = "nodejs";

type VerifiedKey = {
  userId: string;
  id: string;
  name?: string | null;
};

function extractApiKey(req: Request): string | null {
  const authorization = req.headers.get("authorization");
  if (authorization) {
    const [scheme, value] = authorization.split(" ");
    if (scheme.toLowerCase() === "bearer" && value) return value.trim();
    // Some clients send the raw key as the Authorization header value.
    if (authorization.trim()) return authorization.trim();
  }
  const xApiKey = req.headers.get("x-api-key");
  return xApiKey?.trim() || null;
}

async function verifyApiKey(req: Request): Promise<VerifiedKey | null> {
  const key = extractApiKey(req);
  if (!key) return null;
  try {
    // verifyApiKey enforces expiry, enabled state and the per-key rate
    // limit configured in lib/auth (120 req/min by default).
    const result = await auth.api.verifyApiKey({ body: { key } });
    if (!result.valid || !result.key?.userId) return null;
    return {
      userId: result.key.userId,
      id: result.key.id,
      name: result.key.name,
    };
  } catch (error) {
    console.error("[mcp] api key verification failed", error);
    return null;
  }
}

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
  const apiKey = await verifyApiKey(req);
  if (!apiKey) {
    return unauthorized(
      "Missing or invalid API key. Create one at Dashboard > MCP and send it as Authorization: Bearer wkm_..."
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
