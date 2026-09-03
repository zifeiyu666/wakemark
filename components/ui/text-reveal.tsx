"use client";

import {
  useRef,
  type ComponentPropsWithoutRef,
  type FC,
  type ReactNode,
} from "react";
import {
  motion,
  MotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import { cn } from "@/lib/utils";

export interface TextRevealProps extends ComponentPropsWithoutRef<"div"> {
  backgroundClassName?: string;
  children: string;
}

export const TextReveal: FC<TextRevealProps> = ({
  backgroundClassName,
  children,
  className,
}) => {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  if (typeof children !== "string") {
    throw new Error("TextReveal: children must be a string");
  }

  // The long track gives the sticky viewport enough scroll distance for a
  // deliberate, scrubbed reveal before the page resumes normal movement.
  const REVEAL_RANGE: [number, number] = [0.08, 0.92];
  const words = children.trim().split(/\s+/);

  return (
    <div
      ref={sectionRef}
      className={cn(
        "relative z-0",
        reduceMotion ? "h-[100dvh]" : "h-[260vh]",
        className,
      )}
    >
      <div className="sticky top-0 isolate h-[100dvh] overflow-hidden bg-white dark:bg-black">
        {backgroundClassName && (
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 z-0",
              backgroundClassName,
            )}
          />
        )}
        <span
          className={
            "relative z-10 mx-auto flex h-full max-w-4xl flex-wrap content-center justify-center gap-y-4 px-5 py-10 text-center text-3xl font-extrabold tracking-tight text-black/20 md:gap-y-6 md:px-8 md:text-4xl lg:px-10 lg:text-5xl xl:text-6xl dark:text-white/20"
          }
        >
          {words.map((word, i) => {
            const span = (REVEAL_RANGE[1] - REVEAL_RANGE[0]) / words.length;
            const start = REVEAL_RANGE[0] + i * span;
            const end = start + span;
            return (
              <Word
                key={i}
                progress={scrollYProgress}
                range={[start, end]}
                reducedMotion={reduceMotion}
              >
                {word}
              </Word>
            );
          })}
        </span>
      </div>
    </div>
  );
};

interface WordProps {
  children: ReactNode;
  progress: MotionValue<number>;
  range: [number, number];
  reducedMotion: boolean | null;
}

const Word: FC<WordProps> = ({ children, progress, range, reducedMotion }) => {
  const opacity = useTransform(progress, range, [0, 1]);
  return (
    <span className="xl:lg-3 relative mx-1 lg:mx-1.5">
      <span aria-hidden className="absolute text-black/30 dark:text-white/30">
        {children}
      </span>
      <motion.span
        style={{ opacity: reducedMotion ? 1 : opacity }}
        className={"text-black dark:text-white"}
      >
        {children}
      </motion.span>
    </span>
  );
};
