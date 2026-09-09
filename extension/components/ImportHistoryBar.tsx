import { useImportHistory } from "../lib/use-import-history";

export function ImportHistoryBar({ signedIn }: { signedIn: boolean }) {
  const { status, busy, start, markDone, dismissComplete, showImportBar } =
    useImportHistory();

  if (!signedIn || !showImportBar) return null;

  if (status.status === "done") {
    const total = status.inserted + status.skipped;
    return (
      <div
        className="col"
        style={{
          gap: 6,
          padding: "8px 10px",
          borderBottom: "1px solid var(--border, #e5e5e5)",
        }}
      >
        <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
          <p
            style={{
              fontSize: 11,
              margin: 0,
              color: "#16a34a",
              fontWeight: 600,
              flex: 1,
            }}
          >
            History import complete
          </p>
          <button
            type="button"
            className="btn-icon"
            aria-label="Dismiss"
            title="Dismiss"
            onClick={() => void dismissComplete()}
          >
            ×
          </button>
        </div>
        <p className="muted" style={{ fontSize: 10, margin: 0 }}>
          {status.inserted > 0
            ? `Added ${status.inserted} new bookmark${status.inserted === 1 ? "" : "s"}`
            : "No new bookmarks found"}
          {status.skipped > 0
            ? ` · ${status.skipped} were already on WakeMark`
            : ""}
          {total > 0 ? ` (${total} processed this run)` : ""}
          . Refresh your dashboard — no further action needed.
        </p>
      </div>
    );
  }

  const label =
    status.status === "running"
      ? `Importing… ${status.inserted} new, ${status.skipped} skipped`
      : status.status === "error"
        ? status.error ?? "Import failed"
        : "Import full X bookmark history";

  const hint =
    status.status === "running"
      ? "Keep x.com/i/bookmarks open until auto-scroll stops (~1–5 min). You can switch tabs, but don't close that tab. Status updates here when finished."
      : status.status === "error"
        ? "Fix the issue above, then try again."
        : "Opens x.com/i/bookmarks and uploads your history to WakeMark.";

  return (
    <div
      className="col"
      style={{
        gap: 6,
        padding: "8px 10px",
        borderBottom: "1px solid var(--border, #e5e5e5)",
      }}
    >
      <div className="row" style={{ gap: 6 }}>
        <button
          type="button"
          className="btn btn-primary"
          style={{ fontSize: 11, padding: "6px 10px", flex: 1 }}
          disabled={busy || status.status === "running"}
          onClick={() => void start()}
        >
          {busy || status.status === "running" ? "Importing…" : "Import history"}
        </button>
        {status.status === "running" ? (
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: 11, padding: "6px 8px" }}
            disabled={busy}
            onClick={() => void markDone()}
          >
            Done
          </button>
        ) : null}
      </div>
      <p
        className="muted"
        style={{
          fontSize: 11,
          margin: 0,
          color: status.status === "error" ? "#b91c1c" : undefined,
        }}
      >
        {label}
      </p>
      <p className="muted" style={{ fontSize: 10, margin: 0 }}>
        {hint}
      </p>
    </div>
  );
}
