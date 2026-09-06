import { useEffect, useRef } from "react";
import { textOf, useAskAiChat } from "../lib/useAskAiChat";

export function ChatPanel({
  compact = false,
  onOpenSidePanel,
}: {
  compact?: boolean;
  onOpenSidePanel?: () => void;
}) {
  const { messages, input, setInput, status, error, send } = useAskAiChat();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  return (
    <div
      className="col"
      style={{
        gap: 8,
        height: "100%",
        minHeight: compact ? 220 : 0,
      }}
    >
      <div
        className="row"
        style={{ justifyContent: "space-between", flexShrink: 0 }}
      >
        <div style={{ fontWeight: 600 }}>Ask AI</div>
        {onOpenSidePanel && (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ fontSize: 11, padding: "4px 8px" }}
            onClick={onOpenSidePanel}
          >
            Open side panel
          </button>
        )}
      </div>

      <div
        className="scroll"
        style={{
          flex: 1,
          minHeight: compact ? 140 : 0,
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 8,
          background: "var(--surface)",
        }}
      >
        {messages.length === 0 && (
          <p className="muted" style={{ margin: 0 }}>
            Ask about your bookmarks — topics, authors, or what you saved.
          </p>
        )}
        {messages.map((m) => {
          const text = textOf(m);
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              style={{
                marginBottom: 8,
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "92%",
                  padding: "6px 8px",
                  borderRadius: 8,
                  background: isUser ? "var(--accent)" : "var(--bg)",
                  color: isUser ? "var(--accent-fg)" : "var(--fg)",
                  border: isUser ? "none" : "1px solid var(--border)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontSize: compact ? 12 : 13,
                }}
              >
                {text ||
                  (m.role === "assistant" && status === "streaming"
                    ? "…"
                    : "")}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {error && (
        <p className="danger" style={{ margin: 0, fontSize: 12 }}>
          {error}
        </p>
      )}

      <form className="row" onSubmit={send} style={{ flexShrink: 0 }}>
        <input
          className="input"
          placeholder="Ask your bookmarks…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={status === "streaming"}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={status === "streaming" || !input.trim()}
        >
          {status === "streaming" ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
