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
  const t = await getTranslations({ locale, namespace: "ExportDocs" });

  return constructMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/docs/start/export`,
  });
}

export default async function ExportDocsPage() {
  const t = await getTranslations("ExportDocs");

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
        <section id="why" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("why.title")}
          </h2>
          <p>{t("why.p1")}</p>
          <p className="text-muted-foreground">{t("why.p2")}</p>
        </section>

        <section id="formats" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("formats.title")}
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">{t("formats.markdownTitle")}</h3>
              <p className="text-muted-foreground">{t("formats.markdownBody")}</p>
            </div>
            <div>
              <h3 className="font-medium">{t("formats.jsonTitle")}</h3>
              <p className="text-muted-foreground">{t("formats.jsonBody")}</p>
            </div>
            <div>
              <h3 className="font-medium">{t("formats.csvTitle")}</h3>
              <p className="text-muted-foreground">{t("formats.csvBody")}</p>
            </div>
          </div>
        </section>

        <section id="how" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("how.title")}
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
            <li>{t("how.step1")}</li>
            <li>{t("how.step2")}</li>
            <li>{t("how.step3")}</li>
          </ol>
        </section>
      </div>
    </>
  );
}
