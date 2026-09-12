import TwitterScreenshotTool from "@/components/tools/TwitterScreenshotTool";
import { LOCALES, type Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import {
  PAGE_DESCRIPTION,
  PAGE_PATH,
  PAGE_TITLE,
} from "@/lib/twitter-screenshot/content";
import { twitterScreenshotJsonLd } from "@/lib/twitter-screenshot/jsonld";
import type { Metadata } from "next";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale } = await params;

  return constructMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    locale: locale as Locale,
    path: PAGE_PATH,
  });
}

export default function TwitterScreenshotPage() {
  const jsonLd = twitterScreenshotJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TwitterScreenshotTool />
    </>
  );
}

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({
    locale,
  }));
}
