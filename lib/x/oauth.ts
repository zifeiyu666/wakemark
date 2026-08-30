import "server-only";

import { createHash, randomBytes } from "crypto";

const AUTHORIZE_URL = "https://x.com/i/oauth2/authorize";
const TOKEN_URL = "https://api.x.com/2/oauth2/token";

export const X_OAUTH_SCOPES =
  "bookmark.read users.read tweet.read offline.access";

export interface PkcePair {
  state: string;
  codeVerifier: string;
  codeChallenge: string;
}

export function generatePkce(): PkcePair {
  const state = randomBytes(16).toString("base64url");
  const codeVerifier = randomBytes(48).toString("base64url");
  const codeChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return { state, codeVerifier, codeChallenge };
}

function requireCredentials() {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("X_CLIENT_ID / X_CLIENT_SECRET is not set");
  }
  return { clientId, clientSecret };
}

export function buildAuthorizeUrl(params: {
  state: string;
  codeChallenge: string;
  redirectUri: string;
}): string {
  const { clientId } = requireCredentials();
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("scope", X_OAUTH_SCOPES);
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

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

async function requestToken(body: URLSearchParams): Promise<XTokenResponse> {
  const { clientId, clientSecret } = requireCredentials();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${clientId}:${clientSecret}`
      ).toString("base64")}`,
    },
    body,
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

export function exchangeCodeForTokens(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<XTokenResponse> {
  return requestToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code: params.code,
      redirect_uri: params.redirectUri,
      code_verifier: params.codeVerifier,
    })
  );
}

export function refreshXTokens(refreshToken: string): Promise<XTokenResponse> {
  return requestToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    })
  );
}
