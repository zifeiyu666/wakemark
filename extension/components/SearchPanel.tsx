import { useEffect, useRef, useState } from "react";
import { searchBookmarks, type SearchBookmark } from "../lib/api";
import { useDebouncedValue } from "../lib/hooks";

export function SearchPanel({ enabled }: { enabled: boolean }) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 250);
  const [results, setResults] = useState<SearchBookmark[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (enabled) inputRef.current?.focus();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const q = debounced.trim();
    if (!q) {
      setResults([]);
      setTotal(0);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    void searchBookmarks(q, 10)
      .then((data) => {
        if (cancelled) return;
        setResults(data.bookmarks);
        setTotal(data.totalCount);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setResults([]);
        setError(err instanceof Error ? err.message : "Search failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debounced, enabled]);

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

      <div className="scroll" style={{ flex: 1, minHeight: 0 }}>
        {!enabled && (
          <p className="muted" style={{ padding: "8px 2px" }}>
            Sign in to search your WakeMark bookmarks.
          </p>
        )}
        {enabled && !query.trim() && (
          <p className="muted" style={{ padding: "8px 2px" }}>
            Type to search by text, author, summary, or tags.
          </p>
        )}
        {enabled && query.trim() && loading && (
          <p className="muted" style={{ padding: "8px 2px" }}>
            Searching…
          </p>
        )}
        {error && (
          <p className="danger" style={{ padding: "8px 2px" }}>
            {error}
          </p>
        )}
        {enabled && query.trim() && !loading && !error && results.length === 0 && (
          <p className="muted" style={{ padding: "8px 2px" }}>
            No bookmarks matched “{query.trim()}”.
          </p>
        )}
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {results.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                className="btn-ghost"
                style={{
                  display: "flex",
                  gap: 10,
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 6px",
                  borderRadius: 8,
                  border: "none",
                  background: "transparent",
                  color: "inherit",
                }}
                onClick={() => {
                  void chrome.tabs.create({ url: b.tweetUrl });
                }}
              >
                {b.authorProfileImageUrl ? (
                  <img
                    src={b.authorProfileImageUrl}
                    alt=""
                    width={32}
                    height={32}
                    style={{ borderRadius: "50%", flexShrink: 0 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "var(--surface)",
                      flexShrink: 0,
                    }}
                  />
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
        {total > results.length && (
          <p className="muted" style={{ padding: "4px 6px", fontSize: 11 }}>
            Showing {results.length} of {total}
          </p>
        )}
      </div>
    </div>
  );
}
