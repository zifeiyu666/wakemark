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

// Hex equivalents of CATEGORY_COLORS for contexts without Tailwind (the
// weekly digest email renders inline styles only). Values mirror the
// tailwind *-500 palette used by the dashboard chips.
export const CATEGORY_HEX: Record<BookmarkCategory, string> = {
  Tech: "#3b82f6",
  Design: "#a855f7",
  Business: "#f59e0b",
  SaaS: "#10b981",
  AI: "#ec4899",
  Marketing: "#f97316",
  "Indie Hacking": "#06b6d4",
  Fun: "#84cc16",
  Lifestyle: "#f43f5e",
};

// Fallback swatch for buckets outside the preset categories (e.g. "Other").
export const DEFAULT_CATEGORY_HEX = "#8b8b8b";

export function categoryHex(category: string): string {
  return CATEGORY_HEX[category as BookmarkCategory] ?? DEFAULT_CATEGORY_HEX;
}

// Palette for user-created custom tags; the id is stored in
// bookmark_tags.color and rendered through the chip class below.
export const TAG_COLORS = [
  { id: "blue", chip: "bg-blue-500" },
  { id: "purple", chip: "bg-purple-500" },
  { id: "amber", chip: "bg-amber-500" },
  { id: "emerald", chip: "bg-emerald-500" },
  { id: "pink", chip: "bg-pink-500" },
  { id: "orange", chip: "bg-orange-500" },
  { id: "cyan", chip: "bg-cyan-500" },
  { id: "lime", chip: "bg-lime-500" },
  { id: "red", chip: "bg-red-500" },
  { id: "violet", chip: "bg-violet-500" },
] as const;

export type TagColorId = (typeof TAG_COLORS)[number]["id"];

export function isTagColorId(value: string): value is TagColorId {
  return TAG_COLORS.some((c) => c.id === value);
}

export function tagColorChipClass(
  id: string | null | undefined
): string | null {
  return TAG_COLORS.find((c) => c.id === id)?.chip ?? null;
}
