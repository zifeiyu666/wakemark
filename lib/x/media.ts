export type VideoVariant = {
  bit_rate?: number;
  bitrate?: number;
  content_type?: string;
  contentType?: string;
  url?: string;
};

/** Highest-bitrate MP4 from X API v2 `variants` or GraphQL `video_info.variants`. */
export function pickBestMp4Url(variants: unknown): string | undefined {
  if (!Array.isArray(variants)) return undefined;
  const mp4s: { url: string; bitrate: number }[] = [];
  for (const raw of variants) {
    if (!raw || typeof raw !== "object") continue;
    const variant = raw as VideoVariant;
    const url = typeof variant.url === "string" ? variant.url : "";
    const contentType = variant.content_type ?? variant.contentType ?? "";
    const isMp4 =
      contentType === "video/mp4" ||
      (!contentType && url.includes(".mp4"));
    if (!url || !isMp4) continue;
    mp4s.push({
      url,
      bitrate: variant.bit_rate ?? variant.bitrate ?? 0,
    });
  }
  if (mp4s.length === 0) return undefined;
  mp4s.sort((a, b) => b.bitrate - a.bitrate);
  return mp4s[0].url;
}
