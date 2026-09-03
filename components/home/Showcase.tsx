"use client";

import Hero from "@/components/home/Hero";
import ChatAiDemo from "@/components/home/mock-ui/ChatAiDemo";
import DigestDemo from "@/components/home/mock-ui/DigestDemo";
import SyncAutoTagDemo from "@/components/home/mock-ui/SyncAutoTagDemo";
import BrowserFrame from "@/components/shared/BrowserFrame";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import Image from "next/image";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * Attio-style product showcase (replaces the old video tour).
 *
 * Scroll is only a *trigger*, never a scrubber: the whole section is pinned
 * to the viewport, and crossing a small scroll threshold flips `engaged`,
 * which plays a choreographed, time-based sequence to completion —
 *  · engage: the hero copy fades/blurs out in place, the dashboard window
 *    rises a little FIRST, then scales down while the three side demo cards
 *    fade in,
 *  · disengage: every card travels down together FIRST, then the window
 *    scales back up while the side cards fade out.
 * Scrolling back to the top reverses everything.
 */

/** Spring-like deceleration curve shared by every triggered animation. */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Renders children at `scale` without touching their internal DOM sizes:
 * the inner box lays out at 1/scale width and is transform-scaled from the
 * top-left; the outer box height is measured so surrounding layout stays
 * correct.
 */
const ScaleBox = ({
  scale,
  className,
  children,
}: {
  scale: number;
  className?: string;
  children: ReactNode;
}) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const update = () => setHeight(Math.ceil(el.offsetHeight * scale));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scale]);

  return (
    <div className={className} style={{ height }}>
      <div
        ref={innerRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: `${100 / scale}%`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default function Showcase() {
  /* Measure the unscaled center window height so the engaged position can
   * bottom-anchor it (fully visible, attio-style) regardless of viewport. */
  const centerRef = useRef<HTMLDivElement>(null);
  const [centerH, setCenterH] = useState(700);
  useLayoutEffect(() => {
    const el = centerRef.current;
    if (!el) return;
    const update = () => setCenterH(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Which side card is clicked-to-front (topmost stacking). */
  const [front, setFront] = useState<null | "left" | "right" | "dark">(null);

  const sideZIndex = (id: "left" | "right" | "dark") =>
    front === id ? 50 : 20;

  /* Trigger with hysteresis + direction awareness: engage once the user
   * really scrolls down; when scrolling back UP, release early (at ~35% of
   * the viewport) so the reverse animation plays during the pin window
   * instead of freezing until the very top. */
  const [engaged, setEngaged] = useState(false);
  useEffect(() => {
    let prevY = window.scrollY;
    setEngaged(prevY > 48);
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - prevY;
      prevY = y;
      if (dy === 0) return;
      const upRelease = window.innerHeight * 0.35;
      setEngaged((prev) => (dy > 0 ? prev || y > 48 : prev && y > upRelease));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Choreography: travel leads, scale/fade follows — but the second phase
   * starts while the first is still in its deceleration tail, so the two
   * segments overlap into one continuous motion (no perceptible hold).
   * engage  → center rises, then shrinks while sides fade in.
   * disengage → everything drops to the bottom together, then the center
   *             scales back up while sides fade out. */
  const centerTransition = {
    y: { duration: 0.6, ease: EASE },
    scale: { duration: 0.8, ease: EASE, delay: 0.26 },
  };
  const sideTransition = engaged
    ? {
        y: { duration: 0.8, ease: EASE, delay: 0.26 },
        opacity: { duration: 0.6, ease: "easeOut" as const, delay: 0.32 },
        x: { duration: 0.8, ease: EASE, delay: 0.32 },
        scale: { duration: 0.8, ease: EASE, delay: 0.32 },
      }
    : {
        y: { duration: 0.6, ease: EASE },
        opacity: { duration: 0.5, ease: "easeOut" as const, delay: 0.28 },
        x: { duration: 0.5, ease: "easeOut" as const, delay: 0.28 },
        scale: { duration: 0.5, ease: "easeOut" as const, delay: 0.28 },
      };

  return (
    <section id="showcase" className="relative h-[140vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Attio-style backdrop: light-blue field with white pinstripes,
            always rendered so a hint of blue shows even at the top. */}
        <div aria-hidden className="showcase-stripes absolute inset-0" />
        {/* Hero copy: pinned in place, fades/blurs out on engage */}
        <motion.div
          animate={{
            opacity: engaged ? 0 : 1,
            filter: engaged ? "blur(14px)" : "blur(0px)",
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn(
            "absolute inset-x-0 top-0 z-30",
            engaged && "pointer-events-none"
          )}
        >
          <Hero />
        </motion.div>

        {/* Left top — Email Digest */}
        <motion.div
          aria-hidden
          initial={false}
          animate={{
            opacity: engaged ? 1 : 0,
            x: engaged ? 0 : -72,
            y: engaged ? 0 : "26vh",
            scale: engaged ? 1 : 0.92,
          }}
          transition={sideTransition}
          onPointerDown={() => setFront("left")}
          className={cn(
            "absolute left-[6%] top-[12%] hidden w-[280px] cursor-pointer xl:block",
            !engaged && "pointer-events-none"
          )}
          style={{ zIndex: sideZIndex("left") }}
        >
          <BrowserFrame compact url="app.wakemark.com/digests">
            <ScaleBox scale={0.5}>
              <DigestDemo />
            </ScaleBox>
          </BrowserFrame>
        </motion.div>

        {/* Right — Sync + Auto Tag */}
        <motion.div
          aria-hidden
          initial={false}
          animate={{
            opacity: engaged ? 1 : 0,
            x: engaged ? 0 : 72,
            y: engaged ? 0 : "26vh",
            scale: engaged ? 1 : 0.92,
          }}
          transition={sideTransition}
          onPointerDown={() => setFront("right")}
          className={cn(
            "absolute right-[6%] top-[30%] hidden w-[280px] cursor-pointer xl:block",
            !engaged && "pointer-events-none"
          )}
          style={{ zIndex: sideZIndex("right") }}
        >
          <BrowserFrame compact url="app.wakemark.com/bookmarks">
            <ScaleBox scale={0.5}>
              <SyncAutoTagDemo />
            </ScaleBox>
          </BrowserFrame>
        </motion.div>

        {/* Center — the large dashboard screenshot window */}
        <div className="absolute inset-x-0 top-0 flex justify-center px-4">
          <motion.div
            ref={centerRef}
            initial={false}
            animate={{
              /* Engaged: bottom-anchored with a 110px bottom padding so the
               * whole window stays visible; disengaged: peek near the fold. */
              y: engaged
                ? `calc(100vh - 110px - ${Math.round(centerH * 0.78)}px)`
                : "72vh",
              scale: engaged ? 0.78 : 1,
            }}
            transition={centerTransition}
            className="z-10 w-[min(1080px,92vw)] origin-top"
          >
            <BrowserFrame url="app.wakemark.com">
              <Image
                src="/dashboard_screenshot.avif"
                alt="WakeMark dashboard preview"
                width={2482}
                height={1494}
                className="block h-auto w-full"
              />
            </BrowserFrame>
          </motion.div>
        </div>

        {/* Left bottom — Chat AI, forced dark (in front of the center window) */}
        <motion.div
          aria-hidden
          initial={false}
          animate={{
            opacity: engaged ? 1 : 0,
            x: engaged ? 0 : -72,
            y: engaged ? 0 : "26vh",
            scale: engaged ? 1 : 0.92,
          }}
          transition={sideTransition}
          onPointerDown={() => setFront("dark")}
          className={cn(
            "absolute left-[8%] top-[54%] hidden w-[280px] cursor-pointer xl:block",
            !engaged && "pointer-events-none"
          )}
          style={{ zIndex: sideZIndex("dark") }}
        >
          <BrowserFrame compact dark url="app.wakemark.com/ask">
            <ScaleBox scale={0.5}>
              <ChatAiDemo />
            </ScaleBox>
          </BrowserFrame>
        </motion.div>
      </div>
    </section>
  );
}
