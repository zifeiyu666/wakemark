"use client";

import { getAskAiSession } from "@/actions/bookmarks/ask-ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Loader2, Search, SendIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// Lazy-loaded to keep the markdown pipeline out of the dashboard bundle
// until the drawer is actually used.
const Markdown = dynamic(() => import("./Markdown"), {
  ssr: false,
  loading: () => (
    <div className="h-4 w-40 animate-pulse rounded bg-foreground/10" />
  ),
});

type Part = { type: string; text?: string; state?: string };
type ChatMessage = {
  id?: string;
  role: "user" | "assistant" | "system";
  parts?: Part[];
};

function textOf(message: ChatMessage): string {
  return (
    message.parts
      ?.filter((p) => p.type === "text")
      .map((p) => p.text ?? "")
      .join("") ?? ""
  );
}

function hasPendingTool(message: ChatMessage): boolean {
  return (
    message.parts?.some(
      (p) =>
        p.type.startsWith("tool-") &&
        p.state !== "output-available" &&
        p.state !== "output-error"
    ) ?? false
  );
}

function TypingDots() {
  return (
    <span className="flex h-4 items-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50" />
    </span>
  );
}

export function AskAiChat({ sessionId }: { sessionId: string }) {
  const t = useTranslations("AskAi");
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/bookmarks/ask-ai",
      // The default body only carries messages; inject the chat session id.
      prepareSendMessagesRequest: ({ messages }) => ({
        body: { messages, sessionId },
      }),
    }),
    onError: (error: any) => {
      let errorMessage = t("error");
      try {
        const parsed = JSON.parse(error.message);
        errorMessage = parsed.error || errorMessage;
      } catch {
        // non-JSON error payload, keep the default message
      }
      toast.error(errorMessage);
    },
  });

  // Restore the persisted transcript for this session on mount.
  useEffect(() => {
    let cancelled = false;
    getAskAiSession(sessionId)
      .then((session) => {
        if (cancelled || !session?.messages.length) return;
        setMessages(
          session.messages.map((m) => ({
            id: m.id,
            role: m.role,
            parts: [{ type: "text" as const, text: m.content }],
          }))
        );
      })
      .catch(() => {
        // History load failed: start with an empty transcript, chat still works.
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, setMessages]);

  const isLoading = status === "streaming" || status === "submitted";

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading || !ready) return;
    setInput("");
    await sendMessage({ text });
  };

  // Auto-scroll to the bottom within the chat viewport
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const last = messages[messages.length - 1] as ChatMessage | undefined;
  const showTyping = isLoading && last?.role === "user";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Messages area */}
      <div ref={viewportRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground/70">{t("emptyTitle")}</p>
              <p className="mt-1 text-sm opacity-70">{t("emptyDescription")}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-2">
            {(messages as ChatMessage[]).map((message, index) => {
              const isUser = message.role === "user";
              const isLast = index === messages.length - 1;
              const streaming = isLoading && isLast && !isUser;
              const text = textOf(message);

              return (
                <div
                  key={message.id ?? index}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      isUser
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-muted"
                    }`}
                  >
                    {isUser ? (
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {text}
                      </div>
                    ) : (
                      <>
                        {text && <Markdown content={text} />}
                        {streaming && text && (
                          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-foreground/60 align-middle" />
                        )}
                        {streaming && !text && (
                          <span className="flex items-center gap-2 py-0.5 text-xs text-muted-foreground">
                            {hasPendingTool(message) ? (
                              <>
                                <Search className="h-3.5 w-3.5 animate-pulse" />
                                {t("searching")}
                              </>
                            ) : (
                              <TypingDots />
                            )}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {showTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
                  <TypingDots />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t("placeholder")}
            disabled={isLoading || !ready}
            className="h-10 flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isLoading || !input.trim() || !ready}
            className="h-10 w-10 shrink-0"
            aria-label={t("placeholder")}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
