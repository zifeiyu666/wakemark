"use client";

import { processPendingBookmarks } from "@/actions/bookmarks/process";
import { getBookmarkStats } from "@/actions/bookmarks/list";
import { Loader2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useSWRConfig } from "swr";
import useSWR from "swr";

// Frontend-driven AI organize loop. Visibility mirrors `pending > 0` so a
// user who closes the page mid-tagging sees the banner resume on the next
// visit. Historical X API pagination is gone — new bookmarks arrive via
// incremental Sync, daily cron, or the Chrome extension import API.
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
  const { mutate: globalMutate } = useSWRConfig();

  const { data: statsData } = useSWR(STATS_KEY, getBookmarkStats, {
    refreshInterval: 5000,
  });
  const stats = statsData?.success ? statsData.data : null;

  const [remaining, setRemaining] = useState(0);
  const [paused, setPaused] = useState(false);

  const runningRef = useRef(false);
  const pausedRef = useRef(false);
  const manualSyncRef = useRef(manualSyncActive);
  useEffect(() => {
    manualSyncRef.current = manualSyncActive;
  }, [manualSyncActive]);

  const active = !!stats && stats.pending > 0;

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

  const heldByManualSync = () => {
    if (!manualSyncRef.current) return false;
    pausedRef.current = true;
    setPaused(true);
    return true;
  };

  const refreshBoards = () => {
    globalMutate(
      (key: unknown) => typeof key === "string" && key.startsWith('["bookmarks"'),
      undefined,
      { revalidate: true }
    );
    globalMutate(STATS_KEY);
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
        if (!active) return;
      }
    };

    const run = async () => {
      try {
        while (!cancelled && active) {
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
          await sleep(ROUND_PAUSE_MS);
        }
      } finally {
        runningRef.current = false;
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
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
        {t("importBanner.organizing", { remaining })}
      </span>
      <Sparkles className="size-4 shrink-0 text-muted-foreground/60" />
    </div>
  );
}
