import ShadowbanCheckTool from "@/components/tools/ShadowbanCheckTool";
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
    title: "X/Twitter Shadowban Checker — Free Real-Time Test",
    description:
      "Check if your X account is shadowbanned. WakeMark's Chrome extension tests search ban, suggestion ban, sensitive profile, and account privacy from a guest session — free, no login required.",
    locale: locale as Locale,
    path: "/tools/shadowban-check",
  });
}

export default function ShadowbanCheckPage() {
  return <ShadowbanCheckTool />;
}

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({
    locale,
  }));
}
