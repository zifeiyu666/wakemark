"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ImportProgressBanner } from "./ImportProgressBanner";

type ImportProgressValue = {
  manualSyncActive: boolean;
  setManualSyncActive: (active: boolean) => void;
};

// Default no-op keeps BookmarksBoard safe outside the provider (it is only
// rendered under the dashboard layout today, which wraps everything).
const ImportProgressContext = createContext<ImportProgressValue>({
  manualSyncActive: false,
  setManualSyncActive: () => {},
});

export function useImportProgress() {
  return useContext(ImportProgressContext);
}

// Renders the AI organizing banner above the dashboard content and shares a
// "manual Sync is running" flag so the banner loop stands down while
// BookmarksBoard's own Sync loop owns processing.
export function ImportProgressProvider({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const [manualSyncActive, setManualSyncActive] = useState(false);
  const value = useMemo(
    () => ({ manualSyncActive, setManualSyncActive }),
    [manualSyncActive]
  );
  return (
    <ImportProgressContext.Provider value={value}>
      {enabled ? (
        <ImportProgressBanner manualSyncActive={manualSyncActive} />
      ) : null}
      {children}
    </ImportProgressContext.Provider>
  );
}
