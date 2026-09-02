import "server-only";

const TOKEN_URL = "https://api.x.com/2/oauth2/token";

export interface XTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  scope: string;
}

export class XTokenError extends Error {
  constructor(
    readonly status: number,
    readonly errorCode: string | null,
    detail: string
  ) {
    super(`X token request failed (${status}): ${detail}`);
    this.name = "XTokenError";
  }
}

function requireCredentials() {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("X_CLIENT_ID / X_CLIENT_SECRET is not set");
  }
  return { clientId, clientSecret };
}

// Authorization itself now runs through better-auth's twitter provider; this
// module only refreshes the stored (encrypted) tokens when they near expiry.
export async function refreshXTokens(
  refreshToken: string
): Promise<XTokenResponse> {
  const { clientId, clientSecret } = requireCredentials();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${clientId}:${clientSecret}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    let errorCode: string | null = null;
    try {
      errorCode = (JSON.parse(text) as { error?: string }).error ?? null;
    } catch {
      // non-JSON error body
    }
    throw new XTokenError(res.status, errorCode, text);
  }
  const json = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
  };
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresIn: json.expires_in,
    scope: json.scope,
  };
}
