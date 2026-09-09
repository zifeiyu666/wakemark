import {
  AuthError,
  clearStoredAuth,
  getStoredApiKey,
  setStoredAuth,
  type ExtensionUser,
} from "./auth";
import { STORAGE_KEYS, siteUrl } from "./config";
import { LocalStorage } from "@raycast/api";

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type SearchBookmark = {
  id: string;
  tweetId: string;
  text: string;
  summary: string | null;
  authorUsername: string | null;
  authorName: string | null;
  authorProfileImageUrl: string | null;
  primaryCategory: string | null;
  isRead: boolean;
  tweetUrl: string;
};

export type SearchPage = {
  bookmarks: SearchBookmark[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  hasMore: boolean;
};

async function authHeaders(): Promise<HeadersInit> {
  const apiKey = await getStoredApiKey();
  if (!apiKey) throw new AuthError();
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

async function parseJson<T>(res: Response): Promise<ApiEnvelope<T>> {
  try {
    return (await res.json()) as ApiEnvelope<T>;
  } catch {
    return { success: false, error: `Request failed (${res.status})` };
  }
}

async function handleUnauthorized(res: Response): Promise<void> {
  if (res.status === 401) {
    await clearStoredAuth();
  }
}

export async function pollAuth(state: string): Promise<{
  pending: boolean;
  apiKey?: string;
  keyId?: string;
  user?: ExtensionUser;
}> {
  const res = await fetch(`${siteUrl()}/api/extension/auth/poll`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state }),
  });
  const json = await parseJson<{
    pending: boolean;
    apiKey?: string;
    keyId?: string;
    user?: ExtensionUser;
  }>(res);
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error || "Poll failed");
  }
  return json.data;
}

export async function waitForGrant(
  state: string,
  opts?: { timeoutMs?: number }
): Promise<void> {
  const deadline = Date.now() + (opts?.timeoutMs ?? 120_000);
  while (Date.now() < deadline) {
    const result = await pollAuth(state);
    if (!result.pending && result.apiKey) {
      await setStoredAuth(result.apiKey, {
        keyId: result.keyId,
        user: result.user,
      });
      return;
    }
    await sleep(1000);
  }
  throw new Error("Timed out waiting for sign-in. Return to Raycast and try again.");
}

export async function fetchMe(): Promise<ExtensionUser> {
  const headers = await authHeaders();
  const res = await fetch(`${siteUrl()}/api/extension/me`, { headers });
  if (res.status === 401) {
    await handleUnauthorized(res);
    throw new AuthError("Session expired. Please sign in again.");
  }
  const json = await parseJson<ExtensionUser>(res);
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error || "Failed to load profile");
  }
  await LocalStorage.setItem(STORAGE_KEYS.user, JSON.stringify(json.data));
  return json.data;
}

export async function searchBookmarks(opts: {
  q?: string;
  page?: number;
  limit?: number;
}): Promise<SearchPage> {
  const headers = await authHeaders();
  const url = new URL(`${siteUrl()}/api/extension/bookmarks/search`);
  if (opts.q?.trim()) url.searchParams.set("q", opts.q.trim());
  url.searchParams.set("page", String(opts.page ?? 0));
  url.searchParams.set("limit", String(opts.limit ?? 20));
  const res = await fetch(url.toString(), { headers });
  if (res.status === 401) {
    await handleUnauthorized(res);
    throw new AuthError("Session expired. Please sign in again.");
  }
  const json = await parseJson<SearchPage>(res);
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error || "Search failed");
  }
  return json.data;
}

export async function revokeAuth(): Promise<void> {
  const apiKey = await getStoredApiKey();
  await clearStoredAuth();
  if (!apiKey) return;
  try {
    await fetch(`${siteUrl()}/api/extension/auth/revoke`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // Local sign-out already succeeded.
  }
}

export function askAiEndpoint(): string {
  return `${siteUrl()}/api/extension/ask-ai`;
}

export async function getOrCreateAskAiSessionId(): Promise<string> {
  const existing = await LocalStorage.getItem<string>(STORAGE_KEYS.askAiSessionId);
  if (existing) return existing;
  const id = crypto.randomUUID();
  await LocalStorage.setItem(STORAGE_KEYS.askAiSessionId, id);
  return id;
}

export async function resetAskAiSession(): Promise<string> {
  const id = crypto.randomUUID();
  await LocalStorage.setItem(STORAGE_KEYS.askAiSessionId, id);
  await LocalStorage.removeItem(STORAGE_KEYS.askAiMessages);
  return id;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
