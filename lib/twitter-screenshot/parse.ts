const TWEET_ID_PATTERN = /^\d+$/;

export function parseTweetId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (TWEET_ID_PATTERN.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = url.hostname.replace(/^www\./, "");
    if (!["twitter.com", "x.com", "mobile.twitter.com"].includes(host)) {
      return null;
    }
    const match = url.pathname.match(/\/status\/(\d+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
