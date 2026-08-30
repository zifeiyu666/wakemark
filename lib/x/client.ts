import "server-only";

const API_BASE = "https://api.x.com/2";

export interface XRateLimitInfo {
  limit?: number;
  remaining?: number;
  reset?: number; // unix seconds
}

export type XApiErrorKind =
  | "rate-limit" // 429 .../rate-limit-exceeded: wait & retry later
  | "usage-capped" // 429 .../usage-capped: billing cap, never retry
  | "invalid-token" // 401: access token expired/revoked
  | "invalid-pagination" // 400: pagination_token expired/invalid
  | "http";

export class XApiError extends Error {
  status: number;
  kind: XApiErrorKind;
  rateLimit?: XRateLimitInfo;

  constructor(
    message: string,
    status: number,
    kind: XApiErrorKind,
    rateLimit?: XRateLimitInfo
  ) {
    super(message);
    this.name = "XApiError";
    this.status = status;
    this.kind = kind;
    this.rateLimit = rateLimit;
  }
}

export function parseRateLimitHeaders(headers: Headers): XRateLimitInfo {
  const limit = Number(headers.get("x-rate-limit-limit") ?? NaN);
  const remaining = Number(headers.get("x-rate-limit-remaining") ?? NaN);
  const reset = Number(headers.get("x-rate-limit-reset") ?? NaN);
  return {
    limit: Number.isFinite(limit) ? limit : undefined,
    remaining: Number.isFinite(remaining) ? remaining : undefined,
    reset: Number.isFinite(reset) ? reset : undefined,
  };
}

export interface NormalizedBookmark {
  tweetId: string;
  text: string;
  authorXId?: string;
  authorUsername?: string;
  authorName?: string;
  authorProfileImageUrl?: string;
  tweetCreatedAt?: Date;
  mediaUrls: string[];
  // Parallel to mediaUrls: 'photo' | 'video' | 'animated_gif'. Video entries
  // carry the preview thumbnail (X exposes no direct playable url here).
  mediaTypes: string[];
  urls: string[];
  metrics: { likes: number; retweets: number; replies: number };
}

export interface BookmarksPage {
  bookmarks: NormalizedBookmark[];
  nextToken?: string;
  rateLimit: XRateLimitInfo;
}

interface XTweet {
  id: string;
  text: string;
  note_tweet?: { text?: string };
  author_id?: string;
  created_at?: string;
  entities?: { urls?: Array<{ expanded_url?: string; url?: string }> };
  attachments?: { media_keys?: string[] };
  public_metrics?: {
    like_count?: number;
    repost_count?: number;
    reply_count?: number;
  };
}

interface XMedia {
  media_key: string;
  type?: string;
  url?: string;
  preview_image_url?: string;
}

interface XUser {
  id: string;
  username?: string;
  name?: string;
  profile_image_url?: string;
}

interface XBookmarksResponse {
  data?: XTweet[];
  includes?: { users?: XUser[]; media?: XMedia[] };
  meta?: { next_token?: string; result_count?: number };
}

// Field set verified against real-world usage: note_tweet avoids 280-char
// truncation; entities carries expanded urls; includes must be joined manually.
const BOOKMARKS_QUERY: Record<string, string> = {
  max_results: "100",
  "tweet.fields":
    "id,text,note_tweet,author_id,created_at,entities,attachments,public_metrics",
  expansions: "author_id,attachments.media_keys",
  "user.fields": "id,username,name,profile_image_url",
  "media.fields": "media_key,type,url,preview_image_url",
};

export async function fetchBookmarksPageForUser(
  accessToken: string,
  xUserId: string,
  paginationToken?: string | null
): Promise<BookmarksPage> {
  const url = new URL(`${API_BASE}/users/${xUserId}/bookmarks`);
  for (const [key, value] of Object.entries(BOOKMARKS_QUERY)) {
    url.searchParams.set(key, value);
  }
  if (paginationToken) {
    url.searchParams.set("pagination_token", paginationToken);
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const rateLimit = parseRateLimitHeaders(res.headers);

  if (!res.ok) {
    const bodyText = await res.text();
    let body: { type?: string; title?: string; detail?: string } = {};
    try {
      body = JSON.parse(bodyText);
    } catch {
      // ignore malformed bodies
    }
    if (res.status === 429) {
      const kind: XApiErrorKind = body.type?.endsWith("/usage-capped")
        ? "usage-capped"
        : "rate-limit";
      throw new XApiError(
        `X API rate limited (${kind})`,
        429,
        kind,
        rateLimit
      );
    }
    if (res.status === 401) {
      throw new XApiError("X access token invalid or expired", 401, "invalid-token", rateLimit);
    }
    if (res.status === 400 && paginationToken) {
      // expired/invalid pagination_token -> caller should restart without it
      throw new XApiError(
        `X bookmarks pagination token rejected: ${body.detail ?? bodyText}`,
        400,
        "invalid-pagination",
        rateLimit
      );
    }
    throw new XApiError(
      `X bookmarks request failed (${res.status}): ${bodyText.slice(0, 300)}`,
      res.status,
      "http",
      rateLimit
    );
  }

  const json = (await res.json()) as XBookmarksResponse;
  const usersById = new Map<string, XUser>(
    (json.includes?.users ?? []).map((u) => [u.id, u])
  );
  const mediaByKey = new Map<string, XMedia>(
    (json.includes?.media ?? []).map((m) => [m.media_key, m])
  );

  const bookmarks: NormalizedBookmark[] = (json.data ?? []).map((tweet) => {
    const author = tweet.author_id ? usersById.get(tweet.author_id) : undefined;
    const mediaUrls: string[] = [];
    const mediaTypes: string[] = [];
    for (const key of tweet.attachments?.media_keys ?? []) {
      const m = mediaByKey.get(key);
      if (!m?.type) continue;
      if (m.type === "photo") {
        if (!m.url) continue;
        mediaUrls.push(m.url);
        mediaTypes.push("photo");
      } else if (m.type === "video" || m.type === "animated_gif") {
        if (!m.preview_image_url) continue;
        mediaUrls.push(m.preview_image_url);
        mediaTypes.push(m.type);
      }
    }
    const urls = (tweet.entities?.urls ?? [])
      .map((u) => u.expanded_url ?? u.url ?? "")
      .filter(Boolean);
    return {
      tweetId: tweet.id,
      text: tweet.note_tweet?.text ?? tweet.text ?? "",
      authorXId: author?.id,
      authorUsername: author?.username,
      authorName: author?.name,
      authorProfileImageUrl: author?.profile_image_url,
      tweetCreatedAt: tweet.created_at
        ? new Date(tweet.created_at)
        : undefined,
      mediaUrls,
      mediaTypes,
      urls,
      metrics: {
        likes: tweet.public_metrics?.like_count ?? 0,
        retweets: tweet.public_metrics?.repost_count ?? 0,
        replies: tweet.public_metrics?.reply_count ?? 0,
      },
    };
  });

  return {
    bookmarks,
    nextToken: json.meta?.next_token,
    rateLimit,
  };
}

export interface XMeProfile {
  id: string;
  username: string;
  name?: string;
  profileImageUrl?: string;
}

export async function fetchXMe(accessToken: string): Promise<XMeProfile> {
  const url = new URL(`${API_BASE}/users/me`);
  url.searchParams.set("user.fields", "id,username,name,profile_image_url");
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`X /users/me failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    data?: { id: string; username: string; name?: string; profile_image_url?: string };
  };
  if (!json.data) throw new Error("X /users/me returned no data");
  return {
    id: json.data.id,
    username: json.data.username,
    name: json.data.name,
    profileImageUrl: json.data.profile_image_url,
  };
}
