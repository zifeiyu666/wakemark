import FeatureBadge from "@/components/shared/FeatureBadge";
import { ImagePreview } from "@/components/shared/ImagePreview";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import SearchFilterDemo from "@/components/home/mock-ui/SearchFilterDemo";
import SyncAutoTagDemo from "@/components/home/mock-ui/SyncAutoTagDemo";
import ChatAiDemo from "@/components/home/mock-ui/ChatAiDemo";
import DigestDemo from "@/components/home/mock-ui/DigestDemo";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import type { ReactNode } from "react";

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
  /** Mirror the layout: visual on the left, copy on the right (desktop). */
  reverse?: boolean;
};

const FeatureCard = ({ feature }: { feature: Feature }) => {
  return (
    <div key={feature.title} className="w-full py-4">
      <div className=" mx-auto">
        <div className="flex flex-col gap-8 px-8 py-4 md:py-8 lg:flex-row lg:items-center lg:justify-between">
          <div
            className={cn(
              "flex min-w-0 gap-10 flex-col lg:w-[45%]",
              feature.reverse && "lg:order-2"
            )}
          >
            <div className="flex gap-4 flex-col">
              {feature.badge && (
                <span
                  className="inline-flex w-fit items-center rounded-md px-3 py-1 text-sm font-medium text-white"
                  style={{ backgroundColor: feature.badgeColor ?? "#4b7be5" }}
                >
                  {feature.badge}
                </span>
              )}
              <div className="flex gap-2 flex-col">
                <h3
                  className={cn(
                    "text-4xl lg:text-6xl tracking-tighter text-left font-regular",
                    feature.badge && "font-serif"
                  )}
                >
                  {feature.title}
                </h3>
                <p className="text-xl leading-relaxed tracking-tight text-muted-foreground text-left">
                  {feature.description}
                </p>
              </div>
            </div>
            <div className="grid lg:pl-6 grid-cols-1 sm:grid-cols-3 items-start lg:grid-cols-1 gap-6">
              {feature.details?.map((detail) => (
                <div
                  key={detail.title}
                  className="flex flex-row gap-6 items-start"
                >
                  <Check className="w-4 h-4 mt-2 text-primary shrink-0" />
                  <div className="flex flex-col gap-1">
                    <p>{detail.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {detail.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div
            className={cn(
              "w-full",
              feature.mockUi ? "lg:w-[42%]" : "rounded-lg border p-2",
              feature.reverse && "lg:order-1"
            )}
          >
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
                            className="rounded-lg"
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
                  className="rounded-lg"
                />
              </ImagePreview>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Features() {
  const t = useTranslations("Landing.Features");

  const features: Feature[] = [
    {
      badge: "Sync + Auto Tag",
      title: "One connection. Every bookmark, tagged.",
      description:
        "Link your X account once. New bookmarks sync automatically and get tagged by topic (AI, Design, Dev, Business) before you even open the app.",
      mockUi: <SyncAutoTagDemo />,
    },
    {
      badge: "Search + Filter",
      badgeColor: "#3ba272",
      reverse: true,
      title: "Find that tweet in seconds",
      description:
        "Full-text search across all your bookmarks. Filter by tag, sort by date or engagement, and find exactly what you're looking for without endless scrolling.",
      mockUi: <SearchFilterDemo />,
    },
    {
      badge: "Chat AI",
      badgeColor: "#d24b8f",
      title: "Your bookmarks have answers",
      description:
        "Ask a question, get an instant answer pulled from your own saved tweets with links back to the original posts. No more digging through hundreds of bookmarks to find that one thread.",
      mockUi: <ChatAiDemo />,
    },
    {
      badge: "Email Digest",
      badgeColor: "#ed9124",
      reverse: true,
      title: "A briefing in your inbox, not another app",
      description:
        "AI reads your bookmarks and distills them into a clean, topic-grouped email delivered daily or weekly. Catch up on 30 saved tweets in the time it takes to drink your coffee.",
      mockUi: <DigestDemo />,
    },
    ...t.raw("items"),
  ];

  return (
    <section id="features" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <FeatureBadge
            label={t("badge.label")}
            text={t("badge.text")}
            className="mb-8"
          />
          <h2 className="text-center z-10 text-lg md:text-5xl font-sans font-semibold mb-4">
            <span className="title-gradient">{t("title")}</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {t("description")}
          </p>
        </div>

        <div className="">
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
