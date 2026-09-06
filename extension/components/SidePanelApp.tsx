import { revokeAuth } from "../lib/api";
import { SITE_URL } from "../lib/config";
import { useAuth } from "../lib/hooks";
import { ChatPanel } from "./ChatPanel";

export function SidePanelApp() {
  const { signedIn, loading } = useAuth();

  async function handleSignIn() {
    await chrome.runtime.sendMessage({ type: "wakemark:start-login" });
  }

  return (
    <div
      className="col"
      style={{
        height: "100vh",
        padding: 14,
        gap: 12,
      }}
    >
      <header
        className="row"
        style={{ justifyContent: "space-between", flexShrink: 0 }}
      >
        <strong style={{ fontSize: 15 }}>WakeMark Ask AI</strong>
        <div className="row">
          <a
            className="muted"
            href={`${SITE_URL}/dashboard/bookmarks`}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 11, textDecoration: "none" }}
          >
            Dashboard
          </a>
          {signedIn ? (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: 11, padding: "4px 8px" }}
              onClick={() => void revokeAuth()}
            >
              Sign out
            </button>
          ) : null}
        </div>
      </header>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : signedIn ? (
        <div style={{ flex: 1, minHeight: 0 }}>
          <ChatPanel />
        </div>
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
