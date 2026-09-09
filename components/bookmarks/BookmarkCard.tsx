"use client";

import type { BookmarkRow } from "@/lib/bookmarks/query";
import { updateBookmarkTags, updateBookmarksRead } from "@/actions/bookmarks/list";
import {
  createList,
  getListsForBookmark,
  setBookmarkInList,
  type BookmarkListWithMembership,
} from "@/actions/bookmarks/lists";
import {
  BOOKMARK_CATEGORIES,
  CATEGORY_COLORS,
  TAG_COLORS,
  isBookmarkCategory,
  tagColorChipClass,
  type BookmarkCategory,
  type TagColorId,
} from "@/config/bookmark-categories";
import { Button } from "@/components/ui/button";
import { CollapsibleBookmarkText } from "@/components/bookmarks/CollapsibleBookmarkText";
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
  ListPlus,
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
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

const compactNumber = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function TagChip({
  label,
  colorId,
  onRemove,
}: {
  label: string;
  colorId?: string | null;
  onRemove?: (label: string) => void;
}) {
  const isCategory = isBookmarkCategory(label);
  const colorClass = tagColorChipClass(colorId);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-none px-2 py-0.5 text-xs font-medium",
        isCategory
          ? cn(CATEGORY_COLORS[label as BookmarkCategory].chip, "text-white")
          : colorClass
            ? cn(colorClass, "text-white")
            : "bg-secondary text-secondary-foreground"
      )}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${label}`}
          className="rounded-none opacity-70 transition-opacity hover:opacity-100"
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
  tagColors,
  onChanged,
}: {
  bookmark: BookmarkRow;
  selectionMode: boolean;
  selected: boolean;
  onToggleSelected: (id: string) => void;
  tagColors?: Record<string, string | null>;
  onChanged: () => void;
}) {
  const t = useTranslations("Bookmarks");
  const tLists = useTranslations("Lists");
  const [customTag, setCustomTag] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [tagColor, setTagColor] = useState<TagColorId>("blue");
  // Optimistic tag edits: chips update instantly while the server action runs
  // in the background; the list revalidation reconciles afterwards.
  const [optimistic, setOptimistic] = useState<{
    primaryCategory: string | null;
    subTags: string[];
  } | null>(null);
  // Serialize in-flight writes so the server's read-modify-write never races.
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  // Optimistic read flag: opening the tweet hides the Unread badge instantly.
  const [markedRead, setMarkedRead] = useState(false);
  const isRead = bookmark.isRead || markedRead;

  const primaryCategory = optimistic
    ? optimistic.primaryCategory
    : bookmark.primaryCategory;
  const subTags = optimistic ? optimistic.subTags : bookmark.subTags;
  const tags = [...(primaryCategory ? [primaryCategory] : []), ...subTags];

  // Drop the override once server data catches up with it.
  useEffect(() => {
    setOptimistic((opt) => {
      if (!opt) return opt;
      const sameCategory =
        (opt.primaryCategory ?? null) === (bookmark.primaryCategory ?? null);
      const sameTags =
        JSON.stringify([...opt.subTags].sort()) ===
        JSON.stringify([
          ...((bookmark.subTags as string[] | null) ?? []),
        ].sort());
      return sameCategory && sameTags ? null : opt;
    });
  }, [bookmark.primaryCategory, bookmark.subTags]);
  const mediaTypes = (bookmark.mediaTypes ?? []).slice(0, 2);
  const media = (bookmark.mediaUrls ?? [])
    .slice(0, 2)
    .map((url, i) => ({ url, type: mediaTypes[i] ?? "photo" }));
  const videoMedia = media.find((m) => m.type !== "photo");
  const photoMedia = media.filter((m) => m.type === "photo");
  const isProcessing =
    bookmark.status === "pending" || bookmark.status === "processing";

  const applyTagChange = (add?: string, remove?: string, color?: string) => {
    // Mirror the server-side add/remove rules so the optimistic view matches
    // what the DB will hold.
    let nextCategory = primaryCategory;
    let nextTags = [...subTags];
    if (add) {
      if (isBookmarkCategory(add) && !nextCategory) nextCategory = add;
      else if (!nextTags.includes(add) && add !== nextCategory)
        nextTags.push(add);
    }
    if (remove) {
      if (nextCategory === remove) nextCategory = null;
      nextTags = nextTags.filter((tag) => tag !== remove);
    }
    setOptimistic({ primaryCategory: nextCategory, subTags: nextTags });
    queueRef.current = queueRef.current.then(async () => {
      const res = await updateBookmarkTags({
        id: bookmark.id,
        add,
        remove,
        color,
      });
      if (!res.success) {
        setOptimistic(null);
        toast.error(res.error);
        return;
      }
      onChanged();
    });
  };

  // Only the explicit "Open tweet" link counts as reading; the video cover
  // opens the same URL but should not flip the read state.
  const markReadOnOpen = () => {
    if (isRead) return;
    setMarkedRead(true);
    updateBookmarksRead([bookmark.id], true)
      .then((res) => {
        if (!res.success) {
          setMarkedRead(false);
          toast.error(res.error);
          return;
        }
        onChanged();
      })
      .catch(() => setMarkedRead(false));
  };

  const addTag = (tag: string, color?: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    applyTagChange(trimmed, undefined, color);
    setCustomTag("");
    setAddOpen(false);
  };

  // Lists membership is fetched lazily while the popover is open.
  const {
    data: listsData,
    mutate: mutateListsFor,
  } = useSWR(
    listOpen ? `bookmark-lists-for-${bookmark.id}` : null,
    () => getListsForBookmark(bookmark.id)
  );
  const listsForBookmark = listsData?.success ? (listsData.data ?? []) : [];

  const toggleList = (list: BookmarkListWithMembership, inList: boolean) => {
    // Optimistic flip; the server write reconciles afterwards.
    mutateListsFor(
      (prev) =>
        prev?.success
          ? {
              ...prev,
              data: (prev.data ?? []).map((l) =>
                l.id === list.id
                  ? { ...l, inList, count: Math.max(0, l.count + (inList ? 1 : -1)) }
                  : l
              ),
            }
          : prev,
      { revalidate: false }
    );
    setBookmarkInList(bookmark.id, list.id, inList).then((res) => {
      if (!res.success) {
        toast.error(res.error);
      }
      mutateListsFor();
      onChanged();
    });
  };

  const createAndAddToList = async () => {
    const name = newListName.trim();
    if (!name) return;
    const created = await createList(name);
    if (!created.success) {
      toast.error(created.error);
      return;
    }
    if (!created.data) return;
    await setBookmarkInList(bookmark.id, created.data.id, true);
    setNewListName("");
    mutateListsFor();
    onChanged();
  };

  return (
    <article
      className={cn(
        "group/card flex flex-col gap-3 rounded-none border border-border bg-card p-4 shadow-none",
        "transition-[border-color,background-color] duration-200 ease-out",
        "hover:border-foreground hover:bg-muted/40",
        selected && "border-foreground bg-muted/25"
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
        {!isRead && (
          <span className="rounded-none bg-foreground px-2 py-0.5 text-xs font-medium text-background">
            {t("card.unread")}
          </span>
        )}
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(bookmark.syncedAt), {
            addSuffix: true,
          })}
        </span>
      </div>

      {/* text — clamped so media below stays visible */}
      <CollapsibleBookmarkText text={bookmark.text} />

      {/* media */}
      {videoMedia && (
        <div className="relative aspect-video overflow-hidden rounded-none bg-secondary">
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
              className="h-full w-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover/card:scale-[1.04]"
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
            "grid gap-1 overflow-hidden rounded-none",
            photoMedia.length > 1 ? "grid-cols-2" : "grid-cols-1"
          )}
        >
          {photoMedia.map((m) => (
            <div key={m.url} className="overflow-hidden">
              <Image
                src={m.url}
                alt="bookmark media"
                width={600}
                height={314}
                className="aspect-[1.91/1] w-full rounded-none object-cover transition-transform duration-500 ease-out motion-safe:group-hover/card:scale-[1.04]"
              />
            </div>
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
              colorId={tagColors?.[tag] ?? null}
              onRemove={(label) => applyTagChange(undefined, label)}
            />
          ))
        )}
        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-none border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Tag className="h-3 w-3" />
              {t("card.addTag")}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 rounded-none p-2 shadow-none">
            <div className="flex flex-col gap-1">
              {BOOKMARK_CATEGORIES.filter((c) => !tags.includes(c)).map(
                (category) => (
                  <button
                    key={category}
                    type="button"
                    className="flex items-center gap-2 rounded-none px-2 py-1 text-left text-xs hover:bg-secondary"
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
                    if (e.key === "Enter") addTag(customTag, tagColor);
                  }}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TAG_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-label={c.id}
                    onClick={() => setTagColor(c.id)}
                    className={cn(
                      "h-5 w-5 rounded-none transition-transform hover:scale-110",
                      c.chip,
                      tagColor === c.id &&
                        "ring-2 ring-foreground ring-offset-1 ring-offset-popover"
                    )}
                  />
                ))}
              </div>
              <div className="mt-2 flex gap-1.5">
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={!customTag.trim()}
                  onClick={() => addTag(customTag, tagColor)}
                >
                  {t("card.create")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAddOpen(false)}
                >
                  {t("card.cancel")}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Popover open={listOpen} onOpenChange={setListOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-none border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ListPlus className="h-3 w-3" />
              {tLists("card.addToList")}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 rounded-none p-2 shadow-none">
            <div className="flex flex-col gap-1">
              {listsForBookmark.length === 0 && (
                <p className="px-1 pb-1 text-xs text-muted-foreground">
                  {tLists("card.empty")}
                </p>
              )}
              {listsForBookmark.map((list) => (
                <div
                  key={list.id}
                  role="button"
                  tabIndex={0}
                  className="flex cursor-pointer items-center gap-2 rounded-none px-2 py-1 text-left text-xs hover:bg-secondary"
                  onClick={() => toggleList(list, !list.inList)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleList(list, !list.inList);
                    }
                  }}
                >
                  <Checkbox
                    checked={list.inList}
                    onCheckedChange={() => toggleList(list, !list.inList)}
                    className="pointer-events-none"
                    aria-label={list.name}
                  />
                  <span className="truncate">{list.name}</span>
                  <span className="ml-auto text-muted-foreground">
                    {list.count}
                  </span>
                </div>
              ))}
              <div className="mt-1 border-t border-border pt-2">
                <Input
                  value={newListName}
                  placeholder={tLists("card.newListPlaceholder")}
                  className="h-7 text-xs"
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createAndAddToList();
                  }}
                />
                <Button
                  size="sm"
                  className="mt-1.5 w-full"
                  disabled={!newListName.trim()}
                  onClick={createAndAddToList}
                >
                  {tLists("card.create")}
                </Button>
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
          onClick={markReadOnOpen}
          className="ml-auto inline-flex items-center gap-1 font-medium text-foreground transition-opacity hover:opacity-70"
        >
          {t("card.openTweet")}
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 ease-out motion-safe:group-hover/card:translate-x-0.5 motion-safe:group-hover/card:-translate-y-0.5" />
        </a>
      </div>
    </article>
  );
}
