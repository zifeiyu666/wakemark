import FeatureBadge from "@/components/shared/FeatureBadge";
import VideoPlayer from "@/components/shared/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Link as I18nLink } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function Hero() {
  const t = useTranslations("Landing.Hero");

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex gap-8 py-16 lg:py-24 2xl:py-40 items-center justify-center flex-col">
          <FeatureBadge
            label={t("badge.label")}
            text={t("badge.text")}
            href={t("badge.href")}
          />
          <div className="flex gap-4 flex-col max-w-3xl">
            <h1 className="text-center z-10 text-lg md:text-7xl font-sans font-bold">
              <span className="title-gradient">{t("title")}</span>
            </h1>

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground text-center">
              {t("description")}
            </p>
          </div>
          <div className="flex w-full max-w-md flex-col items-center gap-4 px-4">
            <Button
              asChild
              size="lg"
              className="h-12 w-full text-base font-semibold md:h-14"
            >
              <I18nLink href="/login">{t("cta")}</I18nLink>
            </Button>
            <p className="text-sm text-muted-foreground">{t("ctaNote")}</p>
          </div>
          <div className="w-full max-w-5xl px-4">
            <VideoPlayer
              fadeBottom
              src={t("video.src")}
              poster={t("video.poster")}
              title={t("video.title")}
              eyebrow={t("video.eyebrow")}
              heading={t.rich("video.heading", {
                accent: (chunks) => (
                  <em className="font-serif italic">{chunks}</em>
                ),
              })}
              description={t("video.description")}
              playLabel={t("video.playLabel")}
              closeLabel={t("video.closeLabel")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
