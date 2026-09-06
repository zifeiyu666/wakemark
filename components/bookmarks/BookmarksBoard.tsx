"use client";

import {
  getBookmarks,
  getBookmarkStats,
  getBookmarkTags,
  updateBookmarksRead,
} from "@/actions/bookmarks/list";
import type { BookmarkRow } from "@/lib/bookmarks/query";
import { disconnectX } from "@/actions/bookmarks/connection";
import {
  addBookmarksToList,
  createList,
  getLists,
  setListVisibility,
  type BookmarkListRow,
} from "@/actions/bookmarks/lists";
import { processPendingBookmarks } from "@/actions/bookmarks/process";
import { syncBookmarks } from "@/actions/bookmarks/sync";
import type { SyncStoppedReason } from "@/lib/bookmarks/sync-core";
import { BookmarkCard } from "@/components/bookmarks/BookmarkCard";
import { ConnectXCard } from "@/components/bookmarks/ConnectXCard";
import { useImportProgress } from "@/components/bookmarks/ImportProgressProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { authClient } from "@/lib/auth/auth-client";
import {
  RefreshCw,
  Search,
  SquareCheckBig,
  BookmarkCheck,
  BookmarkX,
  Copy,
  Eye,
  EyeOff,
  ListPlus,
} from "lucide-react";
import { DashboardHeaderPortals } from "@/components/header/DashboardHeaderPortals";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import useSWR from "swr";
import { useDebounce } from "use-debounce";

const PAGE_SIZE = 24;
const SYNC_COOLDOWN_MS = 30 * 60 * 1000;

// One syncBookmarks() call pulls <=500 bookmarks (serverless timeout cap); a
// multi-thousand first import loops the action here until X runs out of pages.
const MAX_SYNC_ROUNDS = 60;

export type BookmarksView = "all" | "unread" | "read";

type Banner = { kind: "info" | "warn" | "error"; text: string };

function BookmarkMasonry({ children }: { children: ReactNode }) {
  return (
    <div className="columns-1 gap-x-4 md:columns-2 xl:columns-3">
      {children}
    </div>
  );
}

function BookmarkMasonryItem({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 inline-block w-full break-inside-avoid">{children}</div>
  );
}

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
  const locale = useLocale();
  const { mutate: globalMutate } = useSWRConfig();
  const isListMode = !!list;
  const [listMeta, setListMeta] = useState<BookmarkListRow | null>(
    list ?? null,
  );

  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const normalizedSearch = debouncedSearch.trim();
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkListOpen, setBulkListOpen] = useState(false);
  const [bulkNewListName, setBulkNewListName] = useState("");
  const [syncPhase, setSyncPhase] = useState<"idle" | "syncing" | "processing">(
    "idle",
  );
  // Tells the ImportProgressBanner to stand down while the manual Sync loop
  // owns the connection (shared via the dashboard's ImportProgressProvider).
  const { setManualSyncActive } = useImportProgress();
  useEffect(() => {
    setManualSyncActive(syncPhase !== "idle");
    return () => setManualSyncActive(false);
  }, [syncPhase, setManualSyncActive]);
  const [syncAdded, setSyncAdded] = useState(0);
  const [syncRemaining, setSyncRemaining] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [banner, setBanner] = useState<Banner | null>(null);

  const statsKey = "bookmarks-stats";
  const { data: statsData } = useSWR(statsKey, getBookmarkStats);
  const stats = statsData?.success ? statsData.data : null;
  const connected = !!stats?.connected;

  // Custom tags (user-added + AI-assigned) shown after the preset categories.
  const tagsKey = "bookmarks-tags";
  const { data: tagsData } = useSWR(
    connected ? tagsKey : null,
    getBookmarkTags,
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
        !fetched.includes(c),
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
      search: normalizedSearch || undefined,
      categories,
      listId: list?.id,
    }),
    [view, page, sort, normalizedSearch, categories, list?.id],
  );
  const listKey = JSON.stringify(["bookmarks", filters]);
  const {
    data: listData,
    isValidating,
    mutate: mutateList,
  } = useSWR(connected ? listKey : null, () => getBookmarks(filters), {
    keepPreviousData: true,
  });

  const [items, setItems] = useState<BookmarkRow[]>([]);
  useEffect(() => {
    if (!listData?.success) return;
    const rows = listData.data?.bookmarks ?? [];
    setItems((prev) =>
      filters.pageIndex === 0
        ? rows
        : [...prev, ...rows.filter((r) => !prev.some((p) => p.id === r.id))],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listData]);

  // Reset pagination when filters change.
  useEffect(() => {
    setPage(0);
  }, [view, sort, normalizedSearch, categories]);

  useEffect(() => {
    if (!cooldownUntil) return;

    const updateClock = () => {
      const nextNow = Date.now();
      setNow(nextNow);
      if (nextNow >= cooldownUntil) setCooldownUntil(null);
    };
    updateClock();
    const interval = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(interval);
  }, [cooldownUntil]);

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

  const { data: listsData } = useSWR("bookmark-lists", getLists);
  const lists = listsData?.success ? (listsData.data ?? []) : [];

  const totalCount = listData?.success ? (listData.data?.totalCount ?? 0) : 0;
  const refreshStats = () => globalMutate(statsKey);
  const refreshLists = () => globalMutate("bookmark-lists");
  const cooldownRemainingMs = Math.max((cooldownUntil ?? 0) - now, 0);
  const isSyncCoolingDown = cooldownRemainingMs > 0;
  const cooldownSeconds = Math.ceil(cooldownRemainingMs / 1000);
  const cooldownLabel = `${Math.floor(cooldownSeconds / 60)
    .toString()
    .padStart(2, "0")}:${(cooldownSeconds % 60).toString().padStart(2, "0")}`;

  const toggleListVisibility = async () => {
    if (!listMeta) return;
    const nextPublic = !listMeta.isPublic;
    const res = await setListVisibility(listMeta.id, nextPublic);
    if (!res.success) {
      toast.error(
        res.customCode === "not-connected"
          ? t("errors.notConnected")
          : res.error,
      );
      return;
    }
    setListMeta(res.data ?? null);
    refreshLists();
    toast.success(
      nextPublic ? tLists("board.madePublic") : tLists("board.madePrivate"),
    );
  };

  const copyPublicUrl = async () => {
    if (!listMeta?.isPublic) return;
    if (!stats?.username) {
      toast.error(t("errors.notConnected"));
      return;
    }
    await navigator.clipboard.writeText(
      publicListUrl(stats.username, listMeta.slug),
    );
    toast.success(tLists("board.copied"));
  };

  // Dead or undecryptable X tokens can only be fixed by re-authorizing:
  // surface the reason briefly, then jump straight into the OAuth connect
  // flow (same entry as the "Sync with X" button).
  const startReconnect = () => {
    toast.error(t("syncBanner.authError"));
    const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
    window.setTimeout(() => {
      authClient.linkSocial({
        provider: "twitter",
        callbackURL: `${prefix}/dashboard/bookmarks`,
        errorCallbackURL: `${prefix}/dashboard/bookmarks?error=link-failed`,
      });
    }, 800);
  };

  const runSync = async () => {
    if (syncPhase !== "idle" || isSyncCoolingDown) return;
    setBanner(null);
    setSyncPhase("syncing");
    setSyncAdded(0);

    // Pull phase: loop the capped server action so a single click ingests the
    // whole backlog; the list refreshes every round so cards stream in.
    let added = 0;
    let pendingCount = 0;
    let stoppedReason: SyncStoppedReason = "done";
    let cooldownStarted = false;
    for (let round = 0; round < MAX_SYNC_ROUNDS; round++) {
      const res = await syncBookmarks();
      if (!res.success) {
        setSyncPhase("idle");
        if (res.customCode === "auth-error") {
          startReconnect();
          return;
        }
        if (res.customCode === "sync-busy") {
          // Another tab or the cron tick holds the sync lock: not a failure.
          setBanner({ kind: "warn", text: t("syncBanner.syncBusy") });
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
      const responseStoppedReason = res.data?.stoppedReason ?? "done";
      if (!cooldownStarted && responseStoppedReason !== "auth-error") {
        setCooldownUntil(Date.now() + SYNC_COOLDOWN_MS);
        cooldownStarted = true;
      }
      added += res.data?.added ?? 0;
      pendingCount = res.data?.pendingCount ?? 0;
      stoppedReason = responseStoppedReason;
      console.log(
        "[bookmarks] sync round:",
        JSON.stringify({
          round: round + 1,
          added,
          pendingCount,
          stoppedReason,
        }),
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
          `[bookmarks] calling processPendingBookmarks (remaining=${remaining}, round=${guard + 1})`,
        );
        const processed = await processPendingBookmarks();
        console.log(
          "[bookmarks] processPendingBookmarks returned:",
          JSON.stringify(
            processed.success
              ? { success: true, data: processed.data }
              : { success: false, error: processed.error },
          ),
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
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
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

  const bulkAddToList = async (listId: string, name: string) => {
    if (selected.length === 0) return;
    const res = await addBookmarksToList(selected, listId);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    const added = res.data?.added ?? 0;
    toast.success(
      added > 0
        ? t("bulk.addedToList", { count: added, name })
        : t("bulk.alreadyInList", { name })
    );
    setBulkListOpen(false);
    setBulkNewListName("");
    refreshLists();
  };

  const bulkCreateAndAddToList = async () => {
    const name = bulkNewListName.trim();
    if (!name || selected.length === 0) return;
    const created = await createList(name);
    if (!created.success) {
      toast.error(created.error);
      return;
    }
    if (!created.data) return;
    await bulkAddToList(created.data.id, created.data.name);
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

  const heading = isListMode
    ? listMeta?.name
    : view === "all"
      ? t("titles.all")
      : view === "unread"
        ? t("titles.unread")
        : t("titles.read");

  return (
    <div className="space-y-4">
      <DashboardHeaderPortals
        start={
          <div
            data-onboarding-target="sync"
            className="flex min-w-0 items-center gap-2"
          >
            <h1 className="truncate text-lg font-semibold">{heading}</h1>
            {(connected || isListMode) && (
              <span className="text-sm text-muted-foreground">{totalCount}</span>
            )}
            {isListMode && listMeta && (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                ·{" "}
                {listMeta.isPublic
                  ? tLists("board.public")
                  : tLists("board.private")}
              </span>
            )}
          </div>
        }
        end={
          connected && !isListMode && stats?.username ? (
            <span className="mr-2 whitespace-nowrap text-xs text-muted-foreground">
              {t("connectedAs", { username: stats.username })}
              <button
                type="button"
                className="ml-2 underline underline-offset-2 transition-opacity hover:opacity-70"
                onClick={handleDisconnect}
              >
                {t("errors.disconnect")}
              </button>
            </span>
          ) : null
        }
      />

      {!connected && !isListMode ? (
        <ConnectXCard />
      ) : (
        <>
          {/* toolbar */}
          <div
            data-onboarding-target="find"
            className="flex flex-wrap items-center gap-2"
          >
            <Select
              value={sort}
              onValueChange={(value) => setSort(value as "newest" | "oldest")}
            >
              <SelectTrigger size="sm" className="h-8 w-[140px] rounded-none shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none shadow-none">
                <SelectItem value="newest">
                  {t("toolbar.newestFirst")}
                </SelectItem>
                <SelectItem value="oldest">
                  {t("toolbar.oldestFirst")}
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={selectionMode ? "secondary" : "outline"}
              size="icon-sm"
              className="rounded-none shadow-none"
              aria-label={t("toolbar.select")}
              onClick={() => {
                setSelectionMode((v) => !v);
                setSelected([]);
              }}
            >
              <SquareCheckBig className="h-3.5 w-3.5" />
            </Button>

            <div className="ml-auto flex items-center gap-2">
              {isListMode && listMeta?.isPublic && (
                <Button variant="outline" size="sm" className="rounded-none shadow-none" onClick={copyPublicUrl}>
                  <Copy className="h-3.5 w-3.5" />
                  {tLists("board.copyPublicUrl")}
                </Button>
              )}
              {isListMode && listMeta && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none shadow-none"
                  onClick={toggleListVisibility}
                >
                  {listMeta.isPublic ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                  {listMeta.isPublic
                    ? tLists("board.makePrivate")
                    : tLists("board.makePublic")}
                </Button>
              )}
              {!isListMode && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none font-normal shadow-none"
                  onClick={runSync}
                  disabled={syncPhase !== "idle" || isSyncCoolingDown}
                >
                  <RefreshCw
                    className={cn(
                      "h-3.5 w-3.5",
                      syncPhase !== "idle" && "animate-spin",
                    )}
                  />
                  {syncPhase === "syncing"
                    ? t("toolbar.syncing")
                    : isSyncCoolingDown
                      ? t("toolbar.syncCooldown", { remaining: cooldownLabel })
                      : t("toolbar.sync")}
                </Button>
              )}
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("toolbar.searchPlaceholder")}
                  className="h-8 w-56 rounded-none pl-8 text-sm shadow-none focus-visible:ring-0"
                />
              </div>
            </div>
          </div>

          {/* category filter */}
          <div
            data-onboarding-target="find"
            className="flex flex-wrap items-center gap-2"
          >
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
                        : [...prev, category],
                    )
                  }
                  className={cn(
                    "inline-flex items-center rounded-none px-2 py-0.5 text-xs font-medium text-white transition-opacity",
                    CATEGORY_COLORS[category as BookmarkCategory].chip,
                    active
                      ? "ring-2 ring-foreground ring-offset-1 ring-offset-background"
                      : "opacity-80 hover:opacity-100",
                  )}
                >
                  {category}
                </button>
              );
            })}
            {customTags.map((tag) => {
              const active = categories.includes(tag);
              const colorClass = tagColorChipClass(tagColorMap[tag]);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setCategories((prev) =>
                      active ? prev.filter((c) => c !== tag) : [...prev, tag],
                    )
                  }
                  className={cn(
                    "inline-flex items-center rounded-none px-2 py-0.5 text-xs font-medium transition-opacity",
                    colorClass
                      ? cn(colorClass, "text-white")
                      : "bg-secondary text-secondary-foreground",
                    active
                      ? "ring-2 ring-foreground ring-offset-1 ring-offset-background"
                      : "opacity-80 hover:opacity-100",
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {/* sync / bulk banner */}
          {syncPhase === "syncing" && (
            <div className="flex items-center gap-2 rounded-none border border-border bg-secondary px-3 py-2 text-sm">
              <RefreshCw className="h-4 w-4 animate-spin" />
              {t("syncBanner.syncing", { added: syncAdded })}
            </div>
          )}
          {syncPhase === "processing" && (
            <div className="flex items-center gap-2 rounded-none border border-border bg-secondary px-3 py-2 text-sm">
              <RefreshCw className="h-4 w-4 animate-spin" />
              {t("syncBanner.processing", { remaining: syncRemaining })}
            </div>
          )}
          {syncPhase === "idle" && banner && (
            <div
              className={cn(
                "rounded-none border px-3 py-2 text-sm",
                banner.kind === "error"
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : banner.kind === "warn"
                    ? "border-border bg-secondary text-foreground"
                    : "border-border bg-secondary text-foreground",
              )}
            >
              {banner.text}
            </div>
          )}
          {selectionMode && selected.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-none border border-border bg-secondary px-3 py-2 text-sm">
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
              <Popover open={bulkListOpen} onOpenChange={setBulkListOpen}>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline">
                    <ListPlus className="h-4 w-4" />
                    {t("bulk.addToList")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-56 rounded-none p-2 shadow-none"
                >
                  <div className="flex flex-col gap-1">
                    {lists.length === 0 && (
                      <p className="px-1 pb-1 text-xs text-muted-foreground">
                        {tLists("card.empty")}
                      </p>
                    )}
                    {lists.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="flex items-center gap-2 rounded-none px-2 py-1 text-left text-xs hover:bg-secondary"
                        onClick={() => bulkAddToList(item.id, item.name)}
                      >
                        <span className="truncate">{item.name}</span>
                        <span className="ml-auto text-muted-foreground">
                          {item.count}
                        </span>
                      </button>
                    ))}
                    <div className="mt-1 border-t border-border pt-2">
                      <Input
                        value={bulkNewListName}
                        placeholder={tLists("card.newListPlaceholder")}
                        className="h-7 text-xs"
                        onChange={(e) => setBulkNewListName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") bulkCreateAndAddToList();
                        }}
                      />
                      <Button
                        size="sm"
                        className="mt-1.5 w-full"
                        disabled={!bulkNewListName.trim()}
                        onClick={bulkCreateAndAddToList}
                      >
                        {tLists("card.create")}
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
                {t("bulk.clear")}
              </Button>
            </div>
          )}

          {/* content */}
          {initialLoading ? (
            <BookmarkMasonry>
              {Array.from({ length: 6 }).map((_, i) => (
                <BookmarkMasonryItem key={i}>
                  <Skeleton className="h-64 w-full" />
                </BookmarkMasonryItem>
              ))}
            </BookmarkMasonry>
          ) : items.length === 0 ? (
            normalizedSearch || categories.length > 0 ? (
              <div className="mx-auto flex min-h-80 max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
                <div className="flex h-24 w-24 items-center justify-center border border-border bg-secondary/30">
                  <Search className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="mt-8 font-serif text-3xl font-semibold text-foreground">
                  {t("empty.noResults")}
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  {t("empty.noResultsDescription")}
                </p>
              </div>
            ) : (
              <div className="rounded-none border border-border bg-background px-6 py-16 text-center">
                <h2 className="text-lg font-semibold">{t("empty.title")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("empty.description")}
                </p>
              </div>
            )
          ) : (
            <>
              <BookmarkMasonry>
                {items.map((bookmark) => (
                  <BookmarkMasonryItem key={bookmark.id}>
                    <BookmarkCard
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
                  </BookmarkMasonryItem>
                ))}
              </BookmarkMasonry>
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
