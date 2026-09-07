import { revokeAuth } from "../lib/api";
import { SITE_URL } from "../lib/config";
import { useAuth } from "../lib/hooks";
import { ChatPanel } from "./ChatPanel";
import { UserAvatar } from "./UserAvatar";

export function SidePanelApp() {
  const { signedIn, user, loading, refresh } = useAuth();

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
        <span className="brand">WakeMark Ask AI</span>
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

      <hr className="divider" />

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
