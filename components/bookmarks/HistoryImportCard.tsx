"use client";

import { getBookmarkStats } from "@/actions/bookmarks/list";
import { Button } from "@/components/ui/button";
import { CHROME_WEB_STORE_URL } from "@/config/site";
import { pingExtensionHistoryImport } from "@/lib/extension/ping";
import { Archive, Puzzle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

const STATS_KEY = "bookmarks-stats";

export function HistoryImportCard({
  compact = false,
}: {
  compact?: boolean;
}) {
  const t = useTranslations("Bookmarks");
  const { data: statsData } = useSWR(STATS_KEY, getBookmarkStats, {
    refreshInterval: 8000,
  });
  const stats = statsData?.success ? statsData.data : null;
  const [busy, setBusy] = useState(false);

  if (!stats?.connected || stats.historyImportCompleted) return null;

  const handleImport = async () => {
    setBusy(true);
    try {
      const started = await pingExtensionHistoryImport();
      if (started) {
        toast.success(t("historyCard.started"));
        return;
      }
      toast.message(t("historyCard.openExtensionHint"), {
        description: t("historyCard.openExtensionHintBody"),
      });
      window.open(CHROME_WEB_STORE_URL, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={
        compact
          ? "flex flex-col gap-3 rounded-none border border-border bg-card px-4 py-4"
          : "flex flex-col gap-3 rounded-none border border-border bg-card px-6 py-6"
      }
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
          <Archive className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 space-y-1">
          <h3 className="text-sm font-semibold">{t("historyCard.title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("historyCard.body")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("historyCard.statusPartial")}
          </p>
        </div>
      </div>
      <div>
        <Button
          type="button"
          size="sm"
          className="rounded-none shadow-none"
          onClick={() => void handleImport()}
          disabled={busy}
        >
          <Puzzle className="h-3.5 w-3.5" />
          {t("historyCard.cta")}
        </Button>
      </div>
    </div>
  );
}
