"use client";

import { Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Mock UI Animation — "Chat AI" demo.
 *
 * A fully programmatic product demo of the ask-your-bookmarks chat panel:
 * the question is typed into the input, sent as a user bubble, a loading
 * bubble with pulsing dots shows, then the answer plus a source citation
 * chip appear — holding, fading out, and looping forever.
 *
 * Entrance/exit reuse the shared CSS keyframes (`sf-item-in` /
 * `sf-list-out` / `sf-caret` in globals.css), so everything runs on
 * transform/opacity only. The message area is a fixed-height window, so
 * the card layout never shifts.
 */

const QUESTION = "What did @karpathy say about tokenization?";
const ANSWER =
  "He explained how BPE tokenizers fragment rare words, causing downstream errors in LLMs.";
const SOURCE_HANDLE = "@karpathy";
const SOURCE_SNIPPET = "Tokenization is at the heart...";

type Phase = "idle" | "typing" | "sent" | "loading" | "answer" | "exit";

export default function ChatAiDemo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    if (phase === "idle") {
      const t = setTimeout(() => setPhase("typing"), 900);
      return () => clearTimeout(t);
    }
    if (phase === "typing") {
      if (typed < QUESTION.length) {
        const t = setTimeout(
          () => setTyped((n) => n + 1),
          45 + Math.random() * 40
        );
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("sent"), 400);
      return () => clearTimeout(t);
    }
    if (phase === "sent") {
      const t = setTimeout(() => setPhase("loading"), 600);
      return () => clearTimeout(t);
    }
    if (phase === "loading") {
      const t = setTimeout(() => setPhase("answer"), 1500);
      return () => clearTimeout(t);
    }
    if (phase === "answer") {
      const t = setTimeout(() => setPhase("exit"), 4000);
      return () => clearTimeout(t);
    }
    // exit: let the fade-out finish, then reset the loop
    const t = setTimeout(() => {
      setTyped(0);
      setPhase("idle");
    }, 500);
    return () => clearTimeout(t);
  }, [phase, typed]);

  const showQuestion =
    phase === "sent" ||
    phase === "loading" ||
    phase === "answer" ||
    phase === "exit";
  const showLoading = phase === "loading";
  const showAnswer = phase === "answer" || phase === "exit";
  const exiting = phase === "exit";

  return (
    <div className="w-full overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Header: panel title + new chat / close affordances */}
      <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5">
        <span className="font-serif text-base font-semibold">
          Ask your bookmarks
        </span>
        <div className="flex items-center gap-2.5">
          <span className="rounded-md border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
            New chat
          </span>
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>

      {/* Messages: fixed-height area so the card never shifts */}
      <div className="flex h-[300px] flex-col gap-3 overflow-hidden px-4 py-4 sm:px-5">
        <div
          className={cn(
            "flex flex-1 flex-col gap-3 overflow-hidden",
            exiting && "animate-sf-list-out motion-reduce:animate-none"
          )}
        >
          {showQuestion && (
            <div className="ml-auto w-fit max-w-[85%] rounded-xl bg-foreground px-4 py-2.5 text-sm text-background animate-sf-item-in motion-reduce:animate-none">
              {QUESTION}
            </div>
          )}

          {showLoading && (
            <div className="flex w-fit items-center gap-1.5 rounded-xl bg-muted px-4 py-3.5 animate-sf-item-in motion-reduce:animate-none">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground motion-reduce:animate-none"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </div>
          )}

          {showAnswer && (
            <>
              <div className="w-fit max-w-[85%] rounded-xl bg-muted px-4 py-3 text-sm text-foreground animate-sf-item-in motion-reduce:animate-none">
                {ANSWER}
              </div>
              <div
                className="flex w-fit items-center gap-2 rounded-lg border bg-card px-3 py-2 animate-sf-item-in motion-reduce:animate-none"
                style={{ animationDelay: "150ms" }}
              >
                <span className="h-6 w-6 shrink-0 rounded-full bg-muted" />
                <span className="text-xs font-semibold">{SOURCE_HANDLE}</span>
                <span className="max-w-[180px] truncate text-xs text-muted-foreground">
                  {SOURCE_SNIPPET}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer: question input + send button */}
      <div className="flex items-center gap-2 border-t px-4 py-3 sm:px-5">
        <div className="flex h-10 min-w-0 flex-1 items-center rounded-md border bg-card px-3 text-sm">
          {phase === "typing" ? (
            <>
              <span className="truncate text-foreground/90">
                {QUESTION.slice(0, typed)}
              </span>
              <span
                aria-hidden
                className="h-4 w-px shrink-0 animate-sf-caret bg-foreground/70 motion-reduce:animate-none"
              />
            </>
          ) : (
            <span className="truncate text-muted-foreground">
              Ask a question...
            </span>
          )}
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
          <Send className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}
