/** Site the extension talks to. Override with VITE_SITE_URL at build time. */
export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") ||
  (import.meta.env.DEV ? "http://localhost:3000" : "https://wakemark.app");

export const STORAGE_KEYS = {
  apiKey: "wakemark.apiKey",
  keyId: "wakemark.keyId",
  askAiSessionId: "wakemark.askAiSessionId",
  authState: "wakemark.authState",
  authTabId: "wakemark.authTabId",
} as const;
