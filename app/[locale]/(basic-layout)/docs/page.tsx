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
  const t = await getTranslations({ locale, namespace: "Docs" });

  return constructMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/docs`,
  });
}

export default async function DocsPage() {
  const t = await getTranslations("Docs");

  return (
    <div className="w-full border-b">
      <article className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <header className="mb-12 space-y-3">
          <Badge variant="secondary">{t("hero.eyebrow")}</Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t("hero.title")}
          </h1>
          <p className="text-muted-foreground">{t("hero.subtitle")}</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <I18nLink
            href="/docs/extension"
            className="rounded-md border bg-muted/40 p-5 transition-colors hover:bg-muted/70"
          >
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {t("items.extension.eyebrow")}
            </p>
            <h2 className="mt-2 text-lg font-semibold">
              {t("items.extension.title")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("items.extension.body")}
            </p>
          </I18nLink>
          <I18nLink
            href="/docs/mcp"
            className="rounded-md border bg-muted/40 p-5 transition-colors hover:bg-muted/70"
          >
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {t("items.mcp.eyebrow")}
            </p>
            <h2 className="mt-2 text-lg font-semibold">{t("items.mcp.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("items.mcp.body")}
            </p>
          </I18nLink>
        </div>
      </article>
    </div>
  );
}
