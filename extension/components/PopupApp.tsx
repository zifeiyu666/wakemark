import { useState } from "react";
import { revokeAuth } from "../lib/api";
import { SITE_URL } from "../lib/config";
import { useAuth } from "../lib/hooks";
import { ChatPanel } from "./ChatPanel";
import { SearchPanel } from "./SearchPanel";
import { UserAvatar } from "./UserAvatar";

type Tab = "search" | "chat";

export function PopupApp() {
  const { signedIn, user, loading, refresh } = useAuth();
  const [tab, setTab] = useState<Tab>("search");
  const [signingIn, setSigningIn] = useState(false);

  async function handleSignIn() {
    setSigningIn(true);
    try {
      await chrome.runtime.sendMessage({ type: "wakemark:start-login" });
    } finally {
      setSigningIn(false);
    }
  }

  async function handleSignOut() {
    await revokeAuth();
    await refresh();
  }

  async function openSidePanel() {
    const [active] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (active?.windowId == null) return;
    await chrome.sidePanel.open({ windowId: active.windowId });
    window.close();
  }

  return (
    <div className="shell shell-popup col">
      <header className="row" style={{ justifyContent: "space-between" }}>
        <div className="row" style={{ gap: 8 }}>
          <span className="brand">WakeMark</span>
          <a
            className="brand-link"
            href={SITE_URL}
            target="_blank"
            rel="noreferrer"
          >
            open app
          </a>
        </div>
        <div className="row" style={{ gap: 8 }}>
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
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: 11, padding: "5px 11px" }}
              disabled={signingIn || loading}
              onClick={() => void handleSignIn()}
            >
              {signingIn ? "Opening…" : "Sign in"}
            </button>
          )}
        </div>
      </header>

      <div className="tabs">
        {(["search", "chat"] as Tab[]).map((id) => (
          <button
            key={id}
            type="button"
            className={`tab ${tab === id ? "active" : ""}`}
            onClick={() => setTab(id)}
          >
            {id === "search" ? "Search" : "Ask AI"}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        {tab === "search" ? (
          <SearchPanel enabled={signedIn} />
        ) : signedIn ? (
          <ChatPanel compact onOpenSidePanel={() => void openSidePanel()} />
        ) : (
          <div
            className="col"
            style={{
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <p className="muted" style={{ textAlign: "center", maxWidth: 220 }}>
              Sign in to ask AI about your bookmarks.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              disabled={signingIn}
              onClick={() => void handleSignIn()}
            >
              Sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
