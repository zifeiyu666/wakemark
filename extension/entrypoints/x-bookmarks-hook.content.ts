import {
  extractBookmarksFromPayload,
  looksLikeBookmarkTimeline,
  type ScrapedBookmark,
} from "../lib/x-timeline";

const MSG = "wakemark:x-graphql";

function emit(tweets: ScrapedBookmark[]) {
  if (tweets.length === 0) return;
  window.postMessage({ type: MSG, tweets }, "*");
}

function handleBody(body: unknown) {
  if (!looksLikeBookmarkTimeline(body)) return;
  let payload = body;
  if (typeof body === "string") {
    try {
      payload = JSON.parse(body);
    } catch {
      return;
    }
  }
  emit(extractBookmarksFromPayload(payload));
}

export default defineContentScript({
  matches: [
    "https://x.com/i/bookmarks*",
    "https://twitter.com/i/bookmarks*",
  ],
  world: "MAIN",
  runAt: "document_start",
  main() {
    const origFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const res = await origFetch(...args);
      try {
        const url = String(
          typeof args[0] === "string"
            ? args[0]
            : args[0] instanceof Request
              ? args[0].url
              : args[0] instanceof URL
                ? args[0].href
                : ""
        );
        if (url.includes("/graphql/") || url.includes("Bookmark")) {
          const clone = res.clone();
          void clone.text().then((text) => handleBody(text)).catch(() => undefined);
        }
      } catch {
        // ignore
      }
      return res;
    };

    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (
      this: XMLHttpRequest,
      method: string,
      url: string | URL
    ) {
      (this as XMLHttpRequest & { __wmUrl?: string }).__wmUrl = String(url);
      return origOpen.apply(this, arguments as unknown as Parameters<typeof origOpen>);
    };
    XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
      this.addEventListener("load", function () {
        const req = this as XMLHttpRequest & { __wmUrl?: string };
        const url = req.__wmUrl ?? "";
        if (url.includes("/graphql/") || url.includes("Bookmark")) {
          handleBody(req.responseText);
        }
      });
      return origSend.call(this, body);
    };
  },
});
