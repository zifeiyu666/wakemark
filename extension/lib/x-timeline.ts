export type ScrapedBookmark = {
  tweet_id: string;
  text: string;
  author_id?: string;
  author_name?: string;
  author_username?: string;
  author_profile_image_url?: string;
  created_at?: string;
  media_urls: string[];
  media_types: string[];
  media_playback_urls: string[];
  urls: string[];
};

type Json = Record<string, unknown>;

function isRecord(value: unknown): value is Json {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function unwrapTweet(node: unknown): Json | null {
  if (!isRecord(node)) return null;
  if (isRecord(node.tweet)) return unwrapTweet(node.tweet);
  if (isRecord(node.result)) return unwrapTweet(node.result);
  if (isRecord(node.legacy) && (node.rest_id || node.legacy.id_str)) {
    return node;
  }
  return null;
}

function collectUser(tweet: Json): {
  id?: string;
  name?: string;
  username?: string;
  image?: string;
} {
  const core = isRecord(tweet.core) ? tweet.core : undefined;
  const userResults = core && isRecord(core.user_results) ? core.user_results : undefined;
  const user = userResults && isRecord(userResults.result) ? userResults.result : undefined;
  if (!user) {
    return {
      id: asString(tweet.user_id_str) ?? asString(isRecord(tweet.legacy) ? tweet.legacy.user_id_str : undefined),
    };
  }
  const userCore = isRecord(user.core) ? user.core : undefined;
  const userLegacy = isRecord(user.legacy) ? user.legacy : undefined;
  const avatar = isRecord(user.avatar) ? user.avatar : undefined;
  return {
    id: asString(user.rest_id),
    name:
      asString(userCore?.name) ??
      asString(userLegacy?.name) ??
      asString(user.name),
    username:
      asString(userCore?.screen_name) ??
      asString(userLegacy?.screen_name) ??
      asString(user.screen_name),
    image:
      asString(avatar?.image_url) ??
      asString(userLegacy?.profile_image_url_https),
  };
}

function pickBestMp4Url(variants: unknown): string | undefined {
  if (!Array.isArray(variants)) return undefined;
  const mp4s: { url: string; bitrate: number }[] = [];
  for (const raw of variants) {
    if (!isRecord(raw)) continue;
    const url = asString(raw.url);
    const contentType = asString(raw.content_type) ?? asString(raw.contentType) ?? "";
    const isMp4 =
      contentType === "video/mp4" ||
      (!contentType && !!url?.includes(".mp4"));
    if (!url || !isMp4) continue;
    const bitrate =
      typeof raw.bit_rate === "number"
        ? raw.bit_rate
        : typeof raw.bitrate === "number"
          ? raw.bitrate
          : 0;
    mp4s.push({ url, bitrate });
  }
  if (mp4s.length === 0) return undefined;
  mp4s.sort((a, b) => b.bitrate - a.bitrate);
  return mp4s[0].url;
}

function collectMedia(legacy: Json): {
  urls: string[];
  types: string[];
  playbackUrls: string[];
} {
  const urls: string[] = [];
  const types: string[] = [];
  const playbackUrls: string[] = [];
  const entities = isRecord(legacy.extended_entities)
    ? legacy.extended_entities
    : isRecord(legacy.extendedEntities)
      ? legacy.extendedEntities
      : isRecord(legacy.entities)
        ? legacy.entities
        : undefined;
  const media = entities && Array.isArray(entities.media) ? entities.media : [];
  for (const item of media) {
    if (!isRecord(item)) continue;
    const type = asString(item.type) ?? "photo";
    const preview =
      asString(item.media_url_https) ?? asString(item.media_url);
    const videoInfo = isRecord(item.video_info)
      ? item.video_info
      : isRecord(item.videoInfo)
        ? item.videoInfo
        : undefined;
    const playback =
      type === "video" || type === "animated_gif"
        ? pickBestMp4Url(videoInfo?.variants) ?? ""
        : "";
    if (!preview && !playback) continue;
    urls.push(preview || playback);
    types.push(type);
    playbackUrls.push(playback);
  }
  return { urls, types, playbackUrls };
}

function collectUrls(legacy: Json): string[] {
  const entities = isRecord(legacy.entities) ? legacy.entities : undefined;
  const list = entities && Array.isArray(entities.urls) ? entities.urls : [];
  return list
    .map((item) =>
      isRecord(item)
        ? asString(item.expanded_url) ?? asString(item.url) ?? ""
        : ""
    )
    .filter(Boolean);
}

function tweetText(tweet: Json, legacy: Json): string {
  const note = isRecord(tweet.note_tweet) ? tweet.note_tweet : undefined;
  const noteResults =
    note && isRecord(note.note_tweet_results) ? note.note_tweet_results : undefined;
  const noteResult =
    noteResults && isRecord(noteResults.result) ? noteResults.result : undefined;
  return (
    asString(noteResult?.text) ??
    asString(legacy.full_text) ??
    asString(legacy.text) ??
    ""
  );
}

function createdAtIso(legacy: Json): string | undefined {
  const raw = asString(legacy.created_at);
  if (!raw) return undefined;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toISOString();
}

function toScraped(node: unknown): ScrapedBookmark | null {
  const tweet = unwrapTweet(node);
  if (!tweet) return null;
  const legacy = isRecord(tweet.legacy) ? tweet.legacy : null;
  if (!legacy) return null;
  const tweetId = asString(tweet.rest_id) ?? asString(legacy.id_str);
  if (!tweetId) return null;
  const user = collectUser(tweet);
  const media = collectMedia(legacy);
  return {
    tweet_id: tweetId,
    text: tweetText(tweet, legacy),
    author_id: user.id,
    author_name: user.name,
    author_username: user.username,
    author_profile_image_url: user.image,
    created_at: createdAtIso(legacy),
    media_urls: media.urls,
    media_types: media.types,
    media_playback_urls: media.playbackUrls,
    urls: collectUrls(legacy),
  };
}

function walk(node: unknown, found: Map<string, ScrapedBookmark>) {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, found);
    return;
  }
  if (!isRecord(node)) return;
  const scraped = toScraped(node);
  if (scraped && !found.has(scraped.tweet_id)) {
    found.set(scraped.tweet_id, scraped);
  }
  for (const value of Object.values(node)) walk(value, found);
}

export function looksLikeBookmarkTimeline(payload: unknown): boolean {
  try {
    const text = typeof payload === "string" ? payload : JSON.stringify(payload);
    return (
      text.includes("bookmark_timeline") ||
      text.includes("Bookmarks") ||
      text.includes('"entryId":"tweet-')
    );
  } catch {
    return false;
  }
}

export function extractBookmarksFromPayload(
  payload: unknown
): ScrapedBookmark[] {
  const found = new Map<string, ScrapedBookmark>();
  walk(payload, found);
  return [...found.values()];
}
