import { Badge } from "@/components/ui/badge";
import { Link as I18nLink } from "@/i18n/routing";
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
  const t = await getTranslations({ locale, namespace: "IntroductionDocs" });

  return constructMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/docs/start/introduction`,
  });
}

export default async function IntroductionDocsPage() {
  const t = await getTranslations("IntroductionDocs");

  const capabilities = [
    "sync",
    "ai",
    "search",
    "lists",
    "digest",
    "import",
    "export",
    "mcp",
  ] as const;

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
        <section id="what" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("what.title")}
          </h2>
          <p>{t("what.p1")}</p>
          <p className="text-muted-foreground">{t("what.p2")}</p>
        </section>

        <section id="capabilities" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("capabilities.title")}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {capabilities.map((key) => (
              <li
                key={key}
                className="rounded-md border bg-muted/30 p-4"
              >
                <p className="font-medium">
                  {t(`capabilities.${key}Title`)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(`capabilities.${key}Body`)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section id="who" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("who.title")}
          </h2>
          <p>{t("who.p1")}</p>
          <p className="text-muted-foreground">{t("who.p2")}</p>
        </section>

        <section id="next" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("next.title")}
          </h2>
          <p className="text-sm">
            <I18nLink
              href="/docs/start/quickstart"
              className="font-medium underline underline-offset-4"
            >
              {t("next.quickstart")}
            </I18nLink>
            <span className="text-muted-foreground"> · </span>
            <I18nLink
              href="/docs/start/import-history"
              className="font-medium underline underline-offset-4"
            >
              {t("next.importHistory")}
            </I18nLink>
          </p>
        </section>
      </div>
    </>
  );
}
