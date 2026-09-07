import { useCallback, useEffect, useRef, useState } from "react";
import { searchBookmarks, type SearchBookmark } from "../lib/api";
import { useDebouncedValue } from "../lib/hooks";

const PAGE_SIZE = 10;

export function SearchPanel({ enabled }: { enabled: boolean }) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 250);
  const [results, setResults] = useState<SearchBookmark[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (enabled) inputRef.current?.focus();
  }, [enabled]);

  const loadPage = useCallback(
    async (pageIndex: number, q: string, append: boolean) => {
      const id = ++requestId.current;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const data = await searchBookmarks({
          q,
          page: pageIndex,
          limit: PAGE_SIZE,
        });
        if (id !== requestId.current) return;
        setResults((prev) =>
          append
            ? [
                ...prev,
                ...data.bookmarks.filter(
                  (b) => !prev.some((p) => p.id === b.id)
                ),
              ]
            : data.bookmarks
        );
        setTotal(data.totalCount);
        setPage(pageIndex);
        setHasMore(data.hasMore);
      } catch (err: unknown) {
        if (id !== requestId.current) return;
        if (!append) {
          setResults([]);
          setTotal(0);
          setHasMore(false);
        }
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    []
  );

  // Reset + fetch first page when query changes or auth enables.
  useEffect(() => {
    if (!enabled) {
      setResults([]);
      setTotal(0);
      setHasMore(false);
      setError(null);
      return;
    }
    void loadPage(0, debounced.trim(), false);
  }, [debounced, enabled, loadPage]);

  // Infinite scroll via IntersectionObserver on a sentinel.
  useEffect(() => {
    if (!enabled || !hasMore || loading || loadingMore) return;
    const root = listRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void loadPage(page + 1, debounced.trim(), true);
        }
      },
      { root, rootMargin: "80px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    enabled,
    hasMore,
    loading,
    loadingMore,
    page,
    debounced,
    loadPage,
  ]);

  const q = query.trim();

  return (
    <div className="col" style={{ gap: 10, height: "100%" }}>
      <input
        ref={inputRef}
        className="input"
        placeholder="Search bookmarks…"
        value={query}
        disabled={!enabled}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div ref={listRef} className="scroll" style={{ flex: 1, minHeight: 0 }}>
        {!enabled && (
          <p className="muted" style={{ padding: "8px 2px" }}>
            Sign in to search your WakeMark bookmarks.
          </p>
        )}

        {enabled && loading && results.length === 0 && (
          <p className="muted" style={{ padding: "8px 2px" }}>
            Loading…
          </p>
        )}

        {error && (
          <p className="danger" style={{ padding: "8px 2px" }}>
            {error}
          </p>
        )}

        {enabled && !loading && !error && results.length === 0 && (
          <p className="muted" style={{ padding: "8px 2px" }}>
            {q
              ? `No bookmarks matched “${q}”.`
              : "No bookmarks yet. Sync from the dashboard first."}
          </p>
        )}

        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {results.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                className="bookmark-item"
                onClick={() => {
                  void chrome.tabs.create({ url: b.tweetUrl });
                }}
              >
                {b.authorProfileImageUrl ? (
                  <img
                    src={b.authorProfileImageUrl}
                    alt=""
                    className="bookmark-avatar"
                    width={32}
                    height={32}
                  />
                ) : (
                  <div className="bookmark-avatar" />
                )}
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 12,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {b.authorName || b.authorUsername || "Unknown"}
                    {b.authorUsername ? (
                      <span className="muted"> @{b.authorUsername}</span>
                    ) : null}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {b.summary || b.text}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>

        {enabled && results.length > 0 && (
          <div ref={sentinelRef} className="list-footer">
            {loadingMore
              ? "Loading more…"
              : hasMore
                ? "Scroll for more"
                : total > 0
                  ? `${results.length} of ${total}`
                  : null}
          </div>
        )}
      </div>
    </div>
  );
}
