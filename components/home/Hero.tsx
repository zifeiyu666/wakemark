import FeatureBadge from "@/components/shared/FeatureBadge";
import { Button } from "@/components/ui/button";
import { Link as I18nLink } from "@/i18n/routing";
import { useTranslations } from "next-intl";

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
            <p className="text-center text-sm text-muted-foreground md:max-w-none md:whitespace-nowrap">
              {t("ctaNote")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
