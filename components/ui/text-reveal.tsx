"use client"

import {
  useRef,
  type ComponentPropsWithoutRef,
  type FC,
  type ReactNode,
} from "react"
import { motion, MotionValue, useScroll, useTransform } from "motion/react"

import { cn } from "@/lib/utils"

export interface TextRevealProps extends ComponentPropsWithoutRef<"div"> {
  children: string
}

export const TextReveal: FC<TextRevealProps> = ({ children, className }) => {
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
  })

  if (typeof children !== "string") {
    throw new Error("TextReveal: children must be a string")
  }

  // Section is h-[120vh]; progress 0 = white area starts entering the
  // viewport, ≈0.45 = sticky child (100vh) engages. Fade the text in
  // gradually while the white area enters so it never pops in or sits
  // hard-clipped at the viewport bottom, and run the word reveal from the
  // late entry phase through the pinned window.
  const FADE_RANGE: [number, number] = [0.05, 0.4]
  const REVEAL_RANGE: [number, number] = [0.25, 0.8]
  const containerOpacity = useTransform(scrollYProgress, FADE_RANGE, [0, 1])

  const words = children.split(" ")

  return (
    <div ref={sectionRef} className={cn("relative z-0 h-[120vh]", className)}>
      <motion.div
        style={{ opacity: containerOpacity }}
        className={
          "sticky top-0 mx-auto flex h-screen max-w-4xl items-center bg-transparent px-4 py-10"
        }
      >
        <span
          className={
            "flex flex-wrap justify-center gap-y-4 px-5 py-2 text-center text-3xl font-extrabold tracking-tight text-black/20 md:gap-y-6 md:px-8 md:py-4 md:text-4xl lg:px-10 lg:py-6 lg:text-5xl xl:text-6xl dark:text-white/20"
          }
        >
          {words.map((word, i) => {
            const span = (REVEAL_RANGE[1] - REVEAL_RANGE[0]) / words.length
            const start = REVEAL_RANGE[0] + i * span
            const end = start + span
            return (
              <Word key={i} progress={scrollYProgress} range={[start, end]}>
                {word}
              </Word>
            )
          })}
        </span>
      </motion.div>
    </div>
  )
}

interface WordProps {
  children: ReactNode
  progress: MotionValue<number>
  range: [number, number]
}

const Word: FC<WordProps> = ({ children, progress, range }) => {
  const opacity = useTransform(progress, range, [0, 1])
  return (
    <span className="xl:lg-3 relative mx-1 lg:mx-1.5">
      <span className="absolute opacity-30">{children}</span>
      <motion.span
        style={{ opacity: opacity }}
        className={"text-black dark:text-white"}
      >
        {children}
      </motion.span>
    </span>
  )
}
