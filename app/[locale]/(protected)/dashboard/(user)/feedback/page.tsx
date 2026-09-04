import { constructMetadata } from "@/lib/metadata";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { FeedbackForm } from "./FeedbackForm";

type Params = Promise<{ locale: string }>;

type MetadataProps = {
  params: Params;
};

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "Feedback",
  });

  return constructMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/dashboard/feedback`,
  });
}

export default function FeedbackPage() {
  return (
    <div className="container mx-auto p-4 md:p-6">
      <FeedbackForm />
    </div>
  );
}
