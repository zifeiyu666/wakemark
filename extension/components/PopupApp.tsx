import { useState } from "react";
import { revokeAuth } from "../lib/api";
import { SITE_URL } from "../lib/config";
import { useAuth } from "../lib/hooks";
import { ChatPanel } from "./ChatPanel";
import { SearchPanel } from "./SearchPanel";

type Tab = "search" | "chat";

export function PopupApp() {
  const { signedIn, loading } = useAuth();
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
  }

  function openSidePanel() {
    void chrome.runtime.sendMessage({ type: "wakemark:open-sidepanel" });
  }

  return (
    <div
      className="col"
      style={{
        width: 380,
        height: 520,
        padding: 12,
        gap: 10,
      }}
    >
      <header
        className="row"
        style={{ justifyContent: "space-between", flexShrink: 0 }}
      >
        <div className="row" style={{ gap: 8 }}>
          <strong style={{ fontSize: 14 }}>WakeMark</strong>
          <a
            className="muted"
            href={SITE_URL}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 11, textDecoration: "none" }}
          >
            open app
          </a>
        </div>
        <div className="row">
          {signedIn ? (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: 11, padding: "4px 8px" }}
              onClick={() => void handleSignOut()}
            >
              Sign out
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: 11, padding: "4px 10px" }}
              disabled={signingIn || loading}
              onClick={() => void handleSignIn()}
            >
              {signingIn ? "Opening…" : "Sign in"}
            </button>
          )}
        </div>
      </header>

      <div
        className="row"
        style={{
          flexShrink: 0,
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 2,
          gap: 2,
        }}
      >
        {(["search", "chat"] as Tab[]).map((id) => (
          <button
            key={id}
            type="button"
            className="btn"
            style={{
              flex: 1,
              border: "none",
              background: tab === id ? "var(--accent)" : "transparent",
              color: tab === id ? "var(--accent-fg)" : "var(--fg)",
              padding: "6px 8px",
            }}
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
          <ChatPanel compact onOpenSidePanel={openSidePanel} />
        ) : (
          <div className="col" style={{ paddingTop: 24, alignItems: "center" }}>
            <p className="muted" style={{ textAlign: "center" }}>
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
