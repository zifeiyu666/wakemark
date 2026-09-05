"use client";

import { cn } from "@/lib/utils";
import { ArrowDown, Search } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * Mock UI Animation — "Search + Filter" demo.
 *
 * Loop: empty input → query is typed with a typewriter effect → filtered
 * results cascade in one by one from top to bottom (fade + slide) → hold →
 * the whole list fades out and the loop restarts.
 *
 * Enter/exit are pure CSS keyframe animations (transform/opacity only, see
 * `sf-item-in` / `sf-list-out` in globals.css) so they stay silky on the
 * compositor thread; the typewriter is just discrete state steps. The
 * results area has a fixed height, so the card layout never shifts.
 */

const QUERY = "tokenization LLM";

type Phase = "idle" | "typing" | "results" | "exit";

type ResultSpec = {
  handle: string;
  avatarSrc: string;
  time: string;
  text: string;
  highlighted?: boolean;
};

const RESULTS: ResultSpec[] = [
  {
    handle: "@karpathy",
    avatarSrc: "/images/x-avatar/karpathy.jpg",
    time: "2d",
    text: "Tokenization is the unsung bottleneck. BPE smashes rare words into junk pieces, so the LLM never sees the whole token — that's why spelling and weird identifiers fall apart.",
    highlighted: true,
  },
  {
    handle: "@swyx",
    avatarSrc: "/images/x-avatar/swyx.jpg",
    time: "5d",
    text: "If you chunk on tokens, retrieval misses the phrase you actually bookmarked. Chunk on meaning, not tokens, or your RAG will gaslight you.",
  },
  {
    handle: "@elonmusk",
    avatarSrc: "/images/x-avatar/elonmusk.jpg",
    time: "1w",
    text: "True AGI requires reasoning directly on continuous reality, not just token-prediction over discrete text. Compute efficiency and real-time grounding will separate the survivors from the hype.",
  },
];

const CHIPS = ["AI", "Design", "Dev", "Business"] as const;

/** Stagger between consecutive result rows, in ms. */
const ROW_STAGGER = 140;

export default function SearchFilterDemo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    if (phase === "idle") {
      const t = setTimeout(() => setPhase("typing"), 900);
      return () => clearTimeout(t);
    }
    if (phase === "typing") {
      if (typed < QUERY.length) {
        const t = setTimeout(
          () => setTyped((n) => n + 1),
          70 + Math.random() * 60
        );
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("results"), 350);
      return () => clearTimeout(t);
    }
    if (phase === "results") {
      const t = setTimeout(() => setPhase("exit"), 3800);
      return () => clearTimeout(t);
    }
    // exit: let the fade-out finish, then reset the loop
    const t = setTimeout(() => {
      setTyped(0);
      setPhase("idle");
    }, 500);
    return () => clearTimeout(t);
  }, [phase, typed]);

  const showResults = phase === "results" || phase === "exit";
  const exiting = phase === "exit";

  return (
      <div className="w-full overflow-hidden bg-card">
        {/* Search bar + sort + filter chips */}
        <div className="border-b bg-muted/40 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border bg-card px-3">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm text-foreground/90">
                {QUERY.slice(0, typed)}
              </span>
              <span
                aria-hidden
                className="h-4 w-px shrink-0 animate-sf-caret bg-foreground/70 motion-reduce:animate-none"
              />
            </div>
            <span className="flex h-9 shrink-0 items-center gap-1.5 rounded-md border bg-card px-3 text-xs font-medium text-muted-foreground">
              <ArrowDown className="h-3 w-3" />
              Newest
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            {CHIPS.map((chip) => {
              const active = chip === "AI" && showResults;
              return (
                <span
                  key={chip}
                  className={cn(
                    "flex items-center rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors duration-300",
                    active
                      ? "border-transparent bg-[#d24b8f] text-white"
                      : "border-border bg-card text-muted-foreground"
                  )}
                >
                  {chip === "AI" && (
                    <span
                      aria-hidden
                      className={cn(
                        "h-1 rounded-full bg-white transition-all duration-300",
                        active ? "mr-1.5 w-1 opacity-100" : "mr-0 w-0 opacity-0"
                      )}
                    />
                  )}
                  {chip}
                </span>
              );
            })}
          </div>
        </div>

        {/* Results: fixed-height area so the card never shifts */}
        <div className="h-[237px] overflow-hidden">
          {showResults && (
            <div
              className={cn(
                exiting && "animate-sf-list-out motion-reduce:animate-none"
              )}
            >
              {RESULTS.map((result, i) => (
                <div
                  key={result.handle}
                  className={cn(
                    "animate-sf-item-in border-b px-4 py-3 sm:px-5 motion-reduce:animate-none",
                    result.highlighted && "bg-muted/40"
                  )}
                  style={{ animationDelay: `${i * ROW_STAGGER}ms` }}
                >
                  <div className="flex items-center gap-2.5">
                    <Image
                      src={result.avatarSrc}
                      alt={result.handle}
                      width={28}
                      height={28}
                      className="h-7 w-7 shrink-0 rounded-full object-cover"
                    />
                    <span className="truncate text-sm font-semibold">
                      {result.handle}
                    </span>
                    <span className="shrink-0 rounded-sm bg-[#d24b8f] px-2 py-0.5 text-[10px] font-medium text-white">
                      AI
                    </span>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {result.time}
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-sm text-foreground/90">
                    {result.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer result count */}
        <div className="flex h-11 items-center justify-center border-t px-4 text-xs text-muted-foreground">
          {showResults && (
            <span
              className={cn(
                exiting && "animate-sf-list-out motion-reduce:animate-none"
              )}
            >
              <span
                className="animate-sf-item-in motion-reduce:animate-none"
                style={{
                  animationDelay: `${RESULTS.length * ROW_STAGGER + 80}ms`,
                }}
              >
                3 results for "{QUERY}"
              </span>
            </span>
          )}
        </div>
      </div>
  );
}
