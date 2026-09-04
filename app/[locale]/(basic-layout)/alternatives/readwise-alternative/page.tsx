import ReadwiseAlternative from "@/components/alternatives/ReadwiseAlternative";
import { LOCALES, type Locale } from "@/i18n/routing";
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
    title: "The AI-Native Readwise Alternative for X (Twitter) Bookmarks",
    description:
      "Paying $10+/month for Readwise just to sync tweets? Wakemark auto-tags your bookmarks, lets you chat with saved posts, and connects directly to Cursor & Claude via MCP for half the price.",
    locale: locale as Locale,
    path: "/alternatives/readwise-alternative",
  });

  return {
    ...meta,
    keywords: [
      "readwise alternative twitter",
      "readwise alternative for x bookmarks",
      "ai alternative to readwise",
      "readwise pricing alternative",
    ],
  };
}

export default function ReadwiseAlternativePage() {
  return <ReadwiseAlternative />;
}

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({
    locale,
  }));
}
