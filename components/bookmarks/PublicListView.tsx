"use client";

import type { PublicListBookmark } from "@/lib/bookmarks/public-lists";
import { TwitterX } from "@/components/social-icons/icons";
import { Input } from "@/components/ui/input";
import {
  CATEGORY_COLORS,
  isBookmarkCategory,
  tagColorChipClass,
  type BookmarkCategory,
} from "@/config/bookmark-categories";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowUpRight,
  Eye,
  Heart,
  MessageCircle,
  Repeat2,
  Search,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useMemo, useState } from "react";
import { CollapsibleBookmarkText } from "@/components/bookmarks/CollapsibleBookmarkText";

const compactNumber = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function PublicTagChip({
  label,
  colorId,
}: {
  label: string;
  colorId?: string | null;
}) {
  const isCategory = isBookmarkCategory(label);
  const colorClass = tagColorChipClass(colorId);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium",
        isCategory
          ? cn(CATEGORY_COLORS[label as BookmarkCategory].chip, "text-white")
          : colorClass
            ? cn(colorClass, "text-white")
            : "bg-secondary text-secondary-foreground"
      )}
    >
      {label}
    </span>
  );
}

function PublicBookmarkCard({
  bookmark,
  tagColors,
}: {
  bookmark: PublicListBookmark;
  tagColors: Record<string, string | null>;
}) {
  const t = useTranslations("Bookmarks");
  const tags = [
    ...(bookmark.primaryCategory ? [bookmark.primaryCategory] : []),
    ...bookmark.subTags,
  ];

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4">
      <div className="flex items-center gap-2">
        {bookmark.authorProfileImageUrl ? (
          <Image
            src={bookmark.authorProfileImageUrl}
            alt={bookmark.authorName ?? bookmark.authorUsername ?? "avatar"}
            width={32}
            height={32}
            className="size-8 rounded-full"
          />
        ) : (
          <div className="size-8 rounded-full bg-secondary" />
        )}
        <span className="truncate text-sm font-semibold">
          @{bookmark.authorUsername ?? "unknown"}
        </span>
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(bookmark.syncedAt), {
            addSuffix: true,
          })}
        </span>
      </div>

      <CollapsibleBookmarkText text={bookmark.text} />

      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((tag) => (
            <PublicTagChip
              key={tag}
              label={tag}
              colorId={tagColors[tag] ?? null}
            />
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Heart className="h-3.5 w-3.5" />
          {compactNumber.format(bookmark.metrics?.likes ?? 0)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Repeat2 className="h-3.5 w-3.5" />
          {compactNumber.format(bookmark.metrics?.retweets ?? 0)}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" />
          {compactNumber.format(bookmark.metrics?.replies ?? 0)}
        </span>
        <a
          href={`https://x.com/i/status/${bookmark.tweetId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1 font-medium text-foreground transition-opacity hover:opacity-70"
        >
          {t("card.openTweet")}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  );
}

export function PublicListView({
  listName,
  ownerUsername,
  bookmarks,
  tagColors,
}: {
  listName: string;
  ownerUsername: string;
  bookmarks: PublicListBookmark[];
  tagColors: Record<string, string | null>;
}) {
  const t = useTranslations("Lists");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookmarks;
    return bookmarks.filter(
      (b) =>
        b.text.toLowerCase().includes(q) ||
        (b.authorUsername ?? "").toLowerCase().includes(q) ||
        (b.authorName ?? "").toLowerCase().includes(q)
    );
  }, [bookmarks, search]);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex justify-end px-4 pt-4">
        <span className="rounded-sm bg-foreground px-3 py-1.5 text-sm font-medium text-background">
          {t("public.generatedBy", { site: siteConfig.name })}
        </span>
      </div>

      <header className="border-b border-border px-4 py-8 sm:px-8">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-semibold">{listName}</h1>
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            {bookmarks.length}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          {t("public.createdBy")}
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-foreground">
            <TwitterX className="h-3.5 w-3.5" />
            @{ownerUsername}
          </span>
        </div>
      </header>

      <main className="space-y-4 px-4 py-6 sm:px-8">
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("public.searchPlaceholder")}
            className="pl-8"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-border px-6 py-16 text-center text-sm text-muted-foreground">
            {t("public.noResults")}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((bookmark) => (
              <PublicBookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                tagColors={tagColors}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
