// Structured render payload stored in digests.content. The dashboard viewer
// and the weekly email both render from this shape, so keep it serializable
// (no Date/Map) and stable.

export type DigestHighlightItem = {
  bookmarkId: string;
  tweetId: string;
  authorName: string | null;
  authorUsername: string | null;
  authorProfileImageUrl: string | null;
  summary: string;
  /** Optional one-line editorial comment from the weekly AI pass. */
  insight?: string | null;
};

export type DigestHighlightGroup = {
  category: string;
  items: DigestHighlightItem[];
};

export type DigestAlsoBookmarked = {
  tweetId: string;
  authorUsername: string | null;
  text: string;
};

export type DigestContent = {
  highlightGroups: DigestHighlightGroup[];
  alsoBookmarked: DigestAlsoBookmarked[];
};
