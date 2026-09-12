const TWIMG_HOST = "twimg.com";

export function proxiedImageUrl(src?: string | null): string | undefined {
  if (!src) return undefined;
  if (src.startsWith("data:") || src.startsWith("/api/tools/tweet-screenshot/image")) {
    return src;
  }
  if (src.includes(TWIMG_HOST)) {
    return `/api/tools/tweet-screenshot/image?url=${encodeURIComponent(src)}`;
  }
  return src;
}

export function upgradeMediaSize(src: string): string {
  if (!src.includes("pbs.twimg.com/media/")) return src;
  try {
    const url = new URL(src);
    url.searchParams.set("name", "large");
    return url.toString();
  } catch {
    return src;
  }
}
