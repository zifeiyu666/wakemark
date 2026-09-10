import CTA from "@/components/home/CTA";
import Changelog from "@/components/home/Changelog";
import FAQ from "@/components/home/FAQ";
import Features from "@/components/home/Features";
import Showcase from "@/components/home/Showcase";
import PricingLock from "@/components/home/PricingLock";
import Problem from "@/components/home/Problem";
import TextRevealSection from "@/components/home/TextRevealSection";
import { BG1 } from "@/components/shared/BGs";
import { getSession } from "@/lib/auth/server";
import { getMessages } from "next-intl/server";

export default async function HomeComponent() {
  const messages = await getMessages();
  const session = await getSession();

  return (
    <div className="w-full">
      <BG1 />

      <Showcase signedIn={Boolean(session?.user)} />

      <main className="home-grid-frame">
        {messages.Landing.Problem && <Problem />}

        {messages.Landing.Features && <Features />}

        {messages.Landing.TextReveal && <TextRevealSection />}

        {messages.Landing.PricingLock && <PricingLock />}

        {messages.Roadmap && <Changelog />}

        {messages.Landing.FAQ && <FAQ />}

        {messages.Landing.CTA && <CTA />}
      </main>
    </div>
  );
}
