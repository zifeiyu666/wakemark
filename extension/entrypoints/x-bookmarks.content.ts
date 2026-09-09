import { mountImportHud } from "../lib/import-hud";

const MSG = "wakemark:x-graphql";
const BATCH = 80;
const IDLE_MS = 4500;
const SCROLL_MS = 900;
// Stop after this many scroll ticks with no new tweets (~9s at 900ms/tick).
const EMPTY_SCROLL_LIMIT = 10;

export default defineContentScript({
  matches: [
    "https://x.com/i/bookmarks*",
    "https://twitter.com/i/bookmarks*",
  ],
  runAt: "document_idle",
  main() {
    mountImportHud();

    const seen = new Set<string>();
    let buffer: unknown[] = [];
    let flushTimer: number | null = null;
    let idleTimer: number | null = null;
    let scrolling = false;
    let scrollTimer: number | null = null;
    let lastNewAt = 0;
    let emptyScrollTicks = 0;

    function flush() {
      if (buffer.length === 0) return;
      const items = buffer.splice(0, buffer.length);
      void chrome.runtime.sendMessage({
        type: "wakemark:import-batch",
        items,
      });
    }

    function scheduleFlush() {
      if (flushTimer != null) return;
      flushTimer = window.setTimeout(() => {
        flushTimer = null;
        flush();
      }, 400);
    }

    function completeImport() {
      if (!scrolling) return;
      stopScroll();
      flush();
      void chrome.runtime
        .sendMessage({ type: "wakemark:import-done" })
        .catch(() => undefined);
    }

    function noteActivity() {
      lastNewAt = Date.now();
      if (idleTimer != null) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        if (!scrolling) return;
        if (Date.now() - lastNewAt < IDLE_MS) return;
        completeImport();
      }, IDLE_MS);
    }

    window.addEventListener("message", (event) => {
      if (event.source !== window) return;
      const data = event.data as {
        type?: string;
        tweets?: Array<{ tweet_id?: string }>;
      } | null;
      if (data?.type !== MSG || !Array.isArray(data.tweets)) return;
      let added = 0;
      for (const tweet of data.tweets) {
        if (!tweet?.tweet_id || seen.has(tweet.tweet_id)) continue;
        seen.add(tweet.tweet_id);
        buffer.push(tweet);
        added += 1;
        if (buffer.length >= BATCH) flush();
      }
      if (added > 0) {
        emptyScrollTicks = 0;
        scheduleFlush();
        noteActivity();
      }
    });

    function startScroll() {
      if (scrolling) return;
      scrolling = true;
      emptyScrollTicks = 0;
      lastNewAt = Date.now();
      const tick = () => {
        if (!scrolling) return;
        window.scrollTo(0, document.documentElement.scrollHeight);
        emptyScrollTicks += 1;
        if (emptyScrollTicks >= EMPTY_SCROLL_LIMIT) {
          completeImport();
          return;
        }
        scrollTimer = window.setTimeout(tick, SCROLL_MS);
      };
      tick();
      noteActivity();
    }

    function stopScroll() {
      scrolling = false;
      if (scrollTimer != null) {
        window.clearTimeout(scrollTimer);
        scrollTimer = null;
      }
      if (idleTimer != null) {
        window.clearTimeout(idleTimer);
        idleTimer = null;
      }
    }

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type === "wakemark:begin-import") {
        const loginWall =
          document.querySelector('a[href="/login"]') &&
          !document.querySelector('[data-testid="primaryColumn"]');
        if (loginWall) {
          sendResponse({
            ok: false,
            error: "Please sign in to X in this tab first.",
          });
          return true;
        }
        mountImportHud();
        startScroll();
        sendResponse({ ok: true });
        return true;
      }
      if (message?.type === "wakemark:stop-import") {
        completeImport();
        sendResponse({ ok: true });
        return true;
      }
      return false;
    });
  },
});
