import { TextReveal } from "@/components/ui/text-reveal";
import { getTranslations } from "next-intl/server";

export default async function TextRevealSection() {
  const t = await getTranslations("Landing.TextReveal");

  return (
    <section className="w-full bg-white dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <TextReveal>{t("text")}</TextReveal>
      </div>
    </section>
  );
}
