import "server-only";

import { db } from "@/lib/db";
import { xConnections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decryptText, encryptText } from "./crypto";
import { refreshXTokens, XTokenError } from "./token-refresh";

export type XConnection = typeof xConnections.$inferSelect;

export async function getXConnectionByUserId(
  userId: string
): Promise<XConnection | null> {
  const rows = await db
    .select()
    .from(xConnections)
    .where(eq(xConnections.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

const REFRESH_MARGIN_MS = 5 * 60 * 1000;

// OAuth error codes meaning the refresh token is dead (revoked, rotated away,
// or reconnected elsewhere). Anything else (network blip, 5xx) is transient and
// should be retried later without forcing the user to reconnect.
const PERMANENT_TOKEN_ERRORS = new Set([
  "invalid_grant",
  "invalid_request",
  "access_denied",
]);

export class XReconnectRequiredError extends Error {
  constructor(detail: string) {
    super(`X refresh token rejected: ${detail}. User must reconnect.`);
    this.name = "XReconnectRequiredError";
  }
}

// A stored token that no longer decrypts (e.g. corrupted write, key rotation)
// is unrecoverable; treat it like a dead refresh token so the user is routed
// into the reconnect flow instead of retrying forever.
function decryptStored(value: string, label: string): string {
  try {
    return decryptText(value);
  } catch (error) {
    throw new XReconnectRequiredError(
      `stored ${label} is undecryptable (${
        error instanceof Error ? error.message : String(error)
      })`
    );
  }
}

// X rotates refresh tokens: each use invalidates the old one immediately. If
// two requests refresh concurrently (e.g. double-clicked Sync), the second would
// present the already-rotated token and be falsely flagged as expired, so
// refreshes are deduped per connection within the process.
const inflightRefresh = new Map<string, Promise<string>>();

/**
 * Decrypt the stored access token; transparently refresh it (and persist the
 * rotated tokens) when it expires within 5 minutes. Refresh tokens last ~6
 * months and each successful refresh renews them, so an active user never
 * needs to reconnect manually.
 */
export function getValidAccessToken(conn: XConnection): Promise<string> {
  const expiresAt = conn.accessTokenExpiresAt?.getTime() ?? 0;
  if (Date.now() + REFRESH_MARGIN_MS < expiresAt) {
    return Promise.resolve(decryptStored(conn.accessToken, "access token"));
  }
  if (!conn.refreshToken) {
    return Promise.reject(
      new XReconnectRequiredError("no refresh token stored")
    );
  }

  const pending = inflightRefresh.get(conn.id);
  if (pending) return pending;
  const task = refreshAndPersist(conn).finally(() => {
    inflightRefresh.delete(conn.id);
  });
  inflightRefresh.set(conn.id, task);
  return task;
}

async function refreshAndPersist(conn: XConnection): Promise<string> {
  let refreshed;
  try {
    // Tokens are encrypted at rest; X needs the plaintext refresh token.
    refreshed = await refreshXTokens(
      decryptStored(conn.refreshToken!, "refresh token")
    );
  } catch (error) {
    if (
      error instanceof XTokenError &&
      (PERMANENT_TOKEN_ERRORS.has(error.errorCode ?? "") ||
        error.status === 401)
    ) {
      throw new XReconnectRequiredError(error.message);
    }
    throw error;
  }

  const accessTokenExpiresAt = new Date(
    Date.now() + refreshed.expiresIn * 1000
  );
  await db
    .update(xConnections)
    .set({
      accessToken: encryptText(refreshed.accessToken),
      // Rotation: persist X's new refresh token; only fall back to the old
      // one (decrypted, re-encrypted) if X omitted it.
      refreshToken: encryptText(
        refreshed.refreshToken ??
          decryptStored(conn.refreshToken!, "refresh token")
      ),
      accessTokenExpiresAt,
      scopes: refreshed.scope ?? conn.scopes,
    })
    .where(eq(xConnections.id, conn.id));

  return refreshed.accessToken;
}
