"use client";

import {
  getBookmarks,
  getBookmarkStats,
  getBookmarkTags,
  updateBookmarksRead,
  type BookmarkRow,
} from "@/actions/bookmarks/list";
import { disconnectX } from "@/actions/bookmarks/connection";
import {
  setListVisibility,
  type BookmarkListRow,
} from "@/actions/bookmarks/lists";
import { processPendingBookmarks } from "@/actions/bookmarks/process";
import { syncBookmarks } from "@/actions/bookmarks/sync";
import type { SyncStoppedReason } from "@/lib/bookmarks/sync-core";
import { BookmarkCard } from "@/components/bookmarks/BookmarkCard";
import { ConnectXCard } from "@/components/bookmarks/ConnectXCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BOOKMARK_CATEGORIES,
  CATEGORY_COLORS,
  tagColorChipClass,
  type BookmarkCategory,
} from "@/config/bookmark-categories";
import { cn } from "@/lib/utils";
import { publicListUrl } from "@/lib/url";
import {
  RefreshCw,
  Search,
  SquareCheckBig,
  BookmarkCheck,
  BookmarkX,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import useSWR from "swr";
import { useDebounce } from "use-debounce";

const PAGE_SIZE = 24;

// One syncBookmarks() call pulls <=500 bookmarks (serverless timeout cap); a
// multi-thousand first import loops the action here until X runs out of pages.
const MAX_SYNC_ROUNDS = 60;

export type BookmarksView = "all" | "unread" | "read";

type Banner = { kind: "info" | "warn" | "error"; text: string };

export function BookmarksBoard({
  view,
  oauthError,
  list,
}: {
  view: BookmarksView;
  oauthError?: string | null;
  list?: BookmarkListRow | null;
}) {
  const t = useTranslations("Bookmarks");
  const tLists = useTranslations("Lists");
  const { mutate: globalMutate } = useSWRConfig();
  const isListMode = !!list;
  const [listMeta, setListMeta] = useState<BookmarkListRow | null>(list ?? null);

  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [syncPhase, setSyncPhase] = useState<"idle" | "syncing" | "processing">("idle");
  const [syncAdded, setSyncAdded] = useState(0);
  const [syncRemaining, setSyncRemaining] = useState(0);
  const [banner, setBanner] = useState<Banner | null>(null);

  const statsKey = "bookmarks-stats";
  const { data: statsData } = useSWR(statsKey, getBookmarkStats);
  const stats = statsData?.success ? statsData.data : null;
  const connected = !!stats?.connected;

  // Custom tags (user-added + AI-assigned) shown after the preset categories.
  const tagsKey = "bookmarks-tags";
  const { data: tagsData } = useSWR(
    connected ? tagsKey : null,
    getBookmarkTags
  );
  const tagColorMap = useMemo(() => {
    const map: Record<string, string | null> = {};
    if (tagsData?.success) {
      for (const tag of tagsData.data?.tags ?? []) map[tag.name] = tag.color;
    }
    return map;
  }, [tagsData]);
  const customTags = useMemo(() => {
    const fetched = Object.keys(tagColorMap);
    // Keep a selected tag visible even if its usage just dropped to zero.
    const extra = categories.filter(
      (c) =>
        !(BOOKMARK_CATEGORIES as readonly string[]).includes(c) &&
        !fetched.includes(c)
    );
    return [...fetched, ...extra];
  }, [tagColorMap, categories]);
  const refreshTags = () => globalMutate(tagsKey);

  const filters = useMemo(
    () => ({
      view,
      pageIndex: page,
      pageSize: PAGE_SIZE,
      sort,
      search: debouncedSearch || undefined,
      categories,
      listId: list?.id,
    }),
    [view, page, sort, debouncedSearch, categories, list?.id]
  );
  const listKey = JSON.stringify(["bookmarks", filters]);
  const { data: listData, isValidating, mutate: mutateList } = useSWR(
    connected ? listKey : null,
    () => getBookmarks(filters),
    { keepPreviousData: true }
  );

  const [items, setItems] = useState<BookmarkRow[]>([]);
  useEffect(() => {
    if (!listData?.success) return;
    const rows = listData.data?.bookmarks ?? [];
    setItems((prev) =>
      filters.pageIndex === 0
        ? rows
        : [
            ...prev,
            ...rows.filter((r) => !prev.some((p) => p.id === r.id)),
          ]
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listData]);

  // Reset pagination when filters change.
  useEffect(() => {
    setPage(0);
  }, [view, sort, debouncedSearch, categories]);

  // OAuth callback feedback.
  useEffect(() => {
    if (oauthError) {
      toast.error(t("errors.syncFailed"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oauthError]);

  // Auto-dismiss informational banners.
  useEffect(() => {
    if (!banner || banner.kind === "error") return;
    const timer = setTimeout(() => setBanner(null), 6000);
    return () => clearTimeout(timer);
  }, [banner]);

  const totalCount = listData?.success ? (listData.data?.totalCount ?? 0) : 0;
  const refreshStats = () => globalMutate(statsKey);
  const refreshLists = () => globalMutate("bookmark-lists");

  const toggleListVisibility = async () => {
    if (!listMeta) return;
    const nextPublic = !listMeta.isPublic;
    const res = await setListVisibility(listMeta.id, nextPublic);
    if (!res.success) {
      toast.error(
        res.customCode === "not-connected" ? t("errors.notConnected") : res.error
      );
      return;
    }
    setListMeta(res.data ?? null);
    refreshLists();
    toast.success(
      nextPublic ? tLists("board.madePublic") : tLists("board.madePrivate")
    );
  };

  const copyPublicUrl = async () => {
    if (!listMeta?.isPublic) return;
    if (!stats?.username) {
      toast.error(t("errors.notConnected"));
      return;
    }
    await navigator.clipboard.writeText(
      publicListUrl(stats.username, listMeta.slug)
    );
    toast.success(tLists("board.copied"));
  };

  // Dead or undecryptable X tokens can only be fixed by re-authorizing:
  // surface the reason briefly, then jump straight into the OAuth connect
  // flow (same entry as the "Sync with X" button).
  const startReconnect = () => {
    toast.error(t("syncBanner.authError"));
    window.setTimeout(() => window.location.assign("/api/x/connect"), 800);
  };

  const runSync = async () => {
    if (syncPhase !== "idle") return;
    setBanner(null);
    setSyncPhase("syncing");
    setSyncAdded(0);

    // Pull phase: loop the capped server action so a single click ingests the
    // whole backlog; the list refreshes every round so cards stream in.
    let added = 0;
    let pendingCount = 0;
    let stoppedReason: SyncStoppedReason = "done";
    for (let round = 0; round < MAX_SYNC_ROUNDS; round++) {
      const res = await syncBookmarks();
      if (!res.success) {
        setSyncPhase("idle");
        if (res.customCode === "auth-error") {
          startReconnect();
          return;
        }
        setBanner({
          kind: "error",
          text:
            res.customCode === "refresh-failed"
              ? t("syncBanner.refreshFailed")
              : t("errors.syncFailed"),
        });
        return;
      }
      added += res.data?.added ?? 0;
      pendingCount = res.data?.pendingCount ?? 0;
      stoppedReason = res.data?.stoppedReason ?? "done";
      console.log(
        "[bookmarks] sync round:",
        JSON.stringify({ round: round + 1, added, pendingCount, stoppedReason })
      );
      setSyncAdded(added);
      mutateList();
      refreshStats();
      if (stoppedReason !== "max-pages") break;
    }

    let remaining = pendingCount;
    if (remaining > 0) {
      setSyncPhase("processing");
      setSyncRemaining(remaining);
      let guard = 0;
      while (remaining > 0 && guard < 200) {
        console.log(
          `[bookmarks] calling processPendingBookmarks (remaining=${remaining}, round=${guard + 1})`
        );
        const processed = await processPendingBookmarks();
        console.log(
          "[bookmarks] processPendingBookmarks returned:",
          JSON.stringify(
            processed.success
              ? { success: true, data: processed.data }
              : { success: false, error: processed.error }
          )
        );
        if (!processed.success) {
          setBanner({ kind: "error", text: processed.error });
          break;
        }
        const processedData = processed.data;
        if (!processedData || processedData.processed === 0) break;
        remaining = processedData.remaining;
        setSyncRemaining(remaining);
        mutateList();
        refreshStats();
        guard += 1;
      }
    }

    setSyncPhase("idle");
    mutateList();
    refreshStats();
    refreshTags();
    if (stoppedReason === "rate-limit") {
      setBanner({ kind: "warn", text: t("syncBanner.rateLimit") });
    } else if (stoppedReason === "usage-capped") {
      setBanner({ kind: "error", text: t("syncBanner.usageCapped") });
    } else if (stoppedReason === "auth-error") {
      startReconnect();
    } else {
      setBanner({
        kind: "info",
        text: t("syncBanner.done", { added }),
      });
    }
  };

  const toggleSelected = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const bulkRead = async (isRead: boolean) => {
    if (selected.length === 0) return;
    const res = await updateBookmarksRead(selected, isRead);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    setSelected([]);
    setSelectionMode(false);
    mutateList();
    refreshStats();
  };

  const handleDisconnect = async () => {
    const res = await disconnectX();
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    setItems([]);
    mutateList();
    refreshStats();
  };

  const initialLoading = connected && !listData && isValidating;

  return (
    <div className="space-y-4">
      {/* title */}
      <div className="flex items-baseline gap-2">
        <h1 className="text-2xl font-semibold">
          {isListMode
            ? listMeta?.name
            : view === "all"
              ? t("titles.all")
              : view === "unread"
                ? t("titles.unread")
                : t("titles.read")}
        </h1>
        {(connected || isListMode) && (
          <span className="text-sm text-muted-foreground">{totalCount}</span>
        )}
        {isListMode && listMeta && (
          <span className="text-sm text-muted-foreground">
            ·{" "}
            {listMeta.isPublic ? tLists("board.public") : tLists("board.private")}
          </span>
        )}
        {connected && !isListMode && stats?.username && (
          <span className="ml-auto text-xs text-muted-foreground">
            {t("connectedAs", { username: stats.username })}
            <button
              type="button"
              className="ml-2 underline underline-offset-2 transition-opacity hover:opacity-70"
              onClick={handleDisconnect}
            >
              {t("errors.disconnect")}
            </button>
          </span>
        )}
      </div>

      {!connected && !isListMode ? (
        <ConnectXCard />
      ) : (
        <>
          {/* toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={sort}
              onValueChange={(value) => setSort(value as "newest" | "oldest")}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t("toolbar.newestFirst")}</SelectItem>
                <SelectItem value="oldest">{t("toolbar.oldestFirst")}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={selectionMode ? "secondary" : "outline"}
              size="icon"
              aria-label={t("toolbar.select")}
              onClick={() => {
                setSelectionMode((v) => !v);
                setSelected([]);
              }}
            >
              <SquareCheckBig className="h-4 w-4" />
            </Button>

            <div className="ml-auto flex items-center gap-2">
              {isListMode && listMeta?.isPublic && (
                <Button variant="outline" onClick={copyPublicUrl}>
                  <Copy className="h-4 w-4" />
                  {tLists("board.copyPublicUrl")}
                </Button>
              )}
              {isListMode && listMeta && (
                <Button variant="outline" onClick={toggleListVisibility}>
                  {listMeta.isPublic ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {listMeta.isPublic
                    ? tLists("board.makePrivate")
                    : tLists("board.makePublic")}
                </Button>
              )}
              {!isListMode && (
                <Button
                  variant="outline"
                  onClick={runSync}
                  disabled={syncPhase !== "idle"}
                >
                  <RefreshCw
                    className={cn(
                      "h-4 w-4",
                      syncPhase !== "idle" && "animate-spin"
                    )}
                  />
                  {syncPhase === "syncing" ? t("toolbar.syncing") : t("toolbar.sync")}
                </Button>
              )}
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("toolbar.searchPlaceholder")}
                  className="w-56 pl-8"
                />
              </div>
            </div>
          </div>

          {/* category filter */}
          <div className="flex flex-wrap items-center gap-2">
            {BOOKMARK_CATEGORIES.map((category) => {
              const active = categories.includes(category);
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    setCategories((prev) =>
                      active
                        ? prev.filter((c) => c !== category)
                        : [...prev, category]
                    )
                  }
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                    active
                      ? "border-foreground bg-secondary text-foreground"
                      : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      CATEGORY_COLORS[category as BookmarkCategory].dot
                    )}
                  />
                  {category}
                </button>
              );
            })}
            {customTags.map((tag) => {
              const active = categories.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setCategories((prev) =>
                      active
                        ? prev.filter((c) => c !== tag)
                        : [...prev, tag]
                    )
                  }
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                    active
                      ? "border-foreground bg-secondary text-foreground"
                      : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      tagColorChipClass(tagColorMap[tag]) ??
                        "bg-muted-foreground/60"
                    )}
                  />
                  {tag}
                </button>
              );
            })}
          </div>

          {/* sync / bulk banner */}
          {syncPhase === "syncing" && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm">
              <RefreshCw className="h-4 w-4 animate-spin" />
              {t("syncBanner.syncing", { added: syncAdded })}
            </div>
          )}
          {syncPhase === "processing" && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm">
              <RefreshCw className="h-4 w-4 animate-spin" />
              {t("syncBanner.processing", { remaining: syncRemaining })}
            </div>
          )}
          {syncPhase === "idle" && banner && (
            <div
              className={cn(
                "rounded-md border px-3 py-2 text-sm",
                banner.kind === "error"
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : banner.kind === "warn"
                    ? "border-border bg-secondary text-foreground"
                    : "border-border bg-secondary text-foreground"
              )}
            >
              {banner.text}
            </div>
          )}
          {selectionMode && selected.length > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm">
              <span>{t("bulk.selected", { count: selected.length })}</span>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto"
                onClick={() => bulkRead(true)}
              >
                <BookmarkCheck className="h-4 w-4" />
                {t("bulk.markRead")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => bulkRead(false)}
              >
                <BookmarkX className="h-4 w-4" />
                {t("bulk.markUnread")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
                {t("bulk.clear")}
              </Button>
            </div>
          )}

          {/* content */}
          {initialLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-border bg-background px-6 py-16 text-center">
              <h2 className="text-lg font-semibold">
                {debouncedSearch || categories.length > 0
                  ? t("empty.noResults")
                  : t("empty.title")}
              </h2>
              {!debouncedSearch && categories.length === 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("empty.description")}
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    selectionMode={selectionMode}
                    selected={selected.includes(bookmark.id)}
                    onToggleSelected={toggleSelected}
                    tagColors={tagColorMap}
                    onChanged={() => {
                      mutateList();
                      refreshStats();
                      refreshTags();
                      refreshLists();
                    }}
                  />
                ))}
              </div>
              {items.length < totalCount && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={isValidating}
                  >
                    {isValidating ? "…" : t("toolbar.loadMore")}
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
