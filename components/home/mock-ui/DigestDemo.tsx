"use client";

import { ArrowUpRight, Sparkle } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Mock UI Animation — "Email Digest" demo.
 *
 * A fully programmatic product demo of the digest email: starting from an
 * empty card, the date header, stats, topic section and each highlight row
 * reveal one line at a time — holding, fading out, and looping forever.
 *
 * Every reveal reuses the shared `sf-item-in` keyframe (transform/opacity
 * only, see globals.css), so it runs on the compositor thread. The content
 * lives in a fixed-height overflow-hidden window, so the card never shifts.
 */

/** Total reveal steps; each step shows one more line of the digest. */
const TOTAL_STEPS = 9;

type DigestItem = {
  index: string;
  name: string;
  handle: string;
  avatarClass: string;
  avatarIcon?: boolean;
  text: string;
};

const ITEMS: DigestItem[] = [
  {
    index: "01",
    name: "Claude",
    handle: "@claudeai",
    avatarClass: "bg-gradient-to-br from-orange-400 to-red-600",
    avatarIcon: true,
    text: "BPE tokenizers fragment rare words into subword tokens, causing downstream errors in LLMs that are hard to debug.",
  },
  {
    index: "02",
    name: "AIx",
    handle: "@indie_aix",
    avatarClass: "bg-gradient-to-br from-amber-300 to-yellow-700",
    text: "Context protocol could unify how agents share state across tool boundaries.",
  },
];

export default function DigestDemo() {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (exiting) {
      const t = setTimeout(() => {
        setStep(0);
        setExiting(false);
      }, 500);
      return () => clearTimeout(t);
    }
    if (step < TOTAL_STEPS) {
      const t = setTimeout(() => setStep((n) => n + 1), 550);
      return () => clearTimeout(t);
    }
    // hold the finished digest, then fade out and restart the loop
    const t = setTimeout(() => setExiting(true), 3000);
    return () => clearTimeout(t);
  }, [step, exiting]);

  const show = (n: number) => step >= n;

  return (
    <div className="w-full overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-card">
      <div
        className={cn(
          "flex h-[400px] flex-col gap-4 px-6 py-5",
          exiting && "animate-sf-list-out motion-reduce:animate-none"
        )}
      >
        {/* Date header */}
        {show(1) && (
          <div className="flex items-center gap-4 animate-sf-item-in motion-reduce:animate-none">
            <span className="h-px flex-1 bg-foreground/60" />
            <span className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">
              MONDAY, MARCH 24, 2026
            </span>
            <span className="h-px flex-1 bg-foreground/60" />
          </div>
        )}

        {/* Stats */}
        {show(2) && (
          <div className="flex items-center justify-center gap-8 animate-sf-item-in motion-reduce:animate-none">
            <div className="flex flex-col items-center">
              <span className="font-serif text-3xl font-semibold">8</span>
              <span className="mt-1 text-[10px] font-medium tracking-[0.18em] text-muted-foreground">
                HIGHLIGHTS
              </span>
            </div>
            <span className="h-10 w-px bg-border" />
            <div className="flex flex-col items-center">
              <span className="font-serif text-3xl font-semibold">24</span>
              <span className="mt-1 text-[10px] font-medium tracking-[0.18em] text-muted-foreground">
                BOOKMARKS
              </span>
            </div>
          </div>
        )}

        {/* Topic section header */}
        {show(3) && (
          <div className="flex items-center gap-2.5 animate-sf-item-in motion-reduce:animate-none">
            <span className="h-2.5 w-2.5 bg-blue-600" />
            <span className="font-serif text-lg font-semibold">Tech</span>
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">3 highlights</span>
          </div>
        )}

        {/* Highlight rows: head / text / link reveal one line at a time */}
        <div className="flex flex-col gap-5 overflow-hidden">
          {ITEMS.map((item, i) => {
            const base = 4 + i * 3;
            return (
              <div key={item.index} className="flex gap-3">
                <span className="font-serif text-2xl font-semibold text-indigo-200">
                  {item.index}
                </span>
                <div className="min-w-0 flex-1">
                  {show(base) && (
                    <div className="flex items-center gap-2 animate-sf-item-in motion-reduce:animate-none">
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white",
                          item.avatarClass
                        )}
                      >
                        {item.avatarIcon ? (
                          <Sparkle className="h-3.5 w-3.5" />
                        ) : (
                          <span className="text-[10px] font-semibold">
                            {item.name.slice(0, 1)}
                          </span>
                        )}
                      </span>
                      <span className="truncate text-sm font-semibold">
                        {item.name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {item.handle}
                      </span>
                    </div>
                  )}
                  {show(base + 1) && (
                    <p className="mt-2 text-sm leading-relaxed text-foreground/90 animate-sf-item-in motion-reduce:animate-none">
                      {item.text}
                    </p>
                  )}
                  {show(base + 2) && (
                    <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground animate-sf-item-in motion-reduce:animate-none">
                      READ ON X
                      <ArrowUpRight className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
