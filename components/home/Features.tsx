"use client";

import ChatAiDemo from "@/components/home/mock-ui/ChatAiDemo";
import DigestDemo from "@/components/home/mock-ui/DigestDemo";
import McpBeamDemo from "@/components/home/mock-ui/McpBeamDemo";
import SearchFilterDemo from "@/components/home/mock-ui/SearchFilterDemo";
import SyncAutoTagDemo from "@/components/home/mock-ui/SyncAutoTagDemo";
import { ImagePreview } from "@/components/shared/ImagePreview";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Feature = {
  badge?: string;
  /** Badge background color (hex), defaults to the brand blue. */
  badgeColor?: string;
  title: string;
  description: string;
  details?: {
    title: string;
    description: string;
  }[];
  images?: string[];
  /**
   * Mock UI Animation form: a programmatically animated demo DOM rendered in
   * place of the image / image carousel.
   */
  mockUi?: ReactNode;
  demoScale?: number;
  demoWidthClassName?: string;
  demoPositionClassName?: string;
  demoTransformOrigin?: "top left" | "top center" | "top right";
};

const ScaleBox = ({
  scale,
  transformOrigin = "top left",
  children,
}: {
  scale: number;
  transformOrigin?: "top left" | "top center" | "top right";
  children: ReactNode;
}) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();

  useLayoutEffect(() => {
    const element = innerRef.current;
    if (!element) return;

    const updateHeight = () =>
      setHeight(Math.ceil(element.offsetHeight * scale));
    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [scale]);

  return (
    <div style={{ height }}>
      <div
        ref={innerRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin,
        }}
      >
        {children}
      </div>
    </div>
  );
};

const FeatureCard = ({ feature }: { feature: Feature }) => {
  return (
    <article className="flex min-h-[100svh] flex-col border-b border-border/70 last:border-b-0">
      <div className="border-b border-border/70 px-6 pb-9 pt-14 sm:px-10 md:px-14 md:pb-10 md:pt-16">
        <div className="max-w-4xl">
          <div className="flex flex-col gap-1 text-2xl font-medium leading-[1.1] tracking-[-0.03em] sm:text-3xl">
            <h3 className="text-foreground">{feature.title}</h3>
            <p className="text-muted-foreground">{feature.description}</p>
          </div>
          {feature.details && (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {feature.details.map((detail) => (
                <div key={detail.title} className="flex items-start gap-3">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{detail.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {detail.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 bg-muted/65 px-6 py-6 sm:px-10 sm:py-10 md:px-14 md:py-14">
        <div className="relative min-h-[430px] w-full overflow-hidden md:min-h-[520px]">
          <Image
            src="/dashboard_screenshot.avif"
            alt=""
            fill
            sizes="(min-width: 80rem) 70rem, 100vw"
            className="feature-backdrop-fade pointer-events-none object-cover object-left-top opacity-90 dark:opacity-30"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent_32%,hsl(var(--muted)/0.16)_58%,hsl(var(--muted)/0.96)_100%)] dark:bg-[linear-gradient(90deg,transparent_28%,hsl(var(--muted)/0.34)_58%,hsl(var(--muted)/0.98)_100%)]" />
          <div
            className={`absolute z-10 ${
              feature.demoWidthClassName ?? "w-[min(86%,620px)]"
            } ${
              feature.demoPositionClassName ??
              "bottom-7 right-7 sm:bottom-10 sm:right-10 md:bottom-14 md:right-14"
            }`}
          >
            {(() => {
              const demo = (
                <div className="w-full overflow-hidden border border-border bg-background">
                  {feature.mockUi ? (
                    feature.mockUi
                  ) : feature.images && feature.images.length > 1 ? (
                    <div className="w-full max-w-full">
                      <Carousel>
                        <CarouselContent>
                          {feature.images.map((image) => (
                            <CarouselItem key={image}>
                              <ImagePreview>
                                <Image
                                  src={image || "/placeholder.svg"}
                                  alt={feature.title}
                                  width={1280}
                                  height={630}
                                  className="rounded-none"
                                />
                              </ImagePreview>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                      </Carousel>
                    </div>
                  ) : (
                    <ImagePreview>
                      <Image
                        src={feature.images?.[0] || "/placeholder.svg"}
                        alt={feature.title}
                        width={1280}
                        height={630}
                        className="rounded-none"
                      />
                    </ImagePreview>
                  )}
                </div>
              );
              const scale = feature.demoScale ?? 1;
              if (scale === 1) return demo;
              return (
                <ScaleBox
                  scale={scale}
                  transformOrigin={feature.demoTransformOrigin}
                >
                  {demo}
                </ScaleBox>
              );
            })()}
          </div>
        </div>
      </div>
    </article>
  );
};

export default function Features() {
  const t = useTranslations("Landing.Features");
  const [activeFeature, setActiveFeature] = useState(0);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);

  const features: Feature[] = [
    {
      badge: "Sync & Auto-Tag",
      title: "Connect once. Organized forever.",
      description:
        "Link your X account in seconds. Wakemark silently syncs new bookmarks and auto-categorizes them by topic—AI, Design, Dev, and beyond.",
      mockUi: <SyncAutoTagDemo />,
      demoScale: 0.68,
      demoPositionClassName:
        "right-4 top-6 sm:right-8 sm:top-8 md:right-10 md:top-10",
      demoTransformOrigin: "top right",
    },
    {
      badge: "Search & Filter",
      badgeColor: "#3ba272",
      title: "Find that bookmark in seconds",
      description:
        "Lightning-fast full-text search across your entire library. Filter by topic, sort by engagement, and find any post without endless scrolling.",
      mockUi: <SearchFilterDemo />,
      demoScale: 0.72,
      demoPositionClassName:
        "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
      demoTransformOrigin: "top center",
    },
    {
      badge: "AI Chat",
      badgeColor: "#d24b8f",
      title: "Chat with your bookmarks.",
      description:
        "Ask anything and get instant, referenced answers straight from your saved posts. Never dig through endless threads again.",
      mockUi: <ChatAiDemo />,
      demoWidthClassName: "w-[min(72%,440px)]",
      demoPositionClassName:
        "right-4 top-6 sm:right-8 sm:top-8 md:right-10 md:top-10",
      demoTransformOrigin: "top right",
    },
    {
      badge: "Email Digest",
      badgeColor: "#ed9124",
      title: "A digest in your inbox, not another app to open.",
      description:
        "AI turns your saved posts into a clean, topic-grouped email—delivered daily or weekly. Catch up on 30 bookmarks before your morning coffee cools.",
      mockUi: <DigestDemo />,
      demoScale: 0.86,
    },
    {
      badge: "MCP Server",
      badgeColor: "#a05cf7",
      title: "Your bookmarks, inside every agent",
      description:
        "WakeMark ships a remote MCP server. Connect Claude Desktop, Claude Code, Cursor, Codex, ChatGPT or VS Code with a single API key — agents can search, read and organize your bookmarks right where you already work.",
      mockUi: <McpBeamDemo />,
    },
    ...t.raw("items"),
  ];

  useEffect(() => {
    const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
    if (!cards.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = cards.indexOf(visible.target as HTMLElement);
        if (index >= 0) setActiveFeature(index);
      },
      { threshold: [0.35, 0.55, 0.75], rootMargin: "-8% 0px -18%" },
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [features.length]);

  return (
    <section id="features" className="pt-20">
      <div className="relative  overflow-hidden px-4 pb-40 pt-16 sm:px-6 lg:px-8">
        <div className="relative z-10 mx-auto max-w-7xl text-center">
          <span className="inline-flex rounded-md bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
            {t("badge.label")}
          </span>
          <div className="mx-auto mt-8 max-w-5xl text-2xl font-medium leading-[1.12] tracking-[-0.035em] sm:text-3xl md:text-4xl">
            <h2 className="text-foreground">{t("title")}</h2>
            <p className="mt-1 text-muted-foreground">{t("description")}</p>
          </div>
        </div>
        <div aria-hidden className="feature-heading-stripes" />
      </div>

      <div className="mx-auto max-w-[1400px] border-y border-border/70 lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="sticky top-12 z-30 border-b border-border/70 bg-background/95 px-4 py-2 backdrop-blur lg:h-[calc(100svh-3rem)] lg:border-b-0 lg:border-r lg:px-0 lg:py-0">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:justify-start lg:gap-0 lg:pt-[240px]">
            {features.map((feature, index) => (
              <button
                key={feature.title}
                type="button"
                onClick={() => {
                  cardRefs.current[index]?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className={`relative shrink-0 px-3 py-1.5 text-left text-sm font-medium transition-colors lg:w-full lg:px-10 lg:py-1.5 lg:text-base ${
                  activeFeature === index
                    ? "text-foreground"
                    : "text-muted-foreground/45 hover:text-muted-foreground"
                }`}
                aria-current={activeFeature === index ? "true" : undefined}
              >
                {activeFeature === index && (
                  <span
                    aria-hidden
                    className="absolute bottom-0 left-0 h-0.5 w-6 lg:bottom-auto lg:-left-px lg:top-1/2 lg:h-8 lg:w-0.5 lg:-translate-y-1/2"
                    style={{ backgroundColor: feature.badgeColor ?? "#4b7be5" }}
                  />
                )}
                {feature.badge ?? feature.title}
              </button>
            ))}
          </nav>
        </aside>
        <div>
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="scroll-mt-12"
              ref={(element) => {
                cardRefs.current[index] = element;
              }}
            >
              <FeatureCard feature={feature} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
