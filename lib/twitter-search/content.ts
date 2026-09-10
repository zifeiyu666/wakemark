export type FaqItem = {
  question: string;
  answer: string;
};

export type OperatorRow = {
  field: string;
  operator: string;
};

export type Recipe = {
  title: string;
  description: string;
  setup: string;
};

export const FILTER_GROUPS = [
  {
    title: "Words",
    example: "cold brew -decaf",
    body: "Match every word, an exact phrase, any of a list, or drop terms you do not want. Hashtags and language live here too.",
  },
  {
    title: "Accounts",
    example: "from:nytimes",
    body: "Limit posts from an account, replies sent to it, or posts that mention it. Handles work with or without the @.",
  },
  {
    title: "Engagement",
    example: "min_faves:500",
    body: "Set a floor for likes, replies, or reposts so you skip the long tail and keep posts that actually landed.",
  },
  {
    title: "Filters",
    example: "filter:images -filter:links",
    body: "Narrow by post type (original, reply, repost, quote), media (images, video, GIFs), and whether posts carry links.",
  },
  {
    title: "Dates",
    example: "since:2024-01-01 until:2024-06-30",
    body: "Twitter search by date uses since: and until:. Pair a window with an account or keyword when you need old tweets, not whatever ranks today.",
  },
  {
    title: "Location",
    example: 'near:"San Francisco" within:15mi',
    body: "Narrow to posts near a place, or near you, within a distance you set. Location search is approximate and only covers posts with location data.",
  },
  {
    title: "Sources and verification",
    example: "url:nytimes.com filter:verified",
    body: "Limit results to posts linking a domain, or to verified accounts. Useful when you are tracing where a claim came from.",
  },
] as const;

export const OPERATOR_ROWS: OperatorRow[] = [
  { field: "Include all of these words", operator: "term1 term2" },
  { field: "Include this exact phrase", operator: '"exact phrase"' },
  { field: "Include any of these words", operator: "(one OR two)" },
  { field: "Exclude these words", operator: "-term" },
  { field: "Hashtags", operator: "(#tag)" },
  { field: "Language", operator: "lang:en" },
  { field: "From these accounts", operator: "(from:handle)" },
  { field: "To these accounts", operator: "(to:handle)" },
  { field: "Mentioning these accounts", operator: "(@handle)" },
  { field: "Min likes", operator: "min_faves:10" },
  { field: "Min replies", operator: "min_replies:2" },
  { field: "Min reposts", operator: "min_retweets:3" },
  {
    field: "Original posts only",
    operator: "-filter:replies -filter:retweets -filter:quote",
  },
  { field: "Replies only", operator: "filter:replies" },
  { field: "Reposts only", operator: "filter:retweets" },
  { field: "Quotes only", operator: "filter:quote" },
  { field: "Images only", operator: "filter:images" },
  { field: "Videos only", operator: "filter:videos" },
  { field: "GIFs only", operator: "filter:gifs" },
  { field: "Posts with links", operator: "filter:links" },
  { field: "Posts without links", operator: "-filter:links" },
  { field: "From / to date", operator: "since:2024-01-01 until:2024-06-30" },
  { field: "Location", operator: 'near:"San Francisco"' },
  { field: "Distance (miles)", operator: "within:15mi" },
  { field: "Target domains", operator: "url:example.com" },
  { field: "Verified accounts only", operator: "filter:verified" },
  { field: "Accounts you follow", operator: "filter:follows" },
];

export const RECIPES: Recipe[] = [
  {
    title: "Brand mentions nobody tagged",
    description: "Catch people talking about you without the @ or the hashtag.",
    setup:
      "Any of these words: your brand and common misspellings. Exclude these words: your own handle.",
  },
  {
    title: "Posts that actually landed",
    description: "Skip the long tail and see what resonated on a topic.",
    setup: "All of these words: your topic. Min likes: 500.",
  },
  {
    title: "Questions people are asking",
    description: "Find people asking about a category so you can answer them.",
    setup:
      "Any of these words: your category terms. All of these words: how, recommend.",
  },
  {
    title: "What one account said about a topic",
    description: "Everything a single account posted on a subject, in one search.",
    setup:
      "From these accounts: the handle. All of these words: the topic. Add a date range if you only want a window.",
  },
  {
    title: "An event, as it happened",
    description:
      "Pin a search to the window an event occurred in, rather than what ranks today.",
    setup:
      "Exact phrase: the event name. From date and To date: the window of the event.",
  },
  {
    title: "Verified sources only",
    description:
      "Narrow to verified accounts and a publication's links when you are tracing a claim.",
    setup: "Verified accounts only: on. Target domains: the publication domain.",
  },
];

export const FAQS: FaqItem[] = [
  {
    question: "Is this advanced Twitter search tool free?",
    answer:
      "Yes. Every filter works without a WakeMark account and without a card. Recent searches stay in this browser. Signing in to WakeMark is only needed if you want to save X bookmarks and search those later.",
  },
  {
    question: "Can I search Twitter without an account?",
    answer:
      "You can build the query here with no account. To view results, X currently asks you to sign in. Your filters are encoded in the search URL, so they survive the X login wall. This page is a query builder, not a logged-out tweet viewer.",
  },
  {
    question: "How do I search tweets by date?",
    answer:
      "Set From date, To date, or both under Dates. Twitter search by date runs on the since: and until: operators. until: is exclusive (posts before that day), so to include June 30 set To date to July 1. Pair the window with an account or a keyword when you want old tweets rather than last week's noise.",
  },
  {
    question: "How do I search one person's tweets for a specific word?",
    answer:
      "Put their handle in From these accounts and the word in Include all of these words. Add a date range if you want a specific period. That is the from:handle keyword pattern X makes hardest to discover in its own app.",
  },
  {
    question: "Is X advanced search the same as Twitter advanced search?",
    answer:
      "Same feature, different name. X kept the search operators after the rebrand, so queries written for Twitter still work. People still search for Twitter, tweet, and X. The operators (from:, since:, min_faves:) did not change.",
  },
  {
    question: "Why does my Twitter search return no results?",
    answer:
      "Usually too many filters at once, or two that contradict each other, such as excluding posts with links while also targeting a domain. Clear engagement floors first, then the date range, and add filters back one at a time. X's index is also incomplete for old, low-engagement posts.",
  },
  {
    question: "Can I search for images or video only?",
    answer:
      "Yes. Under Filters, set Media to images, videos, or GIFs. X supports this through filter:images, filter:videos, and filter:gifs. Here it is a radio button.",
  },
  {
    question: "Does Twitter advanced search work on mobile?",
    answer:
      "Yes. X's mobile apps still have no advanced search form. Open this page in your phone's browser, set the filters, and search. Results open in X, in the app if you have it installed.",
  },
  {
    question: "Can I run a Twitter hashtag search?",
    answer:
      "Yes. The Hashtags field takes one or more tags. You do not need to type the #, though it is fine if you do. Combine a tag with min likes or a date range when the raw tag is too noisy.",
  },
];

export const COMPARISON_ROWS = [
  { feature: "Words, phrase, exclusions, hashtags", xForm: "Yes", here: "Yes" },
  { feature: "Accounts: from, to, mentions", xForm: "Yes", here: "Yes" },
  { feature: "Minimum likes, replies, reposts", xForm: "Yes", here: "Yes" },
  { feature: "Date range", xForm: "Yes", here: "Yes" },
  { feature: "Images, video, or GIFs only", xForm: "Operator only", here: "A field" },
  { feature: "Original, reply, repost, or quote", xForm: "Replies only", here: "A field" },
  { feature: "Exclude posts with links", xForm: "Operator only", here: "A field" },
  { feature: "Posts linking a specific domain", xForm: "Operator only", here: "A field" },
  { feature: "Verified accounts only", xForm: "Operator only", here: "A field" },
  { feature: "Languages beyond its dropdown", xForm: "Operator only", here: "In the dropdown" },
  { feature: "Live query preview you can copy", xForm: "No", here: "Yes" },
  { feature: "Recent searches without signup", xForm: "No", here: "In this browser" },
] as const;
