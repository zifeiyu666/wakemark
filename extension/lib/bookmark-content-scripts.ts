const HOOK_ID = "wakemark-x-bookmarks-hook";
const SCROLL_ID = "wakemark-x-bookmarks";

const BOOKMARK_MATCHES = [
  "https://x.com/i/bookmarks*",
  "https://twitter.com/i/bookmarks*",
];

const HOOK_FILE = "content-scripts/x-bookmarks-hook.js";
const SCROLL_FILE = "content-scripts/x-bookmarks.js";

function isBookmarksUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    const { hostname, pathname } = new URL(url);
    return (
      (hostname === "x.com" || hostname === "twitter.com") &&
      pathname.startsWith("/i/bookmarks")
    );
  } catch {
    return false;
  }
}

/** Register scripts so future navigations to bookmarks auto-load them. */
export async function ensureBookmarkContentScriptsRegistered(): Promise<void> {
  const registered = await chrome.scripting.getRegisteredContentScripts();
  const ids = new Set(registered.map((s) => s.id));

  const toRegister: chrome.scripting.RegisteredContentScript[] = [];

  if (!ids.has(HOOK_ID)) {
    toRegister.push({
      id: HOOK_ID,
      matches: BOOKMARK_MATCHES,
      js: [HOOK_FILE],
      runAt: "document_start",
      world: "MAIN",
      persistAcrossSessions: true,
    });
  }

  if (!ids.has(SCROLL_ID)) {
    toRegister.push({
      id: SCROLL_ID,
      matches: BOOKMARK_MATCHES,
      js: [SCROLL_FILE],
      runAt: "document_idle",
      persistAcrossSessions: true,
    });
  }

  if (toRegister.length > 0) {
    await chrome.scripting.registerContentScripts(toRegister);
  }
}

/** Inject into an open bookmarks tab (covers SPAs and already-loaded pages). */
export async function injectBookmarkScripts(tabId: number): Promise<void> {
  const tab = await chrome.tabs.get(tabId);
  if (!isBookmarksUrl(tab.url)) return;

  await ensureBookmarkContentScriptsRegistered();

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [HOOK_FILE],
      world: "MAIN",
    });
  } catch {
    // Hook may already run in MAIN world.
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [SCROLL_FILE],
    });
  } catch {
    // Isolated script may already be present.
  }
}
