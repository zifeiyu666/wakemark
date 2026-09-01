import type { DigestDetail } from "@/actions/digests";
import { CATEGORY_COLORS } from "@/config/bookmark-categories";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { formatWeekKeyLong } from "./format";

function SectionRule({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-6">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

export function DigestViewer({ digest }: { digest: DigestDetail }) {
  const t = useTranslations("Digests");
  let itemIndex = 0;

  return (
    <div className="min-w-0 flex-1 overflow-y-auto bg-muted/40">
      <div className="mx-auto max-w-3xl px-6 py-10 md:px-10">
        {/* Date masthead */}
        <div className="flex items-center gap-6">
          <div className="h-px flex-1 bg-foreground/70" />
          <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {formatWeekKeyLong(digest.weekKey)}
          </span>
          <div className="h-px flex-1 bg-foreground/70" />
        </div>

        {/* Stats */}
        <div className="mt-10 flex items-stretch justify-center">
          <div className="px-10 text-center">
            <p className="font-serif text-3xl font-bold">{digest.highlightCount}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              {t("highlightsStat")}
            </p>
          </div>
          <div className="w-px bg-border" />
          <div className="px-10 text-center">
            <p className="font-serif text-3xl font-bold">{digest.bookmarkCount}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              {t("bookmarksStat")}
            </p>
          </div>
        </div>

        {/* Global overview */}
        {digest.overview && (
          <p className="mx-auto mt-12 max-w-2xl text-center font-serif text-xl leading-8">
            {digest.overview}
          </p>
        )}

        {/* Highlights */}
        {digest.content.highlightGroups.length > 0 && (
          <div className="mt-16 space-y-12">
            <SectionRule label={t("yourHighlights")} />
            {digest.content.highlightGroups.map((group) => (
              <section key={group.category}>
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 ${
                      CATEGORY_COLORS[
                        group.category as keyof typeof CATEGORY_COLORS
                      ]?.chip ?? "bg-muted-foreground"
                    }`}
                  />
                  <h2 className="font-serif text-2xl font-bold tracking-tight">
                    {group.category}
                  </h2>
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-sm text-muted-foreground">
                    {group.items.length === 1
                      ? t("highlightCountOne")
                      : t("highlightCount", { count: group.items.length })}
                  </span>
                </div>

                <div className="mt-8 space-y-10">
                  {group.items.map((item) => {
                    itemIndex += 1;
                    const number = String(itemIndex).padStart(2, "0");
                    const tweetUrl = item.authorUsername
                      ? `https://x.com/${item.authorUsername}/status/${item.tweetId}`
                      : `https://x.com/i/web/status/${item.tweetId}`;
                    return (
                      <article key={item.tweetId} className="flex gap-5">
                        <span className="w-10 shrink-0 font-serif text-2xl font-bold text-foreground/20">
                          {number}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {item.authorProfileImageUrl ? (
                              <Image
                                src={item.authorProfileImageUrl}
                                alt={item.authorName ?? item.authorUsername ?? "avatar"}
                                width={24}
                                height={24}
                                className="size-6 rounded"
                              />
                            ) : null}
                            <span className="text-sm font-semibold">
                              {item.authorName || item.authorUsername || "—"}
                            </span>
                            {item.authorUsername && (
                              <span className="text-xs text-muted-foreground">
                                @{item.authorUsername}
                              </span>
                            )}
                          </div>
                          <p className="mt-3 text-sm leading-6">{item.summary}</p>
                          <a
                            href={tweetUrl}
                            target="_blank"
                            rel="noreferrer nofollow noopener"
                            className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
                          >
                            {t("readOnX")}
                            <ArrowUpRight className="size-3" />
                          </a>
                          {item.insight && (
                            <p className="mt-4 border-l-2 border-border pl-3 font-serif text-sm italic leading-6 text-muted-foreground">
                              {item.insight}
                            </p>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Also bookmarked */}
        {digest.content.alsoBookmarked.length > 0 && (
          <div className="mt-16">
            <SectionRule label={t("alsoBookmarked")} />
            <div className="mt-6">
              {digest.content.alsoBookmarked.map((row) => (
                <div
                  key={row.tweetId}
                  className="flex items-baseline gap-6 border-t border-border py-3 first:border-t-0"
                >
                  <span className="w-32 shrink-0 truncate text-sm font-semibold">
                    @{row.authorUsername || "unknown"}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                    {row.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
