"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export function CollapsibleBookmarkText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const t = useTranslations("Bookmarks");
  const textRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [text]);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const measure = () => {
      if (expanded) return;
      setOverflows(el.scrollHeight > el.clientHeight + 1);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, expanded]);

  if (!text) return null;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="relative">
        <p
          ref={textRef}
          className={cn(
            "whitespace-pre-wrap text-sm text-foreground",
            !expanded && "max-h-30 overflow-hidden"
          )}
        >
          {text}
        </p>
        {!expanded && overflows && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-background to-transparent"
          />
        )}
      </div>
      {overflows && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex w-fit items-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground active:scale-[0.98]"
        >
          {expanded ? t("card.showLess") : t("card.showMore")}
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
}
