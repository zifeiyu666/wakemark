/** Site URL the extension talks to. Set via VITE_SITE_URL in .env* files. */
const raw = import.meta.env.VITE_SITE_URL;
if (!raw || typeof raw !== "string") {
  throw new Error(
    "Missing VITE_SITE_URL. Set it in extension/.env.development or extension/.env.production"
  );
}

export const SITE_URL = raw.replace(/\/$/, "");

export const STORAGE_KEYS = {
  apiKey: "wakemark.apiKey",
  keyId: "wakemark.keyId",
  user: "wakemark.user",
  askAiSessionId: "wakemark.askAiSessionId",
  askAiMessages: "wakemark.askAiMessages",
  askAiDraft: "wakemark.askAiDraft",
  authState: "wakemark.authState",
  authTabId: "wakemark.authTabId",
} as const;
