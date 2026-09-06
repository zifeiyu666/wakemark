import { auth } from "@/lib/auth";

// Shared Bearer / x-api-key verification for MCP and Chrome extension APIs.

export type VerifiedApiKey = {
  userId: string;
  id: string;
  name?: string | null;
  metadata?: Record<string, unknown> | null;
};

export function extractApiKey(req: Request): string | null {
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

export async function verifyApiKeyFromRequest(
  req: Request
): Promise<VerifiedApiKey | null> {
  const key = extractApiKey(req);
  if (!key) return null;
  try {
    // verifyApiKey enforces expiry, enabled state and the per-key rate
    // limit configured in lib/auth (120 req/min by default).
    const result = await auth.api.verifyApiKey({ body: { key } });
    if (!result.valid || !result.key?.userId) return null;
    let metadata: Record<string, unknown> | null = null;
    const raw = result.key.metadata;
    if (raw && typeof raw === "object") {
      metadata = raw as Record<string, unknown>;
    } else if (typeof raw === "string") {
      try {
        metadata = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        metadata = null;
      }
    }
    return {
      userId: result.key.userId,
      id: result.key.id,
      name: result.key.name,
      metadata,
    };
  } catch (error) {
    console.error("[api-key] verification failed", error);
    return null;
  }
}
