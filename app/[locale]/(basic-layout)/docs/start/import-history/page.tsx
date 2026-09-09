import ChromeInstallButton from "@/components/home/ChromeInstallButton";
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
  const t = await getTranslations({ locale, namespace: "ImportHistoryDocs" });

  return constructMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/docs/start/import-history`,
  });
}

export default async function ImportHistoryDocsPage() {
  const t = await getTranslations("ImportHistoryDocs");

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

        <section id="before" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("before.title")}
          </h2>
          <p>{t("before.p1")}</p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>{t("before.items.chrome")}</li>
            <li>{t("before.items.extension")}</li>
            <li>{t("before.items.signIn")}</li>
            <li>{t("before.items.xSession")}</li>
          </ul>
        </section>

        <section id="steps" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("steps.title")}
          </h2>
          <p>{t("steps.intro")}</p>
          <ol className="space-y-4">
            <li className="flex gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                1
              </span>
              <div>
                <p className="font-medium">{t("steps.step1Title")}</p>
                <p className="text-muted-foreground">{t("steps.step1Body")}</p>
                <div className="mt-3">
                  <ChromeInstallButton
                    label={t("steps.cta")}
                    size="default"
                  />
                </div>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                2
              </span>
              <div>
                <p className="font-medium">{t("steps.step2Title")}</p>
                <p className="text-muted-foreground">{t("steps.step2Body")}</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                3
              </span>
              <div>
                <p className="font-medium">{t("steps.step3Title")}</p>
                <p className="text-muted-foreground">{t("steps.step3Body")}</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                4
              </span>
              <div>
                <p className="font-medium">{t("steps.step4Title")}</p>
                <p className="text-muted-foreground">{t("steps.step4Body")}</p>
              </div>
            </li>
          </ol>
        </section>

        <section id="after" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("after.title")}
          </h2>
          <p>{t("after.p1")}</p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>{t("after.points.refresh")}</li>
            <li>{t("after.points.organize")}</li>
            <li>{t("after.points.search")}</li>
          </ul>
          <p className="text-sm">
            <I18nLink
              href="/dashboard/bookmarks"
              className="font-medium underline underline-offset-4"
            >
              {t("after.dashboard")}
            </I18nLink>
            <span className="text-muted-foreground"> · </span>
            <I18nLink
              href="/docs/extension"
              className="font-medium underline underline-offset-4"
            >
              {t("after.extensionGuide")}
            </I18nLink>
          </p>
        </section>

        <section id="website" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("website.title")}
          </h2>
          <p>{t("website.p1")}</p>
          <p className="text-muted-foreground">{t("website.p2")}</p>
        </section>

        <section id="tips" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("tips.title")}
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>{t("tips.items.sameProfile")}</li>
            <li>{t("tips.items.leaveTab")}</li>
            <li>{t("tips.items.duplicates")}</li>
            <li>{t("tips.items.apiSync")}</li>
          </ul>
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
            <div>
              <p className="font-medium">{t("faq.q4")}</p>
              <p className="text-muted-foreground">{t("faq.a4")}</p>
            </div>
            <div>
              <p className="font-medium">{t("faq.q5")}</p>
              <p className="text-muted-foreground">{t("faq.a5")}</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
