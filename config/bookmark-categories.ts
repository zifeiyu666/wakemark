// Preset primary categories for AI bookmark tagging (see DESIGN screenshots).
// Kept out of 'use server' files on purpose (server files must not export
// non-async constants).
export const BOOKMARK_CATEGORIES = [
  "Tech",
  "Design",
  "Business",
  "SaaS",
  "AI",
  "Marketing",
  "Indie Hacking",
  "Fun",
  "Lifestyle",
] as const;

export type BookmarkCategory = (typeof BOOKMARK_CATEGORIES)[number];

// Tailwind token classes for category chips (dot + filled chip variants).
export const CATEGORY_COLORS: Record<BookmarkCategory, { dot: string; chip: string }> = {
  Tech: { dot: "bg-blue-500", chip: "bg-blue-500" },
  Design: { dot: "bg-purple-500", chip: "bg-purple-500" },
  Business: { dot: "bg-amber-500", chip: "bg-amber-500" },
  SaaS: { dot: "bg-emerald-500", chip: "bg-emerald-500" },
  AI: { dot: "bg-pink-500", chip: "bg-pink-500" },
  Marketing: { dot: "bg-orange-500", chip: "bg-orange-500" },
  "Indie Hacking": { dot: "bg-cyan-500", chip: "bg-cyan-500" },
  Fun: { dot: "bg-lime-500", chip: "bg-lime-500" },
  Lifestyle: { dot: "bg-rose-500", chip: "bg-rose-500" },
};

export function isBookmarkCategory(value: string): value is BookmarkCategory {
  return (BOOKMARK_CATEGORIES as readonly string[]).includes(value);
}
