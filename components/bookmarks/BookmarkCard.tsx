"use client";

import type { BookmarkRow } from "@/actions/bookmarks/list";
import { updateBookmarkTags } from "@/actions/bookmarks/list";
import {
  BOOKMARK_CATEGORIES,
  CATEGORY_COLORS,
  isBookmarkCategory,
  type BookmarkCategory,
} from "@/config/bookmark-categories";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowUpRight,
  Heart,
  Loader2,
  MessageCircle,
  Play,
  Repeat2,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

const compactNumber = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function TagChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove?: (label: string) => void;
}) {
  const isCategory = isBookmarkCategory(label);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium",
        isCategory
          ? cn(CATEGORY_COLORS[label as BookmarkCategory].chip, "text-white")
          : "bg-secondary text-secondary-foreground"
      )}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${label}`}
          className="rounded-sm opacity-70 transition-opacity hover:opacity-100"
          onClick={() => onRemove(label)}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

export function BookmarkCard({
  bookmark,
  selectionMode,
  selected,
  onToggleSelected,
  onChanged,
}: {
  bookmark: BookmarkRow;
  selectionMode: boolean;
  selected: boolean;
  onToggleSelected: (id: string) => void;
  onChanged: () => void;
}) {
  const t = useTranslations("Bookmarks");
  const [customTag, setCustomTag] = useState("");
  const [busy, setBusy] = useState(false);

  const tags = [
    ...(bookmark.primaryCategory ? [bookmark.primaryCategory] : []),
    ...bookmark.subTags,
  ];
  const mediaTypes = (bookmark.mediaTypes ?? []).slice(0, 2);
  const media = (bookmark.mediaUrls ?? [])
    .slice(0, 2)
    .map((url, i) => ({ url, type: mediaTypes[i] ?? "photo" }));
  const videoMedia = media.find((m) => m.type !== "photo");
  const photoMedia = media.filter((m) => m.type === "photo");
  const isProcessing =
    bookmark.status === "pending" || bookmark.status === "processing";

  const applyTagChange = async (add?: string, remove?: string) => {
    setBusy(true);
    const res = await updateBookmarkTags({ id: bookmark.id, add, remove });
    setBusy(false);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    onChanged();
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    applyTagChange(trimmed);
    setCustomTag("");
  };

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-background p-4 transition-colors",
        selected && "border-foreground"
      )}
    >
      {/* header */}
      <div className="flex items-center gap-2">
        {selectionMode && (
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelected(bookmark.id)}
            aria-label="Select bookmark"
          />
        )}
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
        {!bookmark.isRead && (
          <span className="rounded-full bg-foreground px-2 py-0.5 text-xs font-medium text-background">
            {t("card.unread")}
          </span>
        )}
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(bookmark.syncedAt), {
            addSuffix: true,
          })}
        </span>
      </div>

      {/* text */}
      <p className="line-clamp-6 whitespace-pre-wrap text-sm text-foreground">
        {bookmark.text}
      </p>

      {/* media */}
      {videoMedia && (
        <div className="relative aspect-video overflow-hidden rounded-md bg-secondary">
          <a
            href={`https://x.com/i/status/${bookmark.tweetId}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("card.playVideo")}
            className="group relative block h-full w-full"
          >
            <Image
              src={videoMedia.url}
              alt={t("card.videoCover")}
              width={600}
              height={338}
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
              <span className="flex size-12 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm transition-transform group-hover:scale-105">
                <Play className="ml-0.5 size-5 fill-white text-white" />
              </span>
            </span>
          </a>
        </div>
      )}
      {photoMedia.length > 0 && (
        <div
          className={cn(
            "grid gap-1 overflow-hidden rounded-md",
            photoMedia.length > 1 ? "grid-cols-2" : "grid-cols-1"
          )}
        >
          {photoMedia.map((m) => (
            <Image
              key={m.url}
              src={m.url}
              alt="bookmark media"
              width={600}
              height={314}
              className="aspect-[1.91/1] w-full rounded-md object-cover"
            />
          ))}
        </div>
      )}

      {/* summary (AI) */}
      {bookmark.summary && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
          <span className="line-clamp-2">{bookmark.summary}</span>
        </p>
      )}
      {isProcessing && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          {t("card.processing")}
        </p>
      )}
      {bookmark.status === "failed" && (
        <p className="text-xs text-destructive">{t("card.failed")}</p>
      )}

      {/* tags */}
      <div className="flex flex-wrap items-center gap-1.5">
        {isProcessing ? (
          <Skeleton className="h-5 w-16" />
        ) : (
          tags.map((tag) => (
            <TagChip
              key={tag}
              label={tag}
              onRemove={busy ? undefined : (label) => applyTagChange(undefined, label)}
            />
          ))
        )}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-sm border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Tag className="h-3 w-3" />
              {t("card.addTag")}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-48 p-2">
            <div className="flex flex-col gap-1">
              {BOOKMARK_CATEGORIES.filter((c) => !tags.includes(c)).map(
                (category) => (
                  <button
                    key={category}
                    type="button"
                    className="flex items-center gap-2 rounded-sm px-2 py-1 text-left text-xs hover:bg-secondary"
                    onClick={() => addTag(category)}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        CATEGORY_COLORS[category].dot
                      )}
                    />
                    {category}
                  </button>
                )
              )}
              <div className="mt-1 border-t border-border pt-2">
                <Input
                  value={customTag}
                  placeholder={t("card.customTagPlaceholder")}
                  className="h-7 text-xs"
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addTag(customTag);
                  }}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* footer */}
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
