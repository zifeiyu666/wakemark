import { Badge } from "@/components/ui/badge";
import { Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Params = Promise<{ locale: string }>;

type MetadataProps = {
  params: Params;
};

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "NotionDocs" });

  return constructMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/docs/start/notion`,
  });
}

export default async function NotionDocsPage() {
  const t = await getTranslations("NotionDocs");

  return (
    <>
      <header className="mb-12 space-y-3">
        <Badge variant="secondary">{t("hero.eyebrow")}</Badge>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {t("hero.title")}
        </h1>
        <p className="text-muted-foreground">{t("hero.subtitle")}</p>
      </header>

      <div className="space-y-12 text-[15px] leading-relaxed">
        <section id="overview" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("overview.title")}
          </h2>
          <p>{t("overview.p1")}</p>
          <p className="text-muted-foreground">{t("overview.p2")}</p>
        </section>

        <section id="setup" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("setup.title")}
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
            <li>{t("setup.step1")}</li>
            <li>{t("setup.step2")}</li>
            <li>{t("setup.step3")}</li>
            <li>{t("setup.step4")}</li>
          </ol>
        </section>

        <section id="manual" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("manual.title")}
          </h2>
          <p className="text-muted-foreground">{t("manual.p1")}</p>
        </section>

        <section id="limits" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("limits.title")}
          </h2>
          <p>{t("limits.p1")}</p>
          <p className="text-muted-foreground">{t("limits.p2")}</p>
        </section>
      </div>
    </>
  );
}
