import ChromeInstallButton from "@/components/home/ChromeInstallButton";
import { BG1 } from "@/components/shared/BGs";
import TwitterScreenshotEditor from "@/components/tools/TwitterScreenshotEditor";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link as I18nLink } from "@/i18n/routing";
import {
  CUSTOMIZATION_GROUPS,
  FAQS,
  FEATURE_HIGHLIGHTS,
  STEPS,
  USE_CASES,
} from "@/lib/twitter-screenshot/content";
import { Download, ImageIcon, Palette } from "lucide-react";

export default function TwitterScreenshotTool() {
  return (
    <div className="min-h-screen relative w-full">
      <BG1 />
      <div className="relative z-10 container max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="space-y-4 mb-10">
          <p className="text-xs font-semibold tracking-[0.14em] uppercase text-muted-foreground">
            Free tools
          </p>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-balance">
            Twitter Screenshot Generator
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl text-pretty">
            Turn any tweet into a beautiful screenshot. Paste a post URL,
            customize the background and layout, then download a PNG. Free tweet
            screenshot tool — no WakeMark account required.
          </p>
        </div>

        <section className="grid sm:grid-cols-3 gap-4 mb-10">
          {FEATURE_HIGHLIGHTS.map((item, index) => {
            const icons = [ImageIcon, Palette, Download];
            const Icon = icons[index] ?? ImageIcon;
            return (
              <div
                key={item.title}
                className="border border-border bg-background/70 p-5 space-y-2"
              >
                <Icon className="size-5" aria-hidden />
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
            );
          })}
        </section>

        <TwitterScreenshotEditor />

        <section className="mt-16 space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            What is a Twitter screenshot tool?
          </h2>
          <p className="text-muted-foreground text-pretty max-w-3xl">
            A Twitter screenshot tool converts a live post on X into a static
            image you can download or share. Instead of cropping your phone
            screen, you paste a tweet URL, preview the post as a clean card,
            and export a PNG with the background and spacing you choose. Use it
            for Instagram carousels, blog embeds, pitch decks, or archiving a
            tweet before it disappears.
          </p>
        </section>

        <section className="mt-16 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              How to take a Twitter screenshot
            </h2>
            <p className="text-muted-foreground max-w-3xl">
              Download a tweet screenshot in three steps. No design skills or
              browser extension required.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {STEPS.map((step) => (
              <div
                key={step.step}
                className="border border-border bg-background/60 p-5 space-y-3"
              >
                <p className="text-xs font-semibold tracking-widest text-muted-foreground">
                  {step.step}
                </p>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Customize every part of your tweet screenshot
            </h2>
            <p className="text-muted-foreground max-w-3xl">
              Background, canvas size, theme, metrics, and export — all in the
              editor above.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {CUSTOMIZATION_GROUPS.map((group) => (
              <div
                key={group.title}
                className="border border-border bg-background/60 p-5 space-y-3"
              >
                <h3 className="font-semibold">{group.title}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {group.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-foreground/50" aria-hidden>◆</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Who uses tweet screenshot tools?
            </h2>
            <p className="text-muted-foreground max-w-3xl">
              Anyone who needs a polished image of a post rather than a raw
              screen capture.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {USE_CASES.map((item) => (
              <div
                key={item.title}
                className="border border-border bg-background/60 p-5 space-y-2"
              >
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            Twitter screenshot FAQ
          </h2>
          <Accordion
            type="single"
            collapsible
            className="w-full border border-border px-4 bg-background/60"
          >
            {FAQS.map((faq, index) => (
              <AccordionItem key={faq.question} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="mt-16 border border-border p-6 sm:p-8 bg-background/70 space-y-3">
          <h2 className="text-xl font-semibold">
            Save tweets before you need a screenshot
          </h2>
          <p className="text-muted-foreground text-pretty">
            Screenshots capture a moment. WakeMark keeps your full bookmark
            library searchable with AI tags, Ask AI, and MCP in Cursor or
            Claude — so when a tweet is deleted, you still have the text. Need
            to find old posts on X? Try{" "}
            <I18nLink
              href="/tools/twitter-advanced-search"
              className="underline underline-offset-4"
            >
              advanced Twitter search
            </I18nLink>
            .
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <ChromeInstallButton label="Install Chrome Extension" />
            <I18nLink
              href="/tools/shadowban-check"
              className="text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground"
            >
              Shadowban checker
            </I18nLink>
          </div>
        </section>
      </div>
    </div>
  );
}
