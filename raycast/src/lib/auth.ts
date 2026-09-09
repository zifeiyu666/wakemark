import { LocalStorage, open } from "@raycast/api";
import { STORAGE_KEYS, siteUrl } from "./config";

export type ExtensionUser = {
  id: string;
  name: string | null;
  image: string | null;
};

export class AuthError extends Error {
  constructor(message = "Not signed in") {
    super(message);
    this.name = "AuthError";
  }
}

export async function getStoredApiKey(): Promise<string | null> {
  const key = await LocalStorage.getItem<string>(STORAGE_KEYS.apiKey);
  return typeof key === "string" && key.trim() ? key : null;
}

export async function getStoredUser(): Promise<ExtensionUser | null> {
  const raw = await LocalStorage.getItem<string>(STORAGE_KEYS.user);
  if (!raw) return null;
  try {
    const user = JSON.parse(raw) as ExtensionUser;
    if (!user || typeof user.id !== "string") return null;
    return {
      id: user.id,
      name: user.name ?? null,
      image: user.image ?? null,
    };
  } catch {
    return null;
  }
}

export async function setStoredAuth(
  apiKey: string,
  opts?: { keyId?: string; user?: ExtensionUser | null }
) {
  await LocalStorage.setItem(STORAGE_KEYS.apiKey, apiKey);
  if (opts?.keyId) {
    await LocalStorage.setItem(STORAGE_KEYS.keyId, opts.keyId);
  }
  if (opts?.user) {
    await LocalStorage.setItem(STORAGE_KEYS.user, JSON.stringify(opts.user));
  }
}

export async function clearStoredAuth() {
  await LocalStorage.removeItem(STORAGE_KEYS.apiKey);
  await LocalStorage.removeItem(STORAGE_KEYS.keyId);
  await LocalStorage.removeItem(STORAGE_KEYS.user);
  await LocalStorage.removeItem(STORAGE_KEYS.askAiSessionId);
  await LocalStorage.removeItem(STORAGE_KEYS.askAiMessages);
}

export async function loginUrl(state: string): Promise<string> {
  const next = `/extension/connect?state=${encodeURIComponent(state)}&client=raycast`;
  return `${siteUrl()}/login?next=${encodeURIComponent(next)}`;
}

export async function startBrowserLogin(): Promise<string> {
  const state = crypto.randomUUID();
  await open(await loginUrl(state));
  return state;
}
