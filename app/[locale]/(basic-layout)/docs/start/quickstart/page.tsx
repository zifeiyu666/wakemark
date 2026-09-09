import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const t = await getTranslations({ locale, namespace: "QuickstartDocs" });

  return constructMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/docs/start/quickstart`,
  });
}

export default async function QuickstartDocsPage() {
  const t = await getTranslations("QuickstartDocs");

  const optionalLinks = [
    { href: "/docs/start/import-history", titleKey: "importTitle", bodyKey: "importBody" },
    { href: "/docs/extension", titleKey: "extensionTitle", bodyKey: "extensionBody" },
    { href: "/docs/start/export", titleKey: "exportTitle", bodyKey: "exportBody" },
    { href: "/docs/mcp", titleKey: "mcpTitle", bodyKey: "mcpBody" },
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
        <section id="overview" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("overview.title")}
          </h2>
          <p>{t("overview.p1")}</p>
        </section>

        <section id="steps" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("steps.title")}
          </h2>
          <ol className="space-y-4">
            {([1, 2, 3, 4] as const).map((n) => (
              <li key={n} className="flex gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {n}
                </span>
                <div>
                  <p className="font-medium">{t(`steps.step${n}Title`)}</p>
                  <p className="text-muted-foreground">
                    {t(`steps.step${n}Body`)}
                  </p>
                  {n === 1 && (
                    <div className="mt-3">
                      <Button asChild>
                        <I18nLink href="/dashboard/bookmarks">
                          {t("steps.cta")}
                        </I18nLink>
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="optional" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("optional.title")}
          </h2>
          <ul className="space-y-3">
            {optionalLinks.map((item) => (
              <li key={item.href}>
                <I18nLink
                  href={item.href}
                  className="block rounded-md border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                >
                  <p className="font-medium">{t(`optional.${item.titleKey}`)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(`optional.${item.bodyKey}`)}
                  </p>
                </I18nLink>
              </li>
            ))}
          </ul>
        </section>

        <section id="tips" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("tips.title")}
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>{t("tips.items.sync")}</li>
            <li>{t("tips.items.tags")}</li>
            <li>{t("tips.items.trial")}</li>
          </ul>
        </section>
      </div>
    </>
  );
}
