export type SearchGuide = {
  title: string;
  description: string;
  href: string;
  keyword: string;
};

export const SEARCH_GUIDES: SearchGuide[] = [
  {
    title: "How to Search Tweets by Date on X (Twitter)",
    description:
      "since: and until:, exclusive end dates, and how to find old tweets that are still online.",
    href: "/blog/twitter-search-by-date",
    keyword: "how to search tweets by date",
  },
  {
    title: "How to Search Tweets from a Specific User on X",
    description:
      "from: plus a keyword, and how to: versus @mentions when you search one account.",
    href: "/blog/search-tweets-from-a-user",
    keyword: "search tweets from a user",
  },
  {
    title: "Twitter Search Operators: The Complete List",
    description:
      "A readable table of the operators this form writes, with examples you can type by hand.",
    href: "/blog/twitter-search-operators",
    keyword: "twitter search operators",
  },
  {
    title: "Search Twitter Without an Account",
    description:
      "What you can build without signing up, and what X still requires before you see results.",
    href: "/blog/search-twitter-without-an-account",
    keyword: "search twitter without an account",
  },
  {
    title: "Deleted Tweets Search: What's Actually Possible",
    description:
      "X cannot search deleted posts. If you synced a bookmark to WakeMark first, your copy stays. Plus Wayback, archives, and honest limits.",
    href: "/blog/deleted-tweets-search",
    keyword: "deleted tweets search",
  },
];

/** Eight common operators shown as a teaser on the tool page. */
export const OPERATOR_TEASER_ROWS = [
  { field: "Include all of these words", operator: "term1 term2" },
  { field: "Include this exact phrase", operator: '"exact phrase"' },
  { field: "From these accounts", operator: "from:handle" },
  { field: "Min likes", operator: "min_faves:10" },
  { field: "From / to date", operator: "since:2024-01-01 until:2024-06-30" },
  { field: "Images only", operator: "filter:images" },
  { field: "Posts with links", operator: "filter:links" },
  { field: "Verified accounts only", operator: "filter:verified" },
] as const;
