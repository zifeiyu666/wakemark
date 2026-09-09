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

const DOC_CARDS = [
  { href: "/docs/start/introduction", itemKey: "introduction" },
  { href: "/docs/start/quickstart", itemKey: "quickstart" },
  { href: "/docs/start/import-history", itemKey: "importHistory" },
  { href: "/docs/start/export", itemKey: "export" },
  { href: "/docs/start/notion", itemKey: "notion" },
  { href: "/docs/mcp", itemKey: "mcp" },
  { href: "/docs/extension", itemKey: "extension" },
  { href: "/docs/raycast", itemKey: "raycast" },
] as const;

export default async function DocsPage() {
  const t = await getTranslations("Docs");

  return (
    <>
      <header className="mb-12 space-y-3">
        <Badge variant="secondary">{t("hero.eyebrow")}</Badge>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {t("hero.title")}
        </h1>
        <p className="text-muted-foreground">{t("hero.subtitle")}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {DOC_CARDS.map(({ href, itemKey }) => (
          <I18nLink
            key={href}
            href={href}
            className="rounded-md border bg-muted/40 p-5 transition-colors hover:bg-muted/70"
          >
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {t(`items.${itemKey}.eyebrow`)}
            </p>
            <h2 className="mt-2 text-lg font-semibold">
              {t(`items.${itemKey}.title`)}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(`items.${itemKey}.body`)}
            </p>
          </I18nLink>
        ))}
      </div>
    </>
  );
}
