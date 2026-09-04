import DeweyAlternative from "@/components/alternatives/DeweyAlternative";
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

  return constructMetadata({
    title: "Dewey Alternative — The AI-Native Second Brain for X",
    description:
      "Dewey was built for manual folders and static archives. Wakemark automatically tags your bookmarks with AI, lets you chat with saved tweets, and plugs straight into Cursor or Claude via MCP.",
    locale: locale as Locale,
    path: "/alternatives/dewey-alternative",
  });
}

export default function DeweyAlternativePage() {
  return <DeweyAlternative />;
}

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({
    locale,
  }));
}
