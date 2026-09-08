import { pollAuth, setStoredAuth } from "../lib/api";
import { SITE_URL, STORAGE_KEYS } from "../lib/config";
import { runShadowbanTest } from "../lib/shadowban";

const POLL_ALARM = "wakemark-auth-poll";

export default defineBackground(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: false })
    .catch(() => undefined);

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
    return false;
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== POLL_ALARM) return;
    void pollFromAlarm();
  });
});

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

  // Content script notifies on grant; alarms are a fallback while the SW sleeps.
  await chrome.alarms.create(POLL_ALARM, {
    periodInMinutes: 1,
    delayInMinutes: 0.05,
  });

  // Keep the worker warm briefly and poll eagerly (already-logged-in users).
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
