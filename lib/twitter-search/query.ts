export type TweetType = "all" | "original" | "replies" | "retweets" | "quotes";
export type MediaType = "all" | "images" | "videos" | "gifs";
export type LinksFilter = "all" | "only" | "none";
export type FollowsFilter = "anyone" | "following";
export type LocationMode = "anywhere" | "nearYou" | "place";
export type SearchTab = "live" | "top";

export type AdvancedSearchFilters = {
  allWords: string;
  exactPhrase: string;
  anyWords: string;
  excludeWords: string;
  hashtags: string;
  language: string;
  fromAccounts: string;
  toAccounts: string;
  mentioningAccounts: string;
  minLikes: string;
  minReplies: string;
  minRetweets: string;
  tweetType: TweetType;
  media: MediaType;
  links: LinksFilter;
  follows: FollowsFilter;
  since: string;
  until: string;
  locationMode: LocationMode;
  location: string;
  distanceMiles: string;
  domains: string;
  verifiedOnly: boolean;
};

export const EMPTY_FILTERS: AdvancedSearchFilters = {
  allWords: "",
  exactPhrase: "",
  anyWords: "",
  excludeWords: "",
  hashtags: "",
  language: "",
  fromAccounts: "",
  toAccounts: "",
  mentioningAccounts: "",
  minLikes: "",
  minReplies: "",
  minRetweets: "",
  tweetType: "all",
  media: "all",
  links: "all",
  follows: "anyone",
  since: "",
  until: "",
  locationMode: "anywhere",
  location: "",
  distanceMiles: "",
  domains: "",
  verifiedOnly: false,
};

export function splitTokens(value: string): string[] {
  return value
    .split(/[,\s]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function stripHandle(value: string): string {
  return value.replace(/^@+/, "").trim();
}

export function stripHashtag(value: string): string {
  return value.replace(/^#+/, "").trim();
}

export function normalizeDomain(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const withProtocol = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    const host = new URL(withProtocol).hostname;
    return host.replace(/^www\./i, "");
  } catch {
    return trimmed
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/.*$/, "")
      .trim();
  }
}

function parsePositiveInt(value: string): number | null {
  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function quotePhrase(value: string): string {
  const cleaned = value.trim().replace(/^"+|"+$/g, "").trim();
  if (!cleaned) return "";
  return `"${cleaned}"`;
}

function orGroup(parts: string[]): string | null {
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];
  return `(${parts.join(" OR ")})`;
}

function operatorGroup(prefix: string, tokens: string[]): string | null {
  return orGroup(tokens.map((token) => `${prefix}${token}`));
}

export function buildAdvancedSearchQuery(filters: AdvancedSearchFilters): string {
  const parts: string[] = [];

  const allWords = splitTokens(filters.allWords);
  if (allWords.length) parts.push(allWords.join(" "));

  const exact = quotePhrase(filters.exactPhrase);
  if (exact) parts.push(exact);

  const anyWords = orGroup(splitTokens(filters.anyWords));
  if (anyWords) parts.push(anyWords);

  for (const word of splitTokens(filters.excludeWords)) {
    parts.push(word.startsWith("-") ? word : `-${word}`);
  }

  const hashtags = splitTokens(filters.hashtags)
    .map(stripHashtag)
    .filter(Boolean)
    .map((tag) => `#${tag}`);
  const hashtagGroup = orGroup(hashtags);
  if (hashtagGroup) parts.push(hashtagGroup);

  if (filters.language) parts.push(`lang:${filters.language}`);

  const fromGroup = operatorGroup(
    "from:",
    splitTokens(filters.fromAccounts).map(stripHandle).filter(Boolean)
  );
  if (fromGroup) parts.push(fromGroup);

  const toGroup = operatorGroup(
    "to:",
    splitTokens(filters.toAccounts).map(stripHandle).filter(Boolean)
  );
  if (toGroup) parts.push(toGroup);

  const mentionGroup = operatorGroup(
    "@",
    splitTokens(filters.mentioningAccounts).map(stripHandle).filter(Boolean)
  );
  if (mentionGroup) parts.push(mentionGroup);

  const minLikes = parsePositiveInt(filters.minLikes);
  if (minLikes) parts.push(`min_faves:${minLikes}`);
  const minReplies = parsePositiveInt(filters.minReplies);
  if (minReplies) parts.push(`min_replies:${minReplies}`);
  const minRetweets = parsePositiveInt(filters.minRetweets);
  if (minRetweets) parts.push(`min_retweets:${minRetweets}`);

  if (filters.tweetType === "original") {
    parts.push("-filter:replies", "-filter:retweets", "-filter:quote");
  } else if (filters.tweetType === "replies") {
    parts.push("filter:replies");
  } else if (filters.tweetType === "retweets") {
    parts.push("filter:retweets");
  } else if (filters.tweetType === "quotes") {
    parts.push("filter:quote");
  }

  if (filters.media === "images") parts.push("filter:images");
  if (filters.media === "videos") parts.push("filter:videos");
  if (filters.media === "gifs") parts.push("filter:gifs");

  if (filters.links === "only") parts.push("filter:links");
  if (filters.links === "none") parts.push("-filter:links");

  if (filters.follows === "following") parts.push("filter:follows");

  if (filters.since) parts.push(`since:${filters.since}`);
  if (filters.until) parts.push(`until:${filters.until}`);

  if (filters.locationMode === "nearYou") {
    parts.push("near:me");
  } else if (filters.locationMode === "place") {
    const place = filters.location.trim().replace(/^"+|"+$/g, "");
    if (place) parts.push(`near:"${place}"`);
    const miles = parsePositiveInt(filters.distanceMiles);
    if (place && miles) parts.push(`within:${miles}mi`);
  }

  const domains = splitTokens(filters.domains)
    .map(normalizeDomain)
    .filter(Boolean)
    .map((domain) => `url:${domain}`);
  const domainGroup = orGroup(domains);
  if (domainGroup) parts.push(domainGroup);

  if (filters.verifiedOnly) parts.push("filter:verified");

  return parts.join(" ").trim();
}

export function buildXSearchUrl(query: string, tab: SearchTab = "live"): string {
  const params = new URLSearchParams({
    q: query,
    src: "typed_query",
    f: tab,
  });
  return `https://x.com/search?${params.toString()}`;
}

export function hasAnyFilter(filters: AdvancedSearchFilters): boolean {
  return buildAdvancedSearchQuery(filters).length > 0;
}
