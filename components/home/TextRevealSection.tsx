import { TextReveal } from "@/components/ui/text-reveal";
import { getTranslations } from "next-intl/server";

export default async function TextRevealSection() {
  const t = await getTranslations("Landing.TextReveal");

  return (
    <section className="relative w-full">
      <TextReveal backgroundClassName="text-reveal-dots">
        {t("text")}
      </TextReveal>
    </section>
  );
}
