import CTA from "@/components/home/CTA";
import FAQ from "@/components/home/FAQ";
import Features from "@/components/home/Features";
import Hero from "@/components/home/Hero";
import PricingLock from "@/components/home/PricingLock";
import Problem from "@/components/home/Problem";
import TextRevealSection from "@/components/home/TextRevealSection";
import { BG1 } from "@/components/shared/BGs";
import { getMessages } from "next-intl/server";

export default async function HomeComponent() {
  const messages = await getMessages();

  return (
    <div className="w-full">
      <BG1 />

      {messages.Landing.Hero && <Hero />}

      {messages.Landing.Problem && <Problem />}

      {messages.Landing.Features && <Features />}

      {messages.Landing.TextReveal && <TextRevealSection />}

      {messages.Landing.PricingLock && <PricingLock />}

      {messages.Landing.FAQ && <FAQ />}

      {messages.Landing.CTA && <CTA />}
    </div>
  );
}
