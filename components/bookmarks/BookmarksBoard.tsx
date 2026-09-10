"use client";

import {
  getBookmarks,
  getBookmarkStats,
  getBookmarkTags,
  moveBookmarksToTrash,
  permanentlyDeleteBookmarks,
  restoreBookmarksFromTrash,
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
import { startNotionSync } from "@/actions/notion/connection";
import type { SyncStoppedReason } from "@/lib/bookmarks/sync-core";
import { BookmarkCard } from "@/components/bookmarks/BookmarkCard";
import { ConnectXCard } from "@/components/bookmarks/ConnectXCard";
import { NotionIcon } from "@/components/icons";
import { HistoryImportCard } from "@/components/bookmarks/HistoryImportCard";
import { useImportProgress } from "@/components/bookmarks/ImportProgressProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Download,
  Eye,
  EyeOff,
  ListPlus,
  Loader2,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { DashboardHeaderPortals } from "@/components/header/DashboardHeaderPortals";
import { SubscribePromptDialog } from "@/components/payments/SubscribePromptDialog";
import { useProductAccess } from "@/components/payments/ProductAccessProvider";
import { useLocale, useTranslations } from "next-intl";
import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import useSWR from "swr";
import { useDebounce } from "use-debounce";

const PAGE_SIZE = 24;
const SYNC_COOLDOWN_MS = 30 * 60 * 1000;

export type BookmarksView = "all" | "unread" | "read" | "trash";

type Banner = { kind: "info" | "warn" | "error"; text: string };

function oauthErrorMessage(
  code: string | null | undefined,
  t: (key: string) => string,
): string | null {
  if (!code) return null;
  if (code === "account_already_linked_to_different_user") {
    return t("errors.xAlreadyLinked");
  }
  if (code === "email_doesn't_match") {
    return t("errors.xEmailMismatch");
  }
  if (code === "unable_to_link_account") {
    return t("errors.xUnableToLink");
  }
  return t("errors.linkFailed");
}

function BookmarkMasonry({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);

  return (
    <div className="columns-1 gap-x-4 md:columns-2 xl:columns-3">
      {items.map((child) => {
        const key = isValidElement(child) ? child.key : null;
        return (
          <div
            key={key ?? undefined}
            className="mb-4 w-full break-inside-avoid"
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}

function BookmarkMasonryItem({ children }: { children: ReactNode }) {
  return <div className="w-full">{children}</div>;
}

export function BookmarksBoard({
  view,
  oauthError,
  linkedXUsername,
  list,
}: {
  view: BookmarksView;
  oauthError?: string | null;
  linkedXUsername?: string | null;
  list?: BookmarkListRow | null;
}) {
  const t = useTranslations("Bookmarks");
  const tLists = useTranslations("Lists");
  const locale = useLocale();
  const { hasServiceAccess, hasPaidSubscription } = useProductAccess();
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [subscribeVariant, setSubscribeVariant] = useState<
    "expired" | "trialManual" | "notionExport"
  >("expired");
  const linkError = oauthErrorMessage(oauthError, t);
  const { mutate: globalMutate } = useSWRConfig();
  const isListMode = !!list;
  const isTrashView = view === "trash" && !isListMode;
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
  const [notionExporting, setNotionExporting] = useState(false);

  const statsKey = "bookmarks-stats";
  const { data: statsData } = useSWR(statsKey, getBookmarkStats);
  const stats = statsData?.success ? statsData.data : null;
  const connected = !!stats?.connected;

  useEffect(() => {
    if (!stats?.initialApiSyncCompleted || stats.historyImportCompleted) return;
    if (typeof window === "undefined") return;
    const key = "wakemark.cold-start-toast";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    toast.message(t("coldStart.title"), {
      description: t("coldStart.description"),
    });
  }, [stats?.initialApiSyncCompleted, stats?.historyImportCompleted, t]);

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
    if (linkError) {
      toast.error(linkError);
    }
  }, [linkError]);

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
    if (!hasPaidSubscription) {
      setSubscribeVariant(hasServiceAccess ? "trialManual" : "expired");
      setSubscribeOpen(true);
      return;
    }
    if (syncPhase !== "idle" || isSyncCoolingDown) return;
    setBanner(null);
    setSyncPhase("syncing");
    setSyncAdded(0);

    const res = await syncBookmarks();
    if (!res.success) {
      setSyncPhase("idle");
      if (res.customCode === "auth-error") {
        startReconnect();
        return;
      }
      if (res.customCode === "sync-busy") {
        setBanner({ kind: "warn", text: t("syncBanner.syncBusy") });
        return;
      }
      if (res.customCode === "not-subscribed") {
        setSubscribeOpen(true);
        return;
      }
      setBanner({
        kind: "error",
        text:
          res.customCode === "refresh-failed"
            ? t("syncBanner.refreshFailed")
            : res.customCode === "rate-limit"
              ? t("syncBanner.rateLimit")
              : t("errors.syncFailed"),
      });
      return;
    }

    const added = res.data?.added ?? 0;
    const pendingCount = res.data?.pendingCount ?? 0;
    const stoppedReason: SyncStoppedReason = res.data?.stoppedReason ?? "done";
    if (stoppedReason !== "auth-error") {
      setCooldownUntil(Date.now() + SYNC_COOLDOWN_MS);
    }
    setSyncAdded(added);
    mutateList();
    refreshStats();

    if (stoppedReason === "rate-limit") {
      setBanner({ kind: "warn", text: t("syncBanner.rateLimit") });
    } else if (stoppedReason === "usage-capped") {
      setBanner({ kind: "warn", text: t("syncBanner.usageCapped") });
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

  const clearSelection = () => {
    setSelected([]);
    setSelectionMode(false);
  };

  const downloadExport = (format: "md-zip" | "json" | "csv", ids?: string[]) => {
    const params = new URLSearchParams({ format });
    if (ids?.length) params.set("ids", ids.join(","));
    window.location.href = `/api/export/bookmarks?${params.toString()}`;
  };

  const exportSelected = (format: "md-zip" | "json" | "csv") => {
    if (selected.length === 0) return;
    downloadExport(format, selected);
  };

  const exportToNotion = async (bookmarkIds?: string[]) => {
    if (notionExporting) {
      toast.info(t("export.notionAlreadyRunning"));
      return;
    }
    if (!hasPaidSubscription) {
      setSubscribeVariant("notionExport");
      setSubscribeOpen(true);
      return;
    }
    setNotionExporting(true);
    const toastId = toast.loading(t("export.notionQueuing"));
    try {
      const res = await startNotionSync(bookmarkIds);
      if (!res.success) {
        toast.dismiss(toastId);
        if (res.customCode === "not-configured") {
          toast.error(t("export.notionNotConfigured"), {
            action: {
              label: t("export.openSettings"),
              onClick: () => {
                window.location.href = "/dashboard/settings";
              },
            },
          });
          return;
        }
        if (res.customCode === "not-subscribed") {
          setSubscribeVariant("notionExport");
          setSubscribeOpen(true);
          return;
        }
        toast.error(res.error);
        return;
      }
      const alreadyRunning = res.customCode === "already-running";
      const message = alreadyRunning
        ? t("export.notionAlreadyRunning")
        : bookmarkIds?.length
          ? t("export.notionQueuedSelected", { count: bookmarkIds.length })
          : t("export.notionQueuedAll");
      toast.success(message, { id: toastId, duration: 6000 });
      setBanner({ kind: "info", text: message });
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(error instanceof Error ? error.message : t("export.notionFailed"));
    } finally {
      setNotionExporting(false);
    }
  };

  const bulkTrash = async () => {
    if (selected.length === 0) return;
    const res = await moveBookmarksToTrash(selected);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success(
      t("bulk.movedToTrash", { count: res.data?.moved ?? selected.length }),
    );
    clearSelection();
    mutateList();
    refreshStats();
    refreshLists();
  };

  const bulkRestore = async () => {
    if (selected.length === 0) return;
    const res = await restoreBookmarksFromTrash(selected);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success(
      t("bulk.restored", { count: res.data?.restored ?? selected.length }),
    );
    clearSelection();
    mutateList();
    refreshStats();
    refreshLists();
  };

  const confirmPermanentDelete = async () => {
    if (selected.length === 0) return;
    setIsDeleting(true);
    try {
      const res = await permanentlyDeleteBookmarks(selected);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(
        t("bulk.deletedPermanently", {
          count: res.data?.deleted ?? selected.length,
        }),
      );
      setDeleteConfirmOpen(false);
      clearSelection();
      mutateList();
      refreshStats();
      refreshLists();
    } finally {
      setIsDeleting(false);
    }
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
        : view === "read"
          ? t("titles.read")
          : t("titles.trash");

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
              {stats.historyImportCompleted
                ? ` · ${t("historyCard.statusComplete")}`
                : ` · ${t("historyCard.statusPartial")}`}
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
        <ConnectXCard
          errorMessage={linkError}
          oauthError={oauthError}
          linkedXUsername={linkedXUsername}
        />
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
              {!isTrashView && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-none shadow-none"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {t("toolbar.export")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-none">
                    <DropdownMenuItem onClick={() => downloadExport("md-zip")}>
                      {t("export.markdownZip")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadExport("json")}>
                      {t("export.json")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadExport("csv")}>
                      {t("export.csv")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {!isTrashView && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-none font-medium shadow-none"
                  onClick={() => exportToNotion()}
                  disabled={notionExporting}
                >
                  {notionExporting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <NotionIcon className="h-3.5 w-3.5 text-foreground" />
                  )}
                  {notionExporting
                    ? t("toolbar.exportingToNotion")
                    : t("toolbar.exportToNotion")}
                </Button>
              )}
              {!isListMode && !isTrashView && (
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
              {isTrashView ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto"
                    onClick={bulkRestore}
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t("bulk.restore")}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteConfirmOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("bulk.deletePermanently")}
                  </Button>
                </>
              ) : (
                <>
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                        {t("bulk.export")}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-none">
                      <DropdownMenuItem onClick={() => exportSelected("md-zip")}>
                        {t("export.markdownZip")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportSelected("json")}>
                        {t("export.json")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportSelected("csv")}>
                        {t("export.csv")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportToNotion(selected)}
                    disabled={notionExporting}
                  >
                    {notionExporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <NotionIcon className="h-4 w-4 text-foreground" />
                    )}
                    {notionExporting
                      ? t("toolbar.exportingToNotion")
                      : t("bulk.exportToNotion")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={bulkTrash}>
                    <Trash2 className="h-4 w-4" />
                    {t("bulk.moveToTrash")}
                  </Button>
                </>
              )}
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
              <div className="rounded-none border border-border bg-card px-6 py-16 text-center">
                <h2 className="text-lg font-semibold">
                  {isTrashView ? t("empty.trashTitle") : t("empty.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isTrashView
                    ? t("empty.trashDescription")
                    : stats && !stats.initialApiSyncCompleted
                      ? t("empty.apiBusy")
                      : t("empty.description")}
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
          {!isListMode && !isTrashView ? (
            <div className="mt-6">
              <HistoryImportCard />
            </div>
          ) : null}
        </>
      )}
      <SubscribePromptDialog
        open={subscribeOpen}
        onOpenChange={setSubscribeOpen}
        variant={subscribeVariant}
      />
      <AlertDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteConfirmOpen(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("bulk.deletePermanentlyConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("bulk.deletePermanentlyConfirmDescription", {
                count: selected.length,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t("card.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={confirmPermanentDelete}
            >
              {t("bulk.deletePermanently")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
