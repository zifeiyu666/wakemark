import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS } from "./config";
import { ensureXImportPermissions } from "./import-permissions";
import {
  idleImportStatus,
  readImportStatus,
  type ImportStatus,
  writeImportStatus,
} from "./import-status";
import { openImportSidePanel } from "./open-import-panel";

export function useImportHistory() {
  const [status, setStatus] = useState<ImportStatus>(idleImportStatus);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const key = STORAGE_KEYS.importStatus;
    void readImportStatus().then(setStatus);
    const onChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => {
      if (area !== "local" || !changes[key]) return;
      const next = changes[key].newValue as ImportStatus | undefined;
      setStatus(next ?? idleImportStatus);
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);

  const start = useCallback(async () => {
    setBusy(true);
    try {
      await ensureXImportPermissions();
      await openImportSidePanel();
      const res = (await chrome.runtime.sendMessage({
        type: "wakemark:start-history-import",
      })) as { ok?: boolean; error?: string } | undefined;

      if (!res) {
        throw new Error(
          "No response from the extension. Reload the extension and try again."
        );
      }
      if (res.ok === false) {
        throw new Error(res.error || "Import failed");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Import failed to start";
      const next: ImportStatus = {
        status: "error",
        inserted: 0,
        skipped: 0,
        error: message,
        dismissed: false,
      };
      setStatus(next);
      await writeImportStatus(next);
    } finally {
      setBusy(false);
    }
  }, []);

  const markDone = useCallback(async () => {
    setBusy(true);
    try {
      await chrome.runtime.sendMessage({ type: "wakemark:finalize-import" });
    } finally {
      setBusy(false);
    }
  }, []);

  const dismissComplete = useCallback(async () => {
    const prev = await readImportStatus();
    if (prev.status !== "done") return;
    const next = { ...prev, dismissed: true };
    setStatus(next);
    await writeImportStatus(next);
  }, []);

  const showHeaderImportAgain =
    status.status === "done" && status.dismissed === true;

  const showImportBar =
    status.status === "idle" ||
    status.status === "running" ||
    status.status === "error" ||
    (status.status === "done" && !status.dismissed);

  return {
    status,
    busy,
    start,
    markDone,
    dismissComplete,
    showHeaderImportAgain,
    showImportBar,
  };
}
