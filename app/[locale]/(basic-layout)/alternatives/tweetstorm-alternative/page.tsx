import TweetStormAlternative from "@/components/alternatives/TweetStormAlternative";
import { LOCALES, type Locale } from "@/i18n/routing";
import {
  PAGE_DESCRIPTION,
  PAGE_KEYWORDS,
  PAGE_PATH,
  PAGE_TITLE,
} from "@/lib/alternatives/tweetstorm-content";
import { tweetstormAlternativeJsonLd } from "@/lib/alternatives/tweetstorm-jsonld";
import { constructMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale } = await params;

  const meta = await constructMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    locale: locale as Locale,
    path: PAGE_PATH,
  });

  return {
    ...meta,
    keywords: PAGE_KEYWORDS,
  };
}

export default function TweetStormAlternativePage() {
  const jsonLd = tweetstormAlternativeJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TweetStormAlternative />
    </>
  );
}

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({
    locale,
  }));
}
