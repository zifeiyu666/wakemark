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
  const t = await getTranslations({ locale, namespace: "RaycastDocs" });

  return constructMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/docs/raycast`,
  });
}

export default async function RaycastDocsPage() {
  const t = await getTranslations("RaycastDocs");

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
          <ul className="space-y-2 rounded-md border bg-muted/40 p-4">
            <li>{t("overview.points.search")}</li>
            <li>{t("overview.points.ask")}</li>
            <li>{t("overview.points.auth")}</li>
            <li>{t("overview.points.scope")}</li>
          </ul>
        </section>

        <section id="install" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("install.title")}
          </h2>
          <ol className="space-y-4">
            <li className="flex gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                1
              </span>
              <div>
                <p className="font-medium">{t("install.step1Title")}</p>
                <p className="text-muted-foreground">{t("install.step1Body")}</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                2
              </span>
              <div>
                <p className="font-medium">{t("install.step2Title")}</p>
                <p className="text-muted-foreground">{t("install.step2Body")}</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                3
              </span>
              <div>
                <p className="font-medium">{t("install.step3Title")}</p>
                <p className="text-muted-foreground">
                  {t("install.step3Body")}{" "}
                  <I18nLink
                    href="/dashboard/bookmarks"
                    className="font-medium text-foreground underline underline-offset-4"
                  >
                    {t("install.step3Link")}
                  </I18nLink>
                </p>
              </div>
            </li>
          </ol>
        </section>

        <section id="not-included" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("notIncluded.title")}
          </h2>
          <p>{t("notIncluded.p1")}</p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>{t("notIncluded.items.import")}</li>
            <li>{t("notIncluded.items.sidebar")}</li>
            <li>{t("notIncluded.items.sitePing")}</li>
          </ul>
          <p className="text-muted-foreground">
            See the{" "}
            <I18nLink
              href="/docs/extension"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Chrome extension
            </I18nLink>{" "}
            and{" "}
            <I18nLink
              href="/docs/start/import-history"
              className="font-medium text-foreground underline underline-offset-4"
            >
              import history
            </I18nLink>{" "}
            guides.
          </p>
        </section>

        <section id="faq" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("faq.title")}
          </h2>
          <div className="space-y-4">
            <div>
              <p className="font-medium">{t("faq.q1")}</p>
              <p className="text-muted-foreground">{t("faq.a1")}</p>
            </div>
            <div>
              <p className="font-medium">{t("faq.q2")}</p>
              <p className="text-muted-foreground">{t("faq.a2")}</p>
            </div>
            <div>
              <p className="font-medium">{t("faq.q3")}</p>
              <p className="text-muted-foreground">{t("faq.a3")}</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
