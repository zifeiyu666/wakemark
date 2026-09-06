import { SITE_URL, STORAGE_KEYS } from "./config";

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

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function getStoredApiKey(): Promise<string | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.apiKey);
  return (result[STORAGE_KEYS.apiKey] as string | undefined) ?? null;
}

export async function setStoredAuth(apiKey: string, keyId?: string) {
  await chrome.storage.local.set({
    [STORAGE_KEYS.apiKey]: apiKey,
    ...(keyId ? { [STORAGE_KEYS.keyId]: keyId } : {}),
  });
}

export async function clearStoredAuth() {
  await chrome.storage.local.remove([
    STORAGE_KEYS.apiKey,
    STORAGE_KEYS.keyId,
  ]);
}

export async function getOrCreateAskAiSessionId(): Promise<string> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.askAiSessionId);
  const existing = result[STORAGE_KEYS.askAiSessionId] as string | undefined;
  if (existing) return existing;
  const id = crypto.randomUUID();
  await chrome.storage.local.set({ [STORAGE_KEYS.askAiSessionId]: id });
  return id;
}

async function authHeaders(): Promise<HeadersInit> {
  const apiKey = await getStoredApiKey();
  if (!apiKey) throw new Error("Not signed in");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

export async function pollAuth(state: string): Promise<{
  pending: boolean;
  apiKey?: string;
  keyId?: string;
}> {
  const res = await fetch(`${SITE_URL}/api/extension/auth/poll`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state }),
  });
  const json = (await res.json()) as ApiEnvelope<{
    pending: boolean;
    apiKey?: string;
    keyId?: string;
  }>;
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error || "Poll failed");
  }
  return json.data;
}

export async function searchBookmarks(
  q: string,
  limit = 10
): Promise<{ bookmarks: SearchBookmark[]; totalCount: number }> {
  const headers = await authHeaders();
  const url = new URL(`${SITE_URL}/api/extension/bookmarks/search`);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", String(limit));
  const res = await fetch(url.toString(), { headers });
  const json = (await res.json()) as ApiEnvelope<{
    bookmarks: SearchBookmark[];
    totalCount: number;
  }>;
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error || "Search failed");
  }
  return json.data;
}

export async function revokeAuth(): Promise<void> {
  try {
    const headers = await authHeaders();
    await fetch(`${SITE_URL}/api/extension/auth/revoke`, {
      method: "POST",
      headers,
    });
  } catch {
    // Best-effort; always clear local storage.
  } finally {
    await clearStoredAuth();
  }
}

export function askAiEndpoint(): string {
  return `${SITE_URL}/api/extension/ask-ai`;
}
