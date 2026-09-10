import TwitterAdvancedSearchTool from "@/components/tools/TwitterAdvancedSearchTool";
import { LOCALES, type Locale } from "@/i18n/routing";
import { twitterAdvancedSearchJsonLd } from "@/lib/twitter-search/jsonld";
import { constructMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale } = await params;

  return constructMetadata({
    title: "Advanced Twitter Search: Free X Tool, No Account",
    description:
      "Build an advanced Twitter search for X without memorizing operators. Filter tweets by date, account, likes, media, and language. Free, no WakeMark signup.",
    locale: locale as Locale,
    path: "/tools/twitter-advanced-search",
  });
}

export default function TwitterAdvancedSearchPage() {
  const jsonLd = twitterAdvancedSearchJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TwitterAdvancedSearchTool />
    </>
  );
}

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({
    locale,
  }));
}
