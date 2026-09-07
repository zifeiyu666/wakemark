import ChromeInstallButton from "@/components/home/ChromeInstallButton";
import { ImagePreview } from "@/components/shared/ImagePreview";
import { Badge } from "@/components/ui/badge";
import { Link as I18nLink } from "@/i18n/routing";
import { Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

type Params = Promise<{ locale: string }>;

type MetadataProps = {
  params: Params;
};

const SCREENSHOTS = {
  search: "/images/docs/extension/03-search-popup.png",
  askAi: "/images/docs/extension/02-ask-ai-popup.png",
  sidebar: "/images/docs/extension/01-ask-ai-sidebar.png",
} as const;

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ExtensionDocs" });

  return constructMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/docs/extension`,
    images: [SCREENSHOTS.sidebar.replace(/^\//, "")],
  });
}

function GuideFigure({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption: string;
}) {
  return (
    <figure className="overflow-hidden rounded-md border bg-muted/40">
      <ImagePreview>
        <Image
          src={src}
          alt={alt}
          width={1280}
          height={800}
          className="h-auto w-full"
          sizes="(min-width: 768px) 48rem, 100vw"
        />
      </ImagePreview>
      <figcaption className="border-t px-4 py-2 text-sm text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}

export default async function ExtensionDocsPage() {
  const t = await getTranslations("ExtensionDocs");

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

        <div className="space-y-12 text-[15px] leading-relaxed">
          <section id="overview" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("overview.title")}
            </h2>
            <p>{t("overview.p1")}</p>
            <ul className="space-y-2 rounded-md border bg-muted/40 p-4">
              <li>{t("overview.points.popup")}</li>
              <li>{t("overview.points.sidebar")}</li>
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
                  <p className="text-muted-foreground">
                    {t("install.step1Body")}
                  </p>
                  <div className="mt-3">
                    <ChromeInstallButton
                      label={t("install.cta")}
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
                  <p className="font-medium">{t("install.step2Title")}</p>
                  <p className="text-muted-foreground">
                    {t("install.step2Body")}
                  </p>
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

          <section id="search" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("search.title")}
            </h2>
            <p>{t("search.p1")}</p>
            <GuideFigure
              src={SCREENSHOTS.search}
              alt="WakeMark Chrome popup on the Search tab"
              caption={t("search.caption")}
            />
          </section>

          <section id="ask-ai" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("askAi.title")}
            </h2>
            <p>{t("askAi.p1")}</p>
            <p className="text-muted-foreground">{t("askAi.p2")}</p>
            <GuideFigure
              src={SCREENSHOTS.askAi}
              alt="WakeMark Chrome popup on the Ask AI tab"
              caption={t("askAi.caption")}
            />
          </section>

          <section id="side-panel" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("sidebar.title")}
            </h2>
            <p>{t("sidebar.p1")}</p>
            <p className="text-muted-foreground">{t("sidebar.p2")}</p>
            <GuideFigure
              src={SCREENSHOTS.sidebar}
              alt="WakeMark Ask AI in the Chrome side panel"
              caption={t("sidebar.caption")}
            />
          </section>

          <section id="tips" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("tips.title")}
            </h2>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>{t("tips.items.pin")}</li>
              <li>{t("tips.items.openApp")}</li>
              <li>{t("tips.items.sameAccount")}</li>
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
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
