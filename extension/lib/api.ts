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

export type SearchPage = {
  bookmarks: SearchBookmark[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  hasMore: boolean;
};

export type ExtensionUser = {
  id: string;
  name: string | null;
  image: string | null;
};

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export class AuthError extends Error {
  constructor(message = "Not signed in") {
    super(message);
    this.name = "AuthError";
  }
}

export async function getStoredApiKey(): Promise<string | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.apiKey);
  const key = result[STORAGE_KEYS.apiKey];
  return typeof key === "string" && key.trim() ? key : null;
}

export async function getStoredUser(): Promise<ExtensionUser | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.user);
  const user = result[STORAGE_KEYS.user] as ExtensionUser | undefined;
  if (!user || typeof user.id !== "string") return null;
  return {
    id: user.id,
    name: user.name ?? null,
    image: user.image ?? null,
  };
}

export async function setStoredAuth(
  apiKey: string,
  opts?: { keyId?: string; user?: ExtensionUser | null }
) {
  await chrome.storage.local.set({
    [STORAGE_KEYS.apiKey]: apiKey,
    ...(opts?.keyId ? { [STORAGE_KEYS.keyId]: opts.keyId } : {}),
    ...(opts?.user ? { [STORAGE_KEYS.user]: opts.user } : {}),
  });
}

export async function clearStoredAuth() {
  await chrome.storage.local.remove([
    STORAGE_KEYS.apiKey,
    STORAGE_KEYS.keyId,
    STORAGE_KEYS.user,
    STORAGE_KEYS.askAiSessionId,
    STORAGE_KEYS.askAiMessages,
    STORAGE_KEYS.askAiDraft,
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

/** If the server rejects the key, drop local auth so UI matches reality. */
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
  const res = await fetch(`${SITE_URL}/api/extension/auth/poll`, {
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

export async function fetchMe(): Promise<ExtensionUser> {
  const headers = await authHeaders();
  const res = await fetch(`${SITE_URL}/api/extension/me`, { headers });
  if (res.status === 401) {
    await handleUnauthorized(res);
    throw new AuthError("Session expired. Please sign in again.");
  }
  const json = await parseJson<ExtensionUser>(res);
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error || "Failed to load profile");
  }
  await chrome.storage.local.set({ [STORAGE_KEYS.user]: json.data });
  return json.data;
}

export async function searchBookmarks(opts: {
  q?: string;
  page?: number;
  limit?: number;
}): Promise<SearchPage> {
  const headers = await authHeaders();
  const url = new URL(`${SITE_URL}/api/extension/bookmarks/search`);
  if (opts.q?.trim()) url.searchParams.set("q", opts.q.trim());
  url.searchParams.set("page", String(opts.page ?? 0));
  url.searchParams.set("limit", String(opts.limit ?? 10));
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

/**
 * Clear local auth immediately so the UI updates, then best-effort revoke
 * the server key (never block sign-out on network).
 */
export async function revokeAuth(): Promise<void> {
  const apiKey = await getStoredApiKey();
  await clearStoredAuth();

  if (!apiKey) return;

  try {
    await fetch(`${SITE_URL}/api/extension/auth/revoke`, {
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

/** Soft check: if a stored key is rejected by the server, clear it. */
export async function validateStoredAuth(): Promise<boolean> {
  const apiKey = await getStoredApiKey();
  if (!apiKey) return false;
  try {
    await fetchMe();
    return true;
  } catch (err) {
    if (err instanceof AuthError) return false;
    // Network blips shouldn't force sign-out.
    return true;
  }
}

export function askAiEndpoint(): string {
  return `${SITE_URL}/api/extension/ask-ai`;
}

export type ImportBatchResult = {
  inserted: number;
  skipped: number;
  pendingCount: number;
  historyImportCompleted: boolean;
};

export async function importBookmarks(payload: {
  items: unknown[];
  done?: boolean;
}): Promise<ImportBatchResult> {
  const headers = await authHeaders();
  const res = await fetch(`${SITE_URL}/api/extension/bookmarks/import`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      source: "chrome_extension",
      items: payload.items,
      done: payload.done ?? false,
    }),
  });
  if (res.status === 401) {
    await handleUnauthorized(res);
    throw new AuthError("Session expired. Please sign in again.");
  }
  const json = await parseJson<ImportBatchResult>(res);
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error || "Import failed");
  }
  return json.data;
}
