import FeatureBadge from "@/components/shared/FeatureBadge";
import { TruthSocial } from "@/components/social-icons/icons";
import { Button } from "@/components/ui/button";
import { Link as I18nLink } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  SiBluesky,
  SiInstagram,
  SiLinkedin,
  SiReddit,
  SiSubstack,
  SiThreads,
  SiTiktok,
  SiX,
} from "react-icons/si";

function PlatformLogo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span
      title={label}
      aria-label={label}
      className="flex cursor-default items-center justify-center gap-2 text-muted-foreground/50 transition-colors duration-300 hover:text-foreground"
    >
      {children}
    </span>
  );
}

export default function Hero() {
  const t = useTranslations("Landing.Hero");

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex gap-8 pt-16 lg:pt-24 2xl:pt-40 items-center justify-center flex-col">
          <div className="flex flex-col items-center gap-3">
            <FeatureBadge
              label={t("badge.label")}
              text={t("badge.text")}
              href={t("badge.href")}
            />
            <div className="flex gap-4 flex-col max-w-4xl">
              <h1 className="text-center z-10 text-lg font-sans font-semibold md:text-6xl">
                <span className="title-gradient">{t("title")}</span>
              </h1>

              <p className="mx-auto max-w-xl text-base leading-relaxed tracking-tight text-center text-muted-foreground md:text-lg">
                {t("description")}
              </p>
            </div>
          </div>
          <div className="flex w-full max-w-sm flex-col items-center gap-4 px-4">
            <Button
              asChild
              size="lg"
              className="h-11 w-full text-sm font-semibold md:h-12"
            >
              <I18nLink href="/login">{t("cta")}</I18nLink>
            </Button>
            {/* <p className="text-center text-sm text-muted-foreground md:max-w-none md:whitespace-nowrap">
              {t("ctaNote")}
            </p> */}
          </div>

          {/* Upcoming platforms: X is live (centered + highlighted), the rest
              are grayed out and brighten on hover. */}
          <div className="flex w-full flex-col items-center gap-6 px-4 pb-6">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground/70">
              {t("platformsNote")}
            </p>
            <div className="grid w-full max-w-7xl grid-cols-3 items-center gap-y-6 lg:grid-cols-9 lg:gap-y-0">
              <PlatformLogo label="Bluesky">
                <SiBluesky className="h-6 w-6" />
              </PlatformLogo>
              <PlatformLogo label="TikTok">
                <SiTiktok className="h-6 w-6" />
                <span className="hidden text-base font-semibold lg:inline">TikTok</span>
              </PlatformLogo>
              <PlatformLogo label="Threads">
                <SiThreads className="h-6 w-6" />
                <span className="hidden text-base font-medium lg:inline">Threads</span>
              </PlatformLogo>
              <PlatformLogo label="Reddit">
                <SiReddit className="h-6 w-6" />
                <span className="hidden text-base font-semibold lowercase lg:inline">reddit</span>
              </PlatformLogo>

              <span
                title="X"
                aria-label="X"
                className="flex justify-center text-foreground dark:drop-shadow-[0_0_14px_rgba(255,255,255,0.45)]"
              >
                <SiX className="h-7 w-7" />
              </span>

              <PlatformLogo label="LinkedIn">
                <SiLinkedin className="h-6 w-6" />
                <span className="hidden text-base font-semibold lg:inline">LinkedIn</span>
              </PlatformLogo>
              <PlatformLogo label="Instagram">
                <SiInstagram className="h-6 w-6" />
                <span className="hidden text-base font-medium lg:inline">Instagram</span>
              </PlatformLogo>
              <PlatformLogo label="Truth Social">
                <TruthSocial className="h-4 w-auto lg:h-5" />
              </PlatformLogo>
              <PlatformLogo label="Substack">
                <SiSubstack className="h-6 w-6" />
                <span className="hidden text-base font-semibold lg:inline">Substack</span>
              </PlatformLogo>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
