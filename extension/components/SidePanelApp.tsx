import { revokeAuth } from "../lib/api";
import { SITE_URL } from "../lib/config";
import { useAuth } from "../lib/hooks";
import { useImportHistory } from "../lib/use-import-history";
import { ChatPanel } from "./ChatPanel";
import { ImportHistoryBar } from "./ImportHistoryBar";
import { UserAvatar } from "./UserAvatar";

export function SidePanelApp() {
  const { signedIn, user, loading, refresh } = useAuth();
  const { status: importStatus } = useImportHistory();
  const importActive =
    importStatus.status === "running" ||
    importStatus.status === "error" ||
    (importStatus.status === "done" && !importStatus.dismissed);

  async function handleSignIn() {
    await chrome.runtime.sendMessage({ type: "wakemark:start-login" });
  }

  async function handleSignOut() {
    await revokeAuth();
    await refresh();
  }

  return (
    <div className="shell shell-side col">
      <header className="row" style={{ justifyContent: "space-between" }}>
        <span className="brand">
          {importActive ? "WakeMark Import" : "WakeMark Ask AI"}
        </span>
        <div className="row" style={{ gap: 8 }}>
          <a
            className="brand-link"
            href={`${SITE_URL}/dashboard/bookmarks`}
            target="_blank"
            rel="noreferrer"
          >
            Dashboard
          </a>
          {signedIn ? (
            <>
              <UserAvatar user={user} size={26} />
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: 11, padding: "5px 9px" }}
                onClick={() => void handleSignOut()}
              >
                Sign out
              </button>
            </>
          ) : null}
        </div>
      </header>

      {signedIn ? <ImportHistoryBar signedIn /> : null}

      <hr className="divider" />

      {loading ? (
        <p className="muted">Loading…</p>
      ) : signedIn ? (
        importActive ? (
          <p className="muted" style={{ fontSize: 11, margin: 0 }}>
            {importStatus.status === "running"
              ? "Scrolling your X bookmarks tab in the background. Keep that tab open until import finishes."
              : importStatus.status === "error"
                ? "Fix the error above, then click Import history to try again."
                : "Import finished. Dismiss the banner above when you are done."}
          </p>
        ) : (
          <div style={{ flex: 1, minHeight: 0 }}>
            <ChatPanel />
          </div>
        )
      ) : (
        <div
          className="col"
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <p className="muted" style={{ textAlign: "center", maxWidth: 260 }}>
            Sign in to chat with your WakeMark bookmarks from the side panel.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void handleSignIn()}
          >
            Sign in
          </button>
        </div>
      )}
    </div>
  );
}
