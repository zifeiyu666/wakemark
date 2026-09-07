import { useEffect, useRef } from "react";
import { textOf, useAskAiChat } from "../lib/useAskAiChat";
import { ChatMarkdown } from "./ChatMarkdown";

function TypingDots() {
  return (
    <span className="typing" aria-label="Thinking">
      <span />
      <span />
      <span />
    </span>
  );
}

function SendIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M3.4 20.4 21 12 3.4 3.6 3 10.5l11.2 1.5L3 13.5z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="6" y="6" width="12" height="12" />
    </svg>
  );
}

export function ChatPanel({
  compact = false,
  onOpenSidePanel,
}: {
  compact?: boolean;
  onOpenSidePanel?: () => void;
}) {
  const { messages, input, setInput, status, error, send, stop, clearChat } =
    useAskAiChat();
  const endRef = useRef<HTMLDivElement>(null);
  const streaming = status === "streaming";

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
        <div className="header-title">Ask AI</div>
        <div className="row" style={{ gap: 6 }}>
          {messages.length > 0 && (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: 11, padding: "4px 6px" }}
              disabled={streaming}
              onClick={() => void clearChat()}
            >
              Clear
            </button>
          )}
          {onOpenSidePanel && (
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: 11, padding: "4px 8px" }}
              onClick={onOpenSidePanel}
            >
              Open side panel
            </button>
          )}
        </div>
      </div>

      <div
        className="chat-shell scroll"
        style={{ minHeight: compact ? 140 : 0 }}
      >
        {messages.length === 0 && (
          <p className="chat-empty">
            Ask about your bookmarks — topics, authors, or what you saved.
          </p>
        )}
        {messages.map((m) => {
          const text = textOf(m);
          const isUser = m.role === "user";
          const waiting =
            !isUser &&
            streaming &&
            !text.trim() &&
            m === messages[messages.length - 1];

          return (
            <div
              key={m.id}
              className={`msg-row ${isUser ? "user" : "assistant"}`}
            >
              <div
                className={`msg-bubble ${isUser ? "user" : "assistant"}`}
                style={{ fontSize: compact ? 12 : 12.5 }}
              >
                {waiting ? (
                  <TypingDots />
                ) : isUser ? (
                  text
                ) : (
                  <ChatMarkdown content={text} />
                )}
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

      <form
        className="row"
        onSubmit={(e) => {
          if (streaming) {
            e.preventDefault();
            return;
          }
          void send(e);
        }}
        style={{ flexShrink: 0 }}
      >
        <input
          className="input"
          placeholder="Ask your bookmarks…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={streaming}
        />
        {streaming ? (
          <button
            type="button"
            className="btn btn-primary icon-btn stop-btn"
            aria-label="Stop"
            title="Stop"
            onClick={() => stop()}
          >
            <StopIcon />
          </button>
        ) : (
          <button
            type="submit"
            className="btn btn-primary icon-btn"
            aria-label="Send"
            title="Send"
            disabled={!input.trim()}
          >
            <SendIcon />
          </button>
        )}
      </form>
    </div>
  );
}
