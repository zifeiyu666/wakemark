"use client";

import { cn } from "@/lib/utils";
import { Send, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Mock UI Animation — "Chat AI" demo.
 *
 * A fully programmatic product demo of the ask-your-bookmarks chat panel:
 * three linked questions are typed, sent, answered with a source citation,
 * then the thread holds, fades out, and loops forever.
 *
 * Entrance/exit reuse the shared CSS keyframes (`sf-item-in` /
 * `sf-list-out` / `sf-caret` in globals.css), so everything runs on
 * transform/opacity only. The message area is a fixed-height window, so
 * the card layout never shifts.
 */

type SourceSpec = {
  handle: string;
  initials: string;
  avatarClass: string;
  avatarSrc?: string;
  snippet: string;
};

type Turn = {
  question: string;
  answer: string;
  source: SourceSpec;
};

const TURNS: Turn[] = [
  {
    question: "What did Karpathy say about tokenization?",
    answer:
      "BPE smashes rare words into fragments, so the model never sees the whole token — that's why spelling and weird identifiers fall apart.",
    source: {
      handle: "@karpathy",
      initials: "AK",
      avatarClass: "from-sky-400 to-blue-700",
      avatarSrc: "/images/x-avatar/karpathy.jpg",
      snippet:
        "Tokenization is the unsung bottleneck. Rare words get smashed into junk pieces.",
    },
  },
  {
    question: "Did he mention a workaround?",
    answer:
      "Byte-level alphabets, and don't split identifiers in code. A smaller vocab just pushes the cost into longer sequences.",
    source: {
      handle: "@karpathy",
      initials: "AK",
      avatarClass: "from-sky-400 to-blue-700",
      avatarSrc: "/images/x-avatar/karpathy.jpg",
      snippet:
        "A 256-byte alphabet is ugly — and it actually works.",
    },
  },
  {
    question: "Anything saved on how this hits RAG?",
    answer:
      "Yes — @swyx's thread: if you chunk on tokens, retrieval misses the phrase you actually bookmarked. Chunk on meaning.",
    source: {
      handle: "@swyx",
      initials: "S",
      avatarClass: "from-violet-400 to-indigo-700",
      avatarSrc: "/images/x-avatar/swyx.jpg",
      snippet:
        "Chunk on meaning, not tokens, or your RAG will gaslight you.",
    },
  },
];

type Phase = "idle" | "typing" | "sent" | "loading" | "answer" | "exit";

function SourceCard({
  source,
  animate,
}: {
  source: SourceSpec;
  animate: boolean;
}) {
  return (
    <div
      className={cn(
        "flex w-[min(100%,20rem)] overflow-hidden rounded-xl border border-border bg-muted/40",
        animate && "animate-sf-item-in motion-reduce:animate-none"
      )}
      style={animate ? { animationDelay: "140ms" } : undefined}
    >
      <span className="w-[3px] shrink-0 bg-gradient-to-b from-sky-400 to-violet-500" />
      <div className="flex min-w-0 flex-1 items-start gap-2.5 px-2.5 py-2">
        {source.avatarSrc ? (
          <Image
            src={source.avatarSrc}
            alt={source.handle}
            width={28}
            height={28}
            className="mt-0.5 h-7 w-7 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            className={cn(
              "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[9px] font-semibold tracking-wide text-white",
              source.avatarClass
            )}
          >
            {source.initials}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[11px] font-semibold leading-none">
              {source.handle}
            </span>
            <span className="rounded-sm bg-foreground/10 px-1 py-px text-[8px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Source
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
            “{source.snippet}”
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ChatAiDemo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [turnIndex, setTurnIndex] = useState(0);
  const [typed, setTyped] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  const question = TURNS[turnIndex].question;

  useEffect(() => {
    if (phase === "idle") {
      const t = setTimeout(() => setPhase("typing"), 800);
      return () => clearTimeout(t);
    }
    if (phase === "typing") {
      if (typed < question.length) {
        const t = setTimeout(
          () => setTyped((n) => n + 1),
          38 + Math.random() * 32
        );
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("sent"), 380);
      return () => clearTimeout(t);
    }
    if (phase === "sent") {
      const t = setTimeout(() => setPhase("loading"), 480);
      return () => clearTimeout(t);
    }
    if (phase === "loading") {
      const t = setTimeout(() => setPhase("answer"), 1200);
      return () => clearTimeout(t);
    }
    if (phase === "answer") {
      const isLast = turnIndex === TURNS.length - 1;
      const t = setTimeout(() => {
        if (isLast) {
          setPhase("exit");
          return;
        }
        setTurnIndex((i) => i + 1);
        setTyped(0);
        setPhase("typing");
      }, isLast ? 3400 : 2100);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setTyped(0);
      setTurnIndex(0);
      setPhase("idle");
    }, 500);
    return () => clearTimeout(t);
  }, [phase, typed, turnIndex, question.length]);

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [phase, turnIndex]);

  const exiting = phase === "exit";

  return (
    <div className="w-full overflow-hidden bg-card">
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

      <div
        ref={viewportRef}
        className="h-[300px] overflow-y-auto overflow-x-hidden px-4 py-4 [scrollbar-width:none] sm:px-5 [&::-webkit-scrollbar]:hidden"
      >
        <div
          className={cn(
            "flex flex-col gap-3",
            exiting && "animate-sf-list-out motion-reduce:animate-none"
          )}
        >
          {TURNS.map((turn, i) => {
            const isCurrent = i === turnIndex;
            const completed = i < turnIndex;
            const showQuestion =
              completed ||
              (isCurrent &&
                (phase === "sent" ||
                  phase === "loading" ||
                  phase === "answer" ||
                  phase === "exit"));
            const showLoading = isCurrent && phase === "loading";
            const showAnswer =
              completed ||
              (isCurrent && (phase === "answer" || phase === "exit"));
            const animate = isCurrent && !completed && !exiting;

            if (!showQuestion && !showLoading && !showAnswer) return null;

            return (
              <div key={turn.question} className="flex flex-col gap-2.5">
                {showQuestion && (
                  <div
                    className={cn(
                      "ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-foreground px-3.5 py-2 text-sm leading-snug text-background",
                      animate && "animate-sf-item-in motion-reduce:animate-none"
                    )}
                  >
                    {turn.question}
                  </div>
                )}

                {showLoading && (
                  <div className="flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-sm bg-muted px-4 py-3 animate-sf-item-in motion-reduce:animate-none">
                    {[0, 1, 2].map((dot) => (
                      <span
                        key={dot}
                        className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground motion-reduce:animate-none"
                        style={{ animationDelay: `${dot * 200}ms` }}
                      />
                    ))}
                  </div>
                )}

                {showAnswer && (
                  <>
                    <div
                      className={cn(
                        "w-fit max-w-[88%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-sm leading-relaxed text-foreground",
                        animate &&
                          "animate-sf-item-in motion-reduce:animate-none"
                      )}
                    >
                      {turn.answer}
                    </div>
                    <SourceCard source={turn.source} animate={animate} />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t px-4 py-3 sm:px-5">
        <div className="flex h-10 min-w-0 flex-1 items-center rounded-md border bg-card px-3 text-sm">
          {phase === "typing" ? (
            <>
              <span className="truncate text-foreground/90">
                {question.slice(0, typed)}
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
