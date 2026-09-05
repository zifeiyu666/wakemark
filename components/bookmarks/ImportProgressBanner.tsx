"use client";

import { advanceImport } from "@/actions/bookmarks/sync";
import { processPendingBookmarks } from "@/actions/bookmarks/process";
import { getBookmarkStats } from "@/actions/bookmarks/list";
import { Loader2, Sparkles } from "lucide-react";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { authClient } from "@/lib/auth/auth-client";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useSWRConfig } from "swr";
import useSWR from "swr";

// Frontend-driven first import. Two phases, both resumable from persisted
// server state:
//   pull     — loop advanceImport() (resume mode) while the stored
//              pagination_token checkpoint exists;
//   organize — loop processPendingBookmarks() until the pending/failed AI
//              queue drains.
// Visibility criterion mirrors that state (`importing || pending > 0`), so a
// user who closes the page mid-import sees the banner resume on the next
// visit. Runs pause while the tab is hidden to save X quota and AI spend.
const STATS_KEY = "bookmarks-stats";
const ROUND_PAUSE_MS = 500;
const RETRY_PAUSE_MS = 60_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function ImportProgressBanner({
  manualSyncActive,
}: {
  manualSyncActive: boolean;
}) {
  const t = useTranslations("Bookmarks");
  const locale = useLocale();
  const { mutate: globalMutate } = useSWRConfig();

  // Same key as BookmarksBoard: SWR shares one cache, so refreshing here
  // also updates the board's counters.
  const { data: statsData } = useSWR(STATS_KEY, getBookmarkStats, {
    refreshInterval: 5000,
  });
  const stats = statsData?.success ? statsData.data : null;

  const [phase, setPhase] = useState<"pull" | "organize" | null>(null);
  const [imported, setImported] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [paused, setPaused] = useState(false);

  const runningRef = useRef(false);
  const pausedRef = useRef(false);
  const manualSyncRef = useRef(manualSyncActive);
  useEffect(() => {
    manualSyncRef.current = manualSyncActive;
  }, [manualSyncActive]);

  const active = !!stats && (stats.importing || stats.pending > 0);

  // Pause/resume with tab visibility (and while the manual Sync loop runs).
  useEffect(() => {
    const onVisibility = () => {
      pausedRef.current = document.hidden;
      setPaused(document.hidden);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (manualSyncActive) {
      pausedRef.current = true;
      setPaused(true);
    } else if (!document.hidden) {
      pausedRef.current = false;
      setPaused(false);
    }
  }, [manualSyncActive]);

  // The manual Sync loop owns the connection while it runs; stand down and
  // let it finish first.
  const heldByManualSync = () => {
    if (!manualSyncRef.current) return false;
    pausedRef.current = true;
    setPaused(true);
    return true;
  };

  // BookmarksBoard's list cache keys start with '["bookmarks"'; the digest
  // board listens on "bookmarks-stats". Refresh both so new cards stream in.
  const refreshBoards = () => {
    globalMutate(
      (key: unknown) => typeof key === "string" && key.startsWith('["bookmarks"'),
      undefined,
      { revalidate: true }
    );
    globalMutate(STATS_KEY);
  };

  // Dead tokens can only be fixed by re-authorizing: jump into the OAuth
  // reconnect flow, same entry as BookmarksBoard.
  const startReconnect = () => {
    const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
    window.setTimeout(() => {
      authClient.linkSocial({
        provider: "twitter",
        callbackURL: `${prefix}/dashboard/bookmarks`,
        errorCallbackURL: `${prefix}/dashboard/bookmarks?error=link-failed`,
      });
    }, 800);
  };

  useEffect(() => {
    if (!active || !stats?.connected) return;
    if (runningRef.current) return;
    runningRef.current = true;
    let cancelled = false;

    const waitWhilePaused = async () => {
      while (!cancelled && pausedRef.current) await sleep(ROUND_PAUSE_MS);
    };

    const waitActiveOrCancel = async (ms: number) => {
      const until = Date.now() + ms;
      while (!cancelled && Date.now() < until) {
        await sleep(ROUND_PAUSE_MS);
        if (!active) return; // queue drained meanwhile: stop quietly
      }
    };

    const run = async () => {
      try {
        while (!cancelled && active) {
          if (stats.importing) {
            setPhase("pull");
            await waitWhilePaused();
            if (cancelled || !active) break;
            if (heldByManualSync()) break;
            const res = await advanceImport();
            if (cancelled) break;
            if (!res.success) {
              if (res.customCode === "auth-error") {
                setPhase(null);
                startReconnect();
                break;
              }
              // Rate limit, transient refresh failure or generic error:
              // checkpoint and queue persist, so retry later.
              setPaused(true);
              pausedRef.current = true;
              await waitActiveOrCancel(RETRY_PAUSE_MS);
              setPaused(false);
              pausedRef.current = document.hidden;
              continue;
            }
            setImported((prev) => prev + (res.data?.added ?? 0));
            refreshBoards();
            if (res.data?.stoppedReason !== "max-pages") break; // done/caught-up
          } else if (stats.pending > 0) {
            setPhase("organize");
            setRemaining(stats.pending);
            await waitWhilePaused();
            if (cancelled || !active) break;
            if (heldByManualSync()) break;
            const res = await processPendingBookmarks();
            if (cancelled) break;
            if (!res.success) {
              setPaused(true);
              pausedRef.current = true;
              await waitActiveOrCancel(RETRY_PAUSE_MS);
              setPaused(false);
              pausedRef.current = document.hidden;
              continue;
            }
            const left = res.data?.remaining ?? 0;
            setRemaining(left);
            refreshBoards();
            if (left === 0 || (res.data?.processed ?? 0) === 0) break;
          } else {
            break;
          }
          await sleep(ROUND_PAUSE_MS);
        }
      } finally {
        setPhase(null);
        runningRef.current = false;
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
    // `stats` intentionally excluded: SWR refreshes it in place every 5s and
    // re-running the effect would restart the loop mid-round.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!active || !stats?.connected) return null;

  return (
    <div className="flex items-center gap-3 rounded-none border bg-card px-4 py-2.5 text-sm shadow-none">
      {paused ? (
        <span className="size-4 shrink-0 rounded-full border-2 border-muted-foreground/40 border-t-muted-foreground" />
      ) : (
        <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
      )}
      <span className="min-w-0 flex-1 truncate text-muted-foreground">
        {phase === "organize"
          ? t("importBanner.organizing", { remaining })
          : t("importBanner.pulling", { count: imported })}
      </span>
      <Sparkles className="size-4 shrink-0 text-muted-foreground/60" />
    </div>
  );
}
