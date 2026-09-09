import { STORAGE_KEYS } from "./config";

export type ImportStatus = {
  status: "idle" | "running" | "done" | "error";
  inserted: number;
  skipped: number;
  error: string | null;
  dismissed?: boolean;
};

export const idleImportStatus: ImportStatus = {
  status: "idle",
  inserted: 0,
  skipped: 0,
  error: null,
  dismissed: false,
};

export async function readImportStatus(): Promise<ImportStatus> {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.importStatus);
  const value = stored[STORAGE_KEYS.importStatus] as ImportStatus | undefined;
  return value ?? idleImportStatus;
}

export async function writeImportStatus(next: ImportStatus) {
  await chrome.storage.local.set({ [STORAGE_KEYS.importStatus]: next });
}
