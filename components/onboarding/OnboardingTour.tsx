"use client";

import { completeOnboarding } from "@/actions/users/onboarding";
import { Button } from "@/components/ui/button";
import {
  CATEGORY_COLORS,
  type BookmarkCategory,
} from "@/config/bookmark-categories";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ListTree,
  MailOpen,
  MessageCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

type Placement = "bottom-start" | "right-start" | "left-end";

// Step order mirrors the product journey: sync → find → curate → digest → ask.
// `target` matches data-onboarding-target attributes in the dashboard UI (a
// step may tag several sibling regions; their boxes are unioned). `placement`
// is the preferred side for the card to hug the highlighted region.
const STEPS = [
  { id: "sync", icon: RefreshCw, placement: "bottom-start" },
  { id: "find", icon: Search, placement: "bottom-start" },
  { id: "lists", icon: ListTree, placement: "right-start" },
  { id: "digests", icon: MailOpen, placement: "right-start" },
  { id: "askAi", icon: MessageCircle, placement: "left-end" },
] as const;

// Example AI tags shown inline in the sync step; reuses the product's own
// category chip colors so the tour matches what users see on the board.
const SAMPLE_TAGS: BookmarkCategory[] = ["Design", "Tech", "Marketing"];

const SPOTLIGHT_PAD = 8; // breathing room around the highlighted region
const CARD_GAP = 12; // distance between the card and the spotlight
const VIEWPORT_MARGIN = 16;

type Box = { top: number; left: number; width: number; height: number };

function unionBox(a: Box, b: Box): Box {
  const top = Math.min(a.top, b.top);
  const left = Math.min(a.left, b.left);
  const right = Math.max(a.left + a.width, b.left + b.width);
  const bottom = Math.max(a.top + a.height, b.top + b.height);
  return { top, left, width: right - left, height: bottom - top };
}

// Union of every visible element tagged for the step. Returns null when the
// target is absent or hidden (e.g. the sidebar sheet on mobile), in which case
// the tour falls back to a centered card over a plain dim.
function readTargetBox(target: string): Box | null {
  let box: Box | null = null;
  document
    .querySelectorAll(`[data-onboarding-target="${target}"]`)
    .forEach((el) => {
      if (typeof el.checkVisibility === "function" && !el.checkVisibility())
        return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const next = { top: r.top, left: r.left, width: r.width, height: r.height };
      box = box ? unionBox(box, next) : next;
    });
  return box;
}

function sameBox(a: Box | null, b: Box | null) {
  if (!a || !b) return a === b;
  return (
    a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height
  );
}

function placeCard(
  box: Box | null,
  card: { width: number; height: number },
  placement: Placement,
  vw: number,
  vh: number
) {
  const m = VIEWPORT_MARGIN;
  const at = (p: Placement) => {
    if (!box)
      return { top: (vh - card.height) / 2, left: (vw - card.width) / 2 };
    if (p === "bottom-start")
      return { top: box.top + box.height + CARD_GAP, left: box.left };
    if (p === "right-start")
      return { top: box.top, left: box.left + box.width + CARD_GAP };
    // left-end: hug the left edge with bottoms aligned.
    return {
      top: box.top + box.height - card.height,
      left: box.left - CARD_GAP - card.width,
    };
  };
  const fits = (pos: { top: number; left: number }) =>
    pos.left >= m &&
    pos.top >= m &&
    pos.left + card.width <= vw - m &&
    pos.top + card.height <= vh - m;

  for (const p of [placement, "bottom-start", "right-start"] as Placement[]) {
    const pos = at(p);
    if (fits(pos)) return pos;
  }
  // Nothing fits outright (tiny viewport): keep the preferred side, clamped.
  const pos = at(placement);
  return {
    top: Math.min(Math.max(m, pos.top), Math.max(m, vh - card.height - m)),
    left: Math.min(Math.max(m, pos.left), Math.max(m, vw - card.width - m)),
  };
}

/**
 * One-time welcome tour for newly registered users. Rendered by the dashboard
 * layout only after X is connected and while `onboardingCompletedAt` is NULL.
 * Email/password signups see Connect X first; the tour starts on the next
 * dashboard load. Each step spotlights the real UI region it describes; every
 * exit path (finish, skip, escape) records completion so the tour never
 * re-opens.
 */
export function OnboardingTour() {
  const t = useTranslations("Onboarding");
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });
  const [glide, setGlide] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const dismiss = () => {
    setOpen(false);
    // Fire-and-forget: a failed write just means the tour shows again once.
    completeOnboarding().catch(() => {});
  };

  const measure = useCallback(() => {
    const next = readTargetBox(current.id);
    setBox((prev) => (sameBox(prev, next) ? prev : next));
  }, [current.id]);

  useEffect(() => setMounted(true), []);

  // Track the target through step changes, scrolling and resizes.
  useLayoutEffect(() => {
    if (!open) return;
    document
      .querySelector(`[data-onboarding-target="${current.id}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, current.id, measure]);

  // Keep the rendered card size known so placement math can clamp correctly.
  useLayoutEffect(() => {
    const node = cardRef.current;
    if (!node) return;
    const width = node.offsetWidth;
    const height = node.offsetHeight;
    setCardSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height }
    );
  }, [step, box, open, mounted]);

  // Glide the spotlight/card right after a step change only, so scroll
  // tracking stays 1:1 afterwards.
  useEffect(() => {
    if (!open) return;
    setGlide(true);
    const id = window.setTimeout(() => setGlide(false), 350);
    return () => window.clearTimeout(id);
  }, [step, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (mounted && open) cardRef.current?.focus();
  }, [mounted, open]);

  if (!mounted || !open) return null;

  const cardPos = placeCard(
    box,
    cardSize,
    current.placement,
    window.innerWidth,
    window.innerHeight
  );
  const glideClass = glide ? "transition-all duration-300 ease-out" : "";

  return (
    <div className="fixed inset-0 z-[60]">
      {box ? (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none fixed rounded-lg border-2 border-foreground/70",
            glideClass
          )}
          style={{
            top: box.top - SPOTLIGHT_PAD,
            left: box.left - SPOTLIGHT_PAD,
            width: box.width + SPOTLIGHT_PAD * 2,
            height: box.height + SPOTLIGHT_PAD * 2,
            // The oversized shadow is the dim layer; the element itself stays
            // transparent so the highlighted region shows through. Same 50%
            // black as the dialog overlay.
            boxShadow: "0 0 0 100000px rgb(0 0 0 / 0.5)",
          }}
        />
      ) : (
        <div aria-hidden className="fixed inset-0 bg-black/50" />
      )}

      <div
        ref={cardRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-tour-title"
        className={cn(
          "fixed flex max-h-[calc(100%-2rem)] w-[min(26rem,calc(100vw-2rem))] flex-col gap-5 overflow-y-auto rounded-xl border bg-popover p-5 text-popover-foreground shadow-lg outline-none sm:p-6",
          glideClass
        )}
        style={{ top: cardPos.top, left: cardPos.left }}
      >
        {/* Progress segments */}
        <div className="flex gap-2" aria-hidden>
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={cn(
                "h-1 flex-1 rounded-full",
                i <= step ? "bg-foreground" : "bg-muted"
              )}
            />
          ))}
        </div>

        <div key={current.id} className="flex flex-col gap-5">
          {/* Header: icon tile + eyebrow + title */}
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
              <current.icon className="size-5 text-foreground" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {t("stepLabel", { step: step + 1, total: STEPS.length })}
              </p>
              <h2
                id="onboarding-tour-title"
                className="font-serif text-2xl font-bold tracking-tight"
              >
                {t(`${current.id}.title`)}
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-base font-medium text-foreground">
              {t(`${current.id}.subtitle`)}
            </p>

            {current.id === "sync" && (
              <>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t("sync.body1")}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t("sync.body2Lead")}{" "}
                  <span className="mx-0.5 inline-flex items-center gap-1 align-baseline">
                    {SAMPLE_TAGS.map((tag) => (
                      <span
                        key={tag}
                        className={cn(
                          "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium text-white",
                          CATEGORY_COLORS[tag].chip
                        )}
                      >
                        {tag}
                      </span>
                    ))}
                  </span>{" "}
                  {t("sync.body2Tail")}
                </p>
              </>
            )}

            {current.id !== "sync" && (
              <p className="text-sm leading-6 text-muted-foreground">
                {t(`${current.id}.body1`)}
              </p>
            )}

            {(current.id === "lists" ||
              current.id === "digests" ||
              current.id === "askAi") && (
              <p className="text-sm leading-6 text-muted-foreground">
                {t(`${current.id}.body2`)}
              </p>
            )}

            {/* Callout */}
            <div className="rounded-md border bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
              <span className="font-medium text-foreground">
                {t(`${current.id}.noteLabel`)}
              </span>{" "}
              {t(`${current.id}.noteBody`)}
            </div>
          </div>
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            className={cn(step === 0 && "invisible")}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <ChevronLeft className="size-4" />
            {t("back")}
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="text-muted-foreground"
              onClick={dismiss}
            >
              {t("skip")}
            </Button>
            <Button onClick={() => (isLast ? dismiss() : setStep((s) => s + 1))}>
              {isLast ? t("finish") : t("next")}
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
