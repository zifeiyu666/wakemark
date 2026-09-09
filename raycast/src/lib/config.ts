import { getPreferenceValues } from "@raycast/api";

type Preferences = {
  siteUrl?: string;
};

export function siteUrl(): string {
  const { siteUrl } = getPreferenceValues<Preferences>();
  const raw = (siteUrl?.trim() || "https://wakemark.app").replace(/\/$/, "");
  return raw;
}

export const STORAGE_KEYS = {
  apiKey: "wakemark.apiKey",
  keyId: "wakemark.keyId",
  user: "wakemark.user",
  askAiSessionId: "wakemark.askAiSessionId",
  askAiMessages: "wakemark.askAiMessages",
} as const;
