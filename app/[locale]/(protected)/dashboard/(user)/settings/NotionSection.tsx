"use client";

import {
  getNotionConnection,
  searchNotionParentPages,
  setupNotionDatabase,
  updateNotionAutoSync,
  disconnectNotion,
} from "@/actions/notion/connection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useProductAccess } from "@/components/payments/ProductAccessProvider";
import { SubscribePromptDialog } from "@/components/payments/SubscribePromptDialog";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import SettingsCard from "./SettingsCard";

type NotionPageOption = {
  id: string;
  title: string;
  url: string;
};

export default function NotionSection() {
  const t = useTranslations("Settings.notion");
  const { hasPaidSubscription } = useProductAccess();
  const [loaded, setLoaded] = useState(false);
  const [connected, setConnected] = useState(false);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [databaseId, setDatabaseId] = useState<string | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [syncedCount, setSyncedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [pageQuery, setPageQuery] = useState("");
  const [pages, setPages] = useState<NotionPageOption[]>([]);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);

  const refresh = async () => {
    const result = await getNotionConnection();
    if (!result.success || !result.data) return;
    setConnected(result.data.connected);
    setWorkspaceName(result.data.workspaceName ?? null);
    setDatabaseId(result.data.databaseId ?? null);
    setAutoSyncEnabled(result.data.autoSyncEnabled);
    setSyncStatus(result.data.syncStatus);
    setLastSyncError(result.data.lastSyncError ?? null);
    setSyncedCount(result.data.syncedCount);
    setPendingCount(result.data.pendingCount);
    setLoaded(true);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const requirePaid = () => {
    if (hasPaidSubscription) return true;
    setSubscribeOpen(true);
    return false;
  };

  const handleConnect = () => {
    if (!requirePaid()) return;
    window.location.href = "/api/notion/oauth/start";
  };

  const handleDisconnect = async () => {
    if (!requirePaid()) return;
    setSaving(true);
    try {
      const result = await disconnectNotion();
      if (!result.success) {
        toast.error(t("toast.errorTitle"), { description: result.error });
        return;
      }
      toast.success(t("toast.disconnectedTitle"));
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleSearchPages = async () => {
    if (!requirePaid() || !connected) return;
    setSearching(true);
    try {
      const result = await searchNotionParentPages(pageQuery);
      if (!result.success) {
        toast.error(t("toast.errorTitle"), { description: result.error });
        return;
      }
      setPages(result.data ?? []);
    } finally {
      setSearching(false);
    }
  };

  const handleSetupDatabase = async () => {
    if (!requirePaid() || !selectedPageId) return;
    setSaving(true);
    try {
      const result = await setupNotionDatabase(selectedPageId);
      if (!result.success) {
        toast.error(t("toast.errorTitle"), { description: result.error });
        return;
      }
      toast.success(t("toast.databaseReadyTitle"));
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleAutoSyncChange = async (enabled: boolean) => {
    if (!requirePaid()) return;
    setAutoSyncEnabled(enabled);
    setSaving(true);
    try {
      const result = await updateNotionAutoSync(enabled);
      if (!result.success) {
        setAutoSyncEnabled(!enabled);
        toast.error(t("toast.errorTitle"), { description: result.error });
        return;
      }
      toast.success(
        enabled ? t("toast.autoSyncEnabledTitle") : t("toast.autoSyncDisabledTitle")
      );
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SettingsCard
        title={t("title")}
        description={t("description")}
        footerHint={t("footerHint")}
      >
        <div className="space-y-4">
          {connected ? (
            <div className="space-y-1 text-sm">
              <p>
                {t("connectedWorkspace", {
                  workspace: workspaceName ?? t("unknownWorkspace"),
                })}
              </p>
              <p className="text-muted-foreground">
                {databaseId
                  ? t("databaseReady")
                  : t("databaseMissing")}
              </p>
              <p className="text-muted-foreground">
                {t("syncStats", { synced: syncedCount, pending: pendingCount })}
              </p>
              {syncStatus === "syncing" && (
                <p className="text-muted-foreground">{t("syncing")}</p>
              )}
              {lastSyncError && (
                <p className="text-destructive">{lastSyncError}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("notConnected")}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {!connected ? (
              <Button type="button" onClick={handleConnect} disabled={!loaded}>
                {t("connectButton")}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={handleDisconnect}
                disabled={saving}
              >
                {t("disconnectButton")}
              </Button>
            )}
          </div>

          {connected && !databaseId && (
            <div className="space-y-3 border-t border-border pt-4">
              <Label htmlFor="notion-page-query">{t("parentPageLabel")}</Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  id="notion-page-query"
                  value={pageQuery}
                  onChange={(e) => setPageQuery(e.target.value)}
                  placeholder={t("parentPagePlaceholder")}
                  className="max-w-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSearchPages}
                  disabled={searching}
                >
                  {searching ? t("searching") : t("searchPages")}
                </Button>
              </div>
              {pages.length > 0 && (
                <div className="space-y-2">
                  {pages.map((page) => (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => setSelectedPageId(page.id)}
                      className={`block w-full rounded-none border px-3 py-2 text-left text-sm ${
                        selectedPageId === page.id
                          ? "border-foreground bg-secondary"
                          : "border-border hover:bg-secondary/60"
                      }`}
                    >
                      {page.title}
                    </button>
                  ))}
                </div>
              )}
              <Button
                type="button"
                onClick={handleSetupDatabase}
                disabled={!selectedPageId || saving}
              >
                {t("createDatabase")}
              </Button>
            </div>
          )}

          {connected && databaseId && (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div className="space-y-1">
                <Label htmlFor="notion-auto-sync">{t("autoSyncLabel")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("autoSyncHint")}
                </p>
              </div>
              <Switch
                id="notion-auto-sync"
                checked={autoSyncEnabled}
                onCheckedChange={handleAutoSyncChange}
                disabled={saving}
              />
            </div>
          )}
        </div>
      </SettingsCard>

      <SubscribePromptDialog
        open={subscribeOpen}
        onOpenChange={setSubscribeOpen}
        variant="notionExport"
      />
    </>
  );
}
