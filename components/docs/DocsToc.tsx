"use client";

import { usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type TocItem = { id: string; title: string };

export function DocsToc() {
  const pathname = usePathname();
  const t = useTranslations("Docs");
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const article = document.querySelector("article.docs-article");
    if (!article) {
      setItems([]);
      return;
    }

    const next = Array.from(article.querySelectorAll("section[id]"))
      .map((section) => {
        const heading = section.querySelector("h2");
        return {
          id: section.id,
          title: heading?.textContent?.trim() ?? "",
        };
      })
      .filter((item) => item.title);

    setItems(next);
    setActiveId(next[0]?.id ?? "");

    if (next.length === 0) return;

    const headings = next
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const id = visible[0]?.target.id;
        if (id) setActiveId(id);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [pathname]);

  if (items.length === 0) return null;

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-52 shrink-0 overflow-y-auto py-10 pl-4 xl:block">
      <p className="mb-3 text-[13px] text-muted-foreground">{t("toc.title")}</p>
      <ul className="space-y-2 border-l border-border">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                "-ml-px block border-l py-0.5 pl-3 text-[13px] transition-colors",
                activeId === item.id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
