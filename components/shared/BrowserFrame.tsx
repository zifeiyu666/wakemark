"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * Mac-style browser window chrome, attio-style: a borderless light-gray
 * frame (traffic lights + optional address pill on the gray chrome) with
 * the content inset as its own rounded card.
 *
 * Passing `dark` adds the `.dark` class to the frame root so that every
 * theme-aware token inside (bg-muted, bg-background, dark: variants…)
 * resolves to its dark value — used to force a dark demo card regardless
 * of the site theme.
 */
export default function BrowserFrame({
  children,
  className,
  compact = false,
  dark = false,
  url,
}: {
  children: ReactNode;
  className?: string;
  /** Small-chrome variant so scaled-down side cards match the center
   *  window's on-screen chrome size (dots ~10px, header ~26px). */
  compact?: boolean;
  /** Force dark tokens for the framed content. */
  dark?: boolean;
  /** Optional URL shown in the address pill. */
  url?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden bg-muted",
        compact ? "rounded-xl p-1.5" : "rounded-2xl p-2",
        "shadow-[0_24px_70px_-24px_rgb(0_0_0/0.28)] dark:shadow-[0_24px_70px_-20px_rgb(0_0_0/0.6)]",
        dark && "dark",
        className
      )}
    >
      {/* Title bar: traffic lights + address pill on the gray chrome */}
      <div
        className={cn(
          "flex items-center",
          compact ? "gap-1.5 px-2.5 pb-1.5 pt-1" : "gap-2 px-3 pb-2 pt-1.5"
        )}
      >
        <span
          className={cn(
            "shrink-0 rounded-full bg-[#ff5f57]",
            compact ? "h-2.5 w-2.5" : "h-3 w-3"
          )}
        />
        <span
          className={cn(
            "shrink-0 rounded-full bg-[#febc2e]",
            compact ? "h-2.5 w-2.5" : "h-3 w-3"
          )}
        />
        <span
          className={cn(
            "shrink-0 rounded-full bg-[#28c840]",
            compact ? "h-2.5 w-2.5" : "h-3 w-3"
          )}
        />
        {url && (
          <span
            className={cn(
              "min-w-0 flex-1 truncate bg-background/80 text-muted-foreground",
              compact
                ? "ml-1.5 rounded-md px-2.5 py-0.5 text-[10px]"
                : "ml-2 rounded-md px-3 py-1 text-xs"
            )}
          >
            {url}
          </span>
        )}
      </div>
      {/* Inner content: rounded card inset within the gray frame */}
      <div
        className={cn(
          "overflow-hidden bg-background",
          compact ? "rounded-md" : "rounded-lg"
        )}
      >
        {children}
      </div>
    </div>
  );
}
