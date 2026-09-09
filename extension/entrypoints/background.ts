import { importBookmarks, pollAuth, setStoredAuth } from "../lib/api";
import { SITE_URL } from "../lib/config";
import {
  readImportStatus,
  type ImportStatus,
  writeImportStatus,
} from "../lib/import-status";
import {
  ensureBookmarkContentScriptsRegistered,
  injectBookmarkScripts,
} from "../lib/bookmark-content-scripts";
import { X_IMPORT_ORIGINS } from "../lib/import-permissions";
import { openImportSidePanel } from "../lib/open-import-panel";
import { runShadowbanTest } from "../lib/shadowban";

const POLL_ALARM = "wakemark-auth-poll";
const BOOKMARKS_URLS = [
  "https://x.com/i/bookmarks*",
  "https://twitter.com/i/bookmarks*",
];

let importRunning = false;
let importTabId: number | null = null;
let autoFinishTimer: ReturnType<typeof setTimeout> | null = null;
let importMaxTimer: ReturnType<typeof setTimeout> | null = null;

/** After the last batch, finalize if the bookmarks tab goes quiet. */
const AUTO_FINISH_QUIET_MS = 15_000;
const MAX_IMPORT_MS = 20 * 60_000;

export default defineBackground(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: false })
    .catch(() => undefined);

  chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabId === importTabId) {
      void finalizeImport("tab-closed");
    }
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (tabId !== importTabId || !changeInfo.url) return;
    if (!/\/i\/bookmarks/.test(changeInfo.url)) {
      void finalizeImport("tab-navigated");
    }
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "wakemark:start-login") {
      void startLogin()
        .then(() => sendResponse({ ok: true }))
        .catch((err: unknown) =>
          sendResponse({
            ok: false,
            error: err instanceof Error ? err.message : "Login failed",
          })
        );
      return true;
    }
    if (message?.type === "wakemark:auth-granted") {
      const state = message.state as string | undefined;
      if (state) {
        void tryCompleteAuth(state).then((ok) => sendResponse({ ok }));
        return true;
      }
    }
    if (message?.type === "wakemark:shadowban-test") {
      const handle = typeof message.handle === "string" ? message.handle : "";
      void runShadowbanTest(handle)
        .then((data) => sendResponse({ ok: true, data }))
        .catch((err: unknown) =>
          sendResponse({
            ok: false,
            error:
              err instanceof Error ? err.message : "Shadowban test failed",
          })
        );
      return true;
    }
    if (message?.type === "wakemark:start-history-import") {
      void startHistoryImport()
        .then(() => sendResponse({ ok: true }))
        .catch((err: unknown) =>
          sendResponse({
            ok: false,
            error: err instanceof Error ? err.message : "Import failed",
          })
        );
      return true;
    }
    if (message?.type === "wakemark:import-batch") {
      void ingestBatch(message.items)
        .then(() => sendResponse({ ok: true }))
        .catch((err: unknown) =>
          sendResponse({
            ok: false,
            error: err instanceof Error ? err.message : "Import failed",
          })
        );
      return true;
    }
    if (message?.type === "wakemark:import-done") {
      void finalizeImport("content-script")
        .then(() => sendResponse({ ok: true }))
        .catch((err: unknown) =>
          sendResponse({
            ok: false,
            error: err instanceof Error ? err.message : "Import failed",
          })
        );
      return true;
    }
    if (message?.type === "wakemark:finalize-import") {
      void finalizeImport("manual")
        .then(() => sendResponse({ ok: true }))
        .catch((err: unknown) =>
          sendResponse({
            ok: false,
            error: err instanceof Error ? err.message : "Import failed",
          })
        );
      return true;
    }
    return false;
  });

  chrome.runtime.onMessageExternal.addListener(
    (message, _sender, sendResponse) => {
      if (message?.type === "wakemark:start-history-import") {
        void startHistoryImport()
          .then(() => sendResponse({ ok: true }))
          .catch((err: unknown) =>
            sendResponse({
              ok: false,
              error: err instanceof Error ? err.message : "Import failed",
            })
          );
        return true;
      }
      return false;
    }
  );

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== POLL_ALARM) return;
    void pollFromAlarm();
  });

  void (async () => {
    const stored = await getImportStatus();
    if (stored.status === "running") {
      importRunning = true;
      scheduleAutoFinish();
    }
    const hasX = await chrome.permissions.contains({ origins: X_IMPORT_ORIGINS });
    if (hasX) await ensureBookmarkContentScriptsRegistered();
  })();
});

async function getImportStatus(): Promise<ImportStatus> {
  return readImportStatus();
}

async function setImportStatus(next: ImportStatus) {
  await writeImportStatus(next);
}

function clearImportWatchers() {
  if (autoFinishTimer) clearTimeout(autoFinishTimer);
  autoFinishTimer = null;
  if (importMaxTimer) clearTimeout(importMaxTimer);
  importMaxTimer = null;
  importTabId = null;
}

function scheduleAutoFinish() {
  if (!importRunning) return;
  if (autoFinishTimer) clearTimeout(autoFinishTimer);
  autoFinishTimer = setTimeout(() => {
    void finalizeImport("quiet");
  }, AUTO_FINISH_QUIET_MS);
}

function armImportWatchers(tabId: number) {
  clearImportWatchers();
  importTabId = tabId;
  scheduleAutoFinish();
  importMaxTimer = setTimeout(() => {
    void finalizeImport("max-duration");
  }, MAX_IMPORT_MS);
}

async function finalizeImport(_reason?: string) {
  const stored = await getImportStatus();
  if (!importRunning && stored.status !== "running") return;
  clearImportWatchers();
  try {
    await finishImport();
  } catch (error) {
    const prev = await getImportStatus();
    await setImportStatus({
      status: "done",
      inserted: prev.inserted,
      skipped: prev.skipped,
      error:
        error instanceof Error
          ? `Imported with warning: ${error.message}`
          : null,
      dismissed: false,
    });
    importRunning = false;
  }
}

async function ingestBatch(items: unknown[]) {
  if (!Array.isArray(items) || items.length === 0) return;
  try {
    const result = await importBookmarks({ items, done: false });
    const prev = await getImportStatus();
    await setImportStatus({
      status: "running",
      inserted: prev.inserted + result.inserted,
      skipped: prev.skipped + result.skipped,
      error: null,
      dismissed: false,
    });
    scheduleAutoFinish();
  } catch (error) {
    await setImportStatus({
      ...(await getImportStatus()),
      status: "error",
      error: error instanceof Error ? error.message : "Import failed",
      dismissed: false,
    });
    throw error;
  }
}

async function finishImport() {
  const prev = await getImportStatus();
  if (prev.status === "done") {
    importRunning = false;
    return;
  }
  const result = await importBookmarks({ items: [], done: true });
  await setImportStatus({
    status: "done",
    inserted: prev.inserted + result.inserted,
    skipped: prev.skipped + result.skipped,
    error: null,
    dismissed: false,
  });
  importRunning = false;
}

async function startHistoryImport() {
  if (importRunning) return;
  importRunning = true;
  await setImportStatus({
    status: "running",
    inserted: 0,
    skipped: 0,
    error: null,
    dismissed: false,
  });

  try {
    const hasPermission = await chrome.permissions.contains({
      origins: X_IMPORT_ORIGINS,
    });
    if (!hasPermission) {
      throw new Error(
        "Open the WakeMark extension popup and click Import history to allow x.com access."
      );
    }

    await ensureBookmarkContentScriptsRegistered();

    const existing = await chrome.tabs.query({ url: BOOKMARKS_URLS });
    let tabId = existing[0]?.id;
    if (tabId == null) {
      const created = await chrome.tabs.create({
        url: "https://x.com/i/bookmarks",
        active: true,
      });
      if (created.id == null) throw new Error("Could not open X bookmarks.");
      tabId = created.id;
      await waitForTabComplete(tabId);
    } else {
      await chrome.tabs.update(tabId, { active: true });
      const tab = await chrome.tabs.get(tabId);
      if (tab.status !== "complete") {
        await waitForTabComplete(tabId);
      }
    }

    await injectBookmarkScripts(tabId);
    await sleep(600);
    await pingBookmarkTab(tabId);
    armImportWatchers(tabId);
    await openImportSidePanel(tabId);
  } catch (error) {
    importRunning = false;
    clearImportWatchers();
    await setImportStatus({
      status: "error",
      inserted: 0,
      skipped: 0,
      error: error instanceof Error ? error.message : "Import failed",
      dismissed: false,
    });
    throw error;
  }
}

async function pingBookmarkTab(tabId: number): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      if (attempt > 0 && attempt % 3 === 0) {
        await injectBookmarkScripts(tabId);
      }
      const ping = await chrome.tabs.sendMessage(tabId, {
        type: "wakemark:begin-import",
      });
      if (ping && typeof ping === "object" && ping.ok === false) {
        throw new Error(
          typeof ping.error === "string"
            ? ping.error
            : "Sign in to X on the bookmarks tab, then try again."
        );
      }
      return;
    } catch (error) {
      lastError = error;
      await sleep(Math.min(400 + attempt * 120, 2000));
    }
  }
  const detail =
    lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(
    `Could not connect to the bookmarks page (${detail}). Stay on x.com/i/bookmarks and retry.`
  );
}

function waitForTabComplete(tabId: number): Promise<void> {
  return new Promise((resolve) => {
    const onUpdated = (id: number, info: { status?: string }) => {
      if (id === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(onUpdated);
        resolve();
      }
    };
    chrome.tabs.get(tabId, (tab) => {
      if (tab?.status === "complete") {
        resolve();
        return;
      }
      chrome.tabs.onUpdated.addListener(onUpdated);
    });
  });
}

async function pollFromAlarm() {
  const session = await chrome.storage.session.get([
    STORAGE_KEYS.authState,
    "wakemark.authDeadline",
  ]);
  const state = session[STORAGE_KEYS.authState] as string | undefined;
  const deadline = session["wakemark.authDeadline"] as number | undefined;
  if (!state) {
    await chrome.alarms.clear(POLL_ALARM);
    return;
  }
  if (deadline && Date.now() > deadline) {
    await chrome.storage.session.remove([
      STORAGE_KEYS.authState,
      STORAGE_KEYS.authTabId,
      "wakemark.authDeadline",
    ]);
    await chrome.alarms.clear(POLL_ALARM);
    return;
  }
  const done = await tryCompleteAuth(state);
  if (done) await chrome.alarms.clear(POLL_ALARM);
}

async function startLogin() {
  const state = crypto.randomUUID();
  await chrome.storage.session.set({
    [STORAGE_KEYS.authState]: state,
    "wakemark.authDeadline": Date.now() + 120_000,
  });

  const next = `/extension/connect?state=${encodeURIComponent(state)}`;
  const loginUrl = `${SITE_URL}/login?next=${encodeURIComponent(next)}`;
  const tab = await chrome.tabs.create({ url: loginUrl, active: true });
  if (tab.id != null) {
    await chrome.storage.session.set({ [STORAGE_KEYS.authTabId]: tab.id });
  }

  await chrome.alarms.create(POLL_ALARM, {
    periodInMinutes: 1,
    delayInMinutes: 0.05,
  });

  void (async () => {
    for (let i = 0; i < 30; i++) {
      await sleep(1000);
      const session = await chrome.storage.session.get(STORAGE_KEYS.authState);
      if (!session[STORAGE_KEYS.authState]) return;
      const done = await tryCompleteAuth(state);
      if (done) {
        await chrome.alarms.clear(POLL_ALARM);
        return;
      }
    }
  })();
}

async function tryCompleteAuth(state: string): Promise<boolean> {
  try {
    const result = await pollAuth(state);
    if (result.pending || !result.apiKey) return false;

    const session = await chrome.storage.session.get(STORAGE_KEYS.authTabId);
    const tabId = session[STORAGE_KEYS.authTabId] as number | undefined;

    await setStoredAuth(result.apiKey, {
      keyId: result.keyId,
      user: result.user,
    });
    await chrome.storage.session.remove([
      STORAGE_KEYS.authState,
      STORAGE_KEYS.authTabId,
      "wakemark.authDeadline",
    ]);

    if (typeof tabId === "number") {
      chrome.tabs.remove(tabId).catch(() => undefined);
    }
    return true;
  } catch {
    return false;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
