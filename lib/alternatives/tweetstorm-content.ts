export const PAGE_PATH = "/alternatives/tweetstorm-alternative";

export const PAGE_TITLE =
  "TweetStorm vs WakeMark: Best Twitter Bookmark Manager in 2026?";

export const PAGE_DESCRIPTION =
  "TweetStorm files X bookmarks into nested folders. WakeMark digests them with AI and opens the library to Cursor and Claude via MCP. Compare features, export, and 2026 pricing.";

export const PAGE_KEYWORDS = [
  "tweetstorm alternative",
  "tweetstorm vs wakemark",
  "twitter bookmark manager",
  "x bookmark manager",
  "tweetstorm.ai alternative",
  "best twitter bookmark manager 2026",
];

export type ComparisonRow = {
  dimension: string;
  tweetstorm: string;
  wakemark: string;
  tweetstormWins?: boolean;
};

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    dimension: "Philosophy",
    tweetstorm:
      "Folder-based filing: nested folders, tags, and smart-folder rules you maintain",
    wakemark:
      "AI-native knowledge: digest, auto-tag, and query the library as external memory",
  },
  {
    dimension: "Organization",
    tweetstorm:
      "Nested folders (2 levels on Pro, 3 on Agency), tags, and rule-based smart folders",
    wakemark:
      "AI topic tags plus themed lists. No three-level tree to keep tidy",
    tweetstormWins: true,
  },
  {
    dimension: "Consumption",
    tweetstorm:
      "A cleaner drawer. You still open each post and extract the point yourself",
    wakemark:
      "AI Digest pulls claims, takeaways, and next steps from long threads",
  },
  {
    dimension: "Search",
    tweetstorm:
      "Keyword search on Free; full-text plus author, date, tag, and engagement filters on paid plans",
    wakemark:
      "Semantic search, in-app AI chat, and natural-language MCP queries from Cursor or Claude",
  },
  {
    dimension: "Export / data ownership",
    tweetstorm:
      "JSON, CSV, Markdown, PDF, PNG, and media ZIP — Agency only ($15/mo or $144/yr)",
    wakemark:
      "Markdown zip, JSON, and CSV from the dashboard; Notion sync on a paid plan",
  },
  {
    dimension: "AI workflow",
    tweetstorm:
      "Remix a saved post into TweetStorm’s tweet generator and scheduler",
    wakemark:
      "Native MCP server so agents can search and cite bookmarks while you work",
  },
  {
    dimension: "Sync",
    tweetstorm:
      "Desktop needs the Chrome/Firefox extension. Mobile API backup is capped (3–5 syncs/month)",
    wakemark:
      "Official X OAuth and cloud sync. Chrome extension is optional for search and Ask AI",
  },
  {
    dimension: "Pricing (Sep 2026)",
    tweetstorm:
      "Free 500 saves. Pro $7/mo or $60/yr (no export). Agency $15/mo or $144/yr",
    wakemark:
      "7-day trial, then Founder $59/yr locked while you stay subscribed",
  },
];

export type Reason = {
  title: string;
  pain: string;
  benefit: string;
};

export const REASONS: Reason[] = [
  {
    title: "Filing cabinets vs. actually reading what you saved",
    pain: "TweetStorm’s answer is nested folders, tags, and smart folders. That architecture is complete if you enjoy maintaining a tree. Most people do not. The real failure mode of X bookmarks is not “I needed a third folder level.” It is “I saved it, never opened it, and cannot reconstruct the point.” A tidier graveyard is still a graveyard.",
    benefit:
      "WakeMark starts after the save. AI Digest compresses a 20-post thread into the claim, the caveats, and the action. Auto-tags land without drag-and-drop. You can still curate lists when you want a reading pack — you are not required to file every bookmark to make the library usable.",
  },
  {
    title: "Export locked behind Agency vs. data you can leave with",
    pain: "On TweetStorm’s bookmark plans, Pro ($7/month or $60/year) lists Export as Not included. JSON, CSV, Markdown, PDF, PNG, and a media ZIP sit on Agency at $15/month or $144/year. If you leave, the product page’s own advice is to export first — on Agency. Your library is the retention lever.",
    benefit:
      "WakeMark treats the library as yours. Download Markdown, JSON, or CSV from the bookmarks board while signed in, including during the trial. Paid plans can push pages to Notion. Developers get a native MCP endpoint, so the same bookmarks are context in Cursor and Claude — not a ZIP you buy permission to take.",
  },
  {
    title: "Keyword filters vs. asking an agent that already has the library",
    pain: "Paid TweetStorm search is strong for a file cabinet: full-text plus filters for author, date, tags, likes, and views. You still have to remember a token that exists in the tweet. Nothing in that model lets your editor say “find last week’s Next.js caching thread and drop the takeaways into this PR.”",
    benefit:
      "WakeMark indexes meaning, not only strings. Ask in the app, or from an MCP client: “Find the Next.js caching tweets I saved last week and summarize them for this repo.” The agent returns sources. Retrieval happens where the work happens.",
  },
];

export type PricingRow = {
  feature: string;
  tweetstormFree: string;
  tweetstormPro: string;
  tweetstormAgency: string;
  wakemark: string;
};

export const PRICING_ROWS: PricingRow[] = [
  {
    feature: "Price",
    tweetstormFree: "$0",
    tweetstormPro: "$7/mo or $60/yr",
    tweetstormAgency: "$15/mo or $144/yr",
    wakemark: "$59/yr Founder (locked)",
  },
  {
    feature: "Bookmark cap",
    tweetstormFree: "500",
    tweetstormPro: "5,000",
    tweetstormAgency: "Unlimited",
    wakemark: "No cap",
  },
  {
    feature: "Folders",
    tweetstormFree: "Not included",
    tweetstormPro: "Up to 10, 2 levels",
    tweetstormAgency: "Unlimited, 3 levels",
    wakemark: "Themed lists, no nested tree",
  },
  {
    feature: "Smart folders / auto-file",
    tweetstormFree: "Pre-built only",
    tweetstormPro: "3 custom + pre-built",
    tweetstormAgency: "Unlimited custom",
    wakemark: "AI auto-tags every save",
  },
  {
    feature: "Search",
    tweetstormFree: "Keyword only",
    tweetstormPro: "Full-text + filters",
    tweetstormAgency: "Full-text + advanced filters",
    wakemark: "Semantic + AI chat + MCP",
  },
  {
    feature: "AI Digest",
    tweetstormFree: "Not included",
    tweetstormPro: "Not included",
    tweetstormAgency: "Not included",
    wakemark: "Included",
  },
  {
    feature: "Export JSON / CSV / Markdown",
    tweetstormFree: "Not included",
    tweetstormPro: "Not included",
    tweetstormAgency: "Included (plus PDF, PNG, ZIP)",
    wakemark: "Included",
  },
  {
    feature: "MCP for Cursor / Claude",
    tweetstormFree: "Not included",
    tweetstormPro: "Not included",
    tweetstormAgency: "Not included",
    wakemark: "Native MCP server",
  },
  {
    feature: "Desktop sync",
    tweetstormFree: "Extension required",
    tweetstormPro: "Extension required",
    tweetstormAgency: "Extension required",
    wakemark: "Cloud OAuth; extension optional",
  },
];

export type Verdict = {
  product: string;
  pickIf: string;
};

export const VERDICTS: Verdict[] = [
  {
    product: "Pick TweetStorm",
    pickIf:
      "You want a dedicated X filing cabinet: nested folders, hand-tuned smart-folder rules, and a dashboard that looks like a research archive. You are willing to pay Agency rates if you need to take the files with you, or you mainly want TweetStorm’s generator and scheduler with bookmarks as a remix source.",
  },
  {
    product: "Pick WakeMark",
    pickIf:
      "You save faster than you file. You want the thread digested, not relocated. You care about export without a top-tier upsell, and you want the same library available to Cursor, Claude, or ChatGPT through MCP — an external memory, not another folder product.",
  },
];

export type FaqItem = {
  question: string;
  answer: string;
};

export const FAQS: FaqItem[] = [
  {
    question: "What is the difference between TweetStorm and WakeMark?",
    answer:
      "TweetStorm is a folder-based X bookmark manager: nested folders, tags, and smart-folder rules, with export reserved for its Agency plan. WakeMark is an AI-native bookmark library: it auto-tags saves, writes digests, and exposes the collection to Cursor and Claude through MCP so you can retrieve and use what you saved.",
  },
  {
    question: "Is TweetStorm a good Twitter bookmark manager?",
    answer:
      "Yes, if your job is filing. As of September 2026 its bookmark product offers nested folders, tags, smart folders, and full-text filters, with the first 500 saves free. It is weaker if you wanted digestion or an open export path: Pro does not include export, and there is no MCP interface for agents.",
  },
  {
    question: "Does TweetStorm let you export bookmarks on the Pro plan?",
    answer:
      "No. TweetStorm’s bookmark pricing table lists Export as Not included on Free and Pro. JSON, CSV, Markdown, PDF, PNG, and a media ZIP unlock on Agency at $15/month or $144/year. WakeMark ships Markdown, JSON, and CSV from the dashboard without that Agency gate.",
  },
  {
    question: "Which is cheaper: TweetStorm or WakeMark?",
    answer:
      "TweetStorm Pro is $7/month or $60/year but caps you at 5,000 bookmarks and omits export. Agency is $15/month or $144/year. WakeMark’s Founder plan is $59/year with AI Digest, MCP, and file export included. Same or less money buys digestion and an open protocol, not only folders.",
  },
  {
    question: "Can WakeMark replace TweetStorm’s nested folders?",
    answer:
      "Not as a clone. WakeMark uses AI tags and themed lists instead of a three-level folder tree. If maintaining nested directories is the workflow you want, TweetStorm is more complete there. If you were using folders as a substitute for search and memory, WakeMark removes that chore.",
  },
  {
    question: "Do I need a browser extension?",
    answer:
      "TweetStorm’s desktop sync depends on its Chrome or Firefox extension. Phone backup uses the X API on paid plans, with a handful of syncs each month. WakeMark syncs through official X OAuth in the cloud. Its Chrome extension is optional, for toolbar search and Ask AI, not the only way to keep the library current.",
  },
];
