import {
  COMPARISON_ROWS,
  FAQS,
  PRICING_ROWS,
  REASONS,
  VERDICTS,
} from "@/lib/alternatives/tweetstorm-content";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { BG1 } from "@/components/shared/BGs";
import { Link as I18nLink } from "@/i18n/routing";
import { ArrowRight, Check, X } from "lucide-react";

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mx-auto max-w-4xl text-center">
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
        {eyebrow}
      </p>
      <div className="mt-4 text-2xl font-medium leading-[1.12] tracking-[-0.035em] sm:text-3xl md:text-4xl">
        <h2 className="text-foreground">{title}</h2>
        <p className="mt-1 text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function HeroVisual() {
  return (
    <div
      aria-hidden
      className="relative mx-auto w-full max-w-[440px] lg:ml-auto lg:mr-0"
    >
      <div className="rounded-2xl border border-border bg-zinc-50 p-4 dark:bg-zinc-900/40 sm:p-5">
        <article className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(24,24,27,0.04),0_8px_24px_rgba(24,24,27,0.04)] dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium text-zinc-500">TweetStorm</p>
            <p className="text-[11px] text-zinc-400">Nested folders</p>
          </div>
          <ul className="mt-3 space-y-1.5 font-mono text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            <li>Work</li>
            <li className="pl-3 text-zinc-500">Resources</li>
            <li className="pl-6 text-zinc-400">Competitor research</li>
            <li className="pl-6 text-zinc-400">Campaign ideas</li>
          </ul>
          <p className="mt-3 text-[11px] text-zinc-400">
            Export: Agency plan · $15/mo
          </p>
        </article>

        <article className="mt-3 rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(24,24,27,0.04),0_12px_28px_rgba(24,24,27,0.06)] dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium text-zinc-800 dark:text-zinc-200">
              WakeMark
            </p>
            <p className="text-[11px] text-primary">AI Digest + MCP</p>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300">
            Next.js caching thread: use stale-while-revalidate on the product
            page, skip the 20-post scroll.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["Dev", "Next.js", "Action"].map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <p className="text-[11px] text-zinc-500">
              Cursor: find last week’s Next.js tweets and summarize them here.
            </p>
            <p className="mt-1 text-[11px] font-medium text-zinc-800 dark:text-zinc-200">
              MCP returns the sources. Markdown export is not gated.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}

export default function TweetStormAlternative() {
  return (
    <div className="w-full">
      <BG1 />

      <div className="home-grid-frame">
        <section className="overflow-hidden">
          <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-16 sm:px-10 md:pt-24 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 lg:pb-28 lg:pt-20">
            <div className="text-center lg:text-left">
              <span className="inline-flex rounded-md bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
                TweetStorm Alternative
              </span>
              <h1 className="mt-8 text-3xl font-semibold leading-[1.1] tracking-[-0.04em] sm:text-4xl md:text-5xl">
                <span className="text-foreground">TweetStorm vs WakeMark.</span>{" "}
                <span className="text-muted-foreground">
                  File cabinets vs. an AI-native second brain.
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground lg:mx-0 md:text-lg">
                Native X bookmarks are a black hole: no real search, no
                classification, save-and-forget. TweetStorm organizes that pile
                into nested folders. WakeMark digests it, tags it, and hands it
                to Cursor and Claude through MCP.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="h-12 w-full gap-2 text-sm font-semibold sm:w-auto"
                >
                  <I18nLink href="/login">
                    Import X bookmarks in seconds
                    <ArrowRight className="h-4 w-4" />
                  </I18nLink>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 w-full text-sm font-semibold sm:w-auto"
                >
                  <a href="#comparison">See features and pricing</a>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                7-day free trial. No credit card required.
              </p>
            </div>

            <HeroVisual />
          </div>
          <div aria-hidden className="feature-heading-stripes" />
        </section>

        <section className="px-6 py-16 sm:px-10 md:px-14 md:py-24">
          <SectionHeader
            eyebrow="The split"
            title="Two bookmark managers. Two decades."
            subtitle="Web 2.0 filing versus AI-native memory."
          />
          <div className="mx-auto mt-10 max-w-3xl space-y-5 text-base leading-relaxed text-muted-foreground">
            <p>
              <strong className="font-medium text-foreground">
                TweetStorm vs WakeMark
              </strong>{" "}
              is a choice between two X (Twitter) bookmark managers: a
              folder-and-tag organizer that files saved posts by hand, and an
              AI-native library that digests, tags, and exposes those posts to
              Cursor and Claude through MCP. The difference is consumption
              versus filing.
            </p>
            <p>
              TweetStorm.ai is primarily a growth toolkit — generators,
              schedulers, bulk cleanup. Its{" "}
              <a
                href="https://tweetstorm.ai/products/x-bookmark-manager"
                className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
                rel="noopener noreferrer"
                target="_blank"
              >
                X bookmark manager
              </a>{" "}
              is a separate product with its own plans. That product is a
              classic file cabinet: nested folders, smart folders, tags. WakeMark
              is built as an external memory —{" "}
              <I18nLink
                href="/docs/mcp"
                className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
              >
                MCP
              </I18nLink>
              ,{" "}
              <I18nLink
                href="/docs/start/export"
                className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
              >
                export
              </I18nLink>
              , and{" "}
              <I18nLink
                href="/blog/why-i-built-wakemark"
                className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
              >
                digests you will actually read
              </I18nLink>
              .
            </p>
          </div>
        </section>

        <section
          id="comparison"
          className="scroll-mt-24 px-6 py-16 sm:px-10 md:px-14 md:py-24"
        >
          <SectionHeader
            eyebrow="Quick comparison"
            title="TweetStorm vs WakeMark, side by side."
            subtitle="Where a folder tree stops being the bottleneck."
          />

          <div className="mx-auto mt-12 max-w-5xl overflow-x-auto border border-border">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-5 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
                    Capability
                  </th>
                  <th className="px-5 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
                    TweetStorm
                  </th>
                  <th className="bg-primary/4 px-5 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.13em] text-primary">
                    WakeMark
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.dimension}>
                    <td className="px-5 py-4 align-top font-medium text-foreground">
                      {row.dimension}
                    </td>
                    <td className="px-5 py-4 align-top text-muted-foreground">
                      <span className="flex items-start gap-2.5">
                        {row.tweetstormWins ? (
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70" />
                        ) : (
                          <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/45" />
                        )}
                        {row.tweetstorm}
                      </span>
                    </td>
                    <td className="bg-primary/4 px-5 py-4 align-top text-foreground">
                      <span className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {row.wakemark}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="px-6 py-16 sm:px-10 md:px-14 md:py-24">
          <SectionHeader
            eyebrow="How they handle saved tweets"
            title="Manual folders or AI digestion."
            subtitle="Three places the daily workflow actually diverges."
          />

          <div className="mx-auto mt-14 max-w-5xl space-y-14">
            {REASONS.map((reason, index) => (
              <article key={reason.title}>
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-sm text-muted-foreground/70">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-xl font-medium tracking-tight sm:text-2xl">
                    {reason.title}
                  </h3>
                </div>
                <div className="mt-5 divide-y divide-border border border-border md:grid md:grid-cols-2 md:divide-x md:divide-y-0">
                  <div className="p-6 md:p-8">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground/80">
                      The TweetStorm way
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {reason.pain}
                    </p>
                  </div>
                  <div className="bg-primary/4 p-6 md:p-8">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-primary">
                      The WakeMark way
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-foreground">
                      {reason.benefit}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="pricing"
          className="scroll-mt-24 px-6 py-16 sm:px-10 md:px-14 md:py-24"
        >
          <SectionHeader
            eyebrow="Pricing & value"
            title="Same money. A folder plugin or a knowledge engine."
            subtitle="Bookmark-plan prices from TweetStorm’s product page, September 2026."
          />

          <div className="mx-auto mt-12 max-w-6xl overflow-x-auto border border-border">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
                    Feature
                  </th>
                  <th className="px-4 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
                    TweetStorm Free
                  </th>
                  <th className="px-4 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
                    TweetStorm Pro
                  </th>
                  <th className="px-4 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
                    TweetStorm Agency
                  </th>
                  <th className="bg-primary/4 px-4 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.13em] text-primary">
                    WakeMark
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {PRICING_ROWS.map((row) => (
                  <tr key={row.feature}>
                    <td className="px-4 py-3.5 align-top font-medium text-foreground">
                      {row.feature}
                    </td>
                    <td className="px-4 py-3.5 align-top text-muted-foreground">
                      {row.tweetstormFree}
                    </td>
                    <td className="px-4 py-3.5 align-top text-muted-foreground">
                      {row.tweetstormPro}
                    </td>
                    <td className="px-4 py-3.5 align-top text-muted-foreground">
                      {row.tweetstormAgency}
                    </td>
                    <td className="bg-primary/4 px-4 py-3.5 align-top text-foreground">
                      {row.wakemark}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mx-auto mt-4 max-w-6xl text-xs leading-relaxed text-muted-foreground">
            TweetStorm bookmark plans are a separate subscription from its core
            automation tiers ($12–$49/mo on{" "}
            <a
              href="https://tweetstorm.ai/pricing"
              className="underline decoration-border underline-offset-2 hover:decoration-foreground"
              rel="noopener noreferrer"
              target="_blank"
            >
              tweetstorm.ai/pricing
            </a>
            ). WakeMark is one plan with full access; Founder pricing stays
            locked while you remain subscribed.{" "}
            <I18nLink
              href="/blog/x-twitter-bookmarks-exporter"
              className="underline decoration-border underline-offset-2 hover:decoration-foreground"
            >
              How WakeMark export works
            </I18nLink>
            .
          </p>
        </section>

        <section className="px-6 py-16 sm:px-10 md:px-14 md:py-24">
          <SectionHeader
            eyebrow="The verdict"
            title="Which Twitter bookmark manager should you pick?"
            subtitle="Keep TweetStorm if you want the tree. Switch if you want the memory."
          />

          <div className="mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-2 md:gap-0 md:divide-x md:divide-border md:border md:border-border">
            {VERDICTS.map((item) => (
              <div
                key={item.product}
                className="border border-border p-6 md:border-0 md:p-8"
              >
                <h3 className="text-lg font-medium tracking-tight">
                  {item.product}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.pickIf}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 py-16 sm:px-10 md:px-14 md:py-24">
          <SectionHeader
            eyebrow="FAQ"
            title="TweetStorm vs WakeMark questions"
            subtitle="Pricing, folders, export, and MCP — as of September 2026."
          />

          <div className="mx-auto mt-12 max-w-3xl">
            <Accordion
              type="single"
              collapsible
              className="w-full border border-border bg-card px-6 py-3 md:px-8"
            >
              {FAQS.map((item) => (
                <AccordionItem
                  key={item.question}
                  value={item.question}
                  className="border-dashed"
                >
                  <AccordionTrigger className="cursor-pointer text-base hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-base">{item.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <p className="mx-auto mt-8 max-w-3xl text-center text-sm text-muted-foreground">
            Also comparing folder tools and highlight apps? See{" "}
            <I18nLink
              href="/alternatives/dewey-alternative"
              className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
            >
              Dewey vs WakeMark
            </I18nLink>{" "}
            and{" "}
            <I18nLink
              href="/alternatives/readwise-alternative"
              className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
            >
              Readwise vs WakeMark
            </I18nLink>
            . Developers:{" "}
            <I18nLink
              href="/blog/turn-your-saved-tweets-into-context-for-cursor-and-claude-with-mcp"
              className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
            >
              connect bookmarks to Cursor with MCP
            </I18nLink>
            .
          </p>
        </section>

        <section className="relative -mx-[25px] w-[calc(100%+50px)] max-w-none overflow-x-clip">
          <div className="cta-grid relative isolate flex min-h-[430px] items-center justify-center overflow-hidden px-6 py-20 text-center sm:px-10 md:min-h-[510px]">
            <div aria-hidden className="cta-grid-meteors">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="relative z-10 flex max-w-5xl flex-col items-center">
              <h2 className="max-w-5xl text-4xl font-medium leading-[1.08] tracking-[-0.045em] text-white sm:text-5xl md:text-6xl">
                Stop filing tweets. Start using them.
              </h2>

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 md:text-lg">
                AI Digest, open export, and MCP for Cursor and Claude — without
                an Agency upsell to download your own library.
              </p>

              <I18nLink
                href="/login"
                className="mt-9 inline-flex h-12 items-center rounded-xl border border-zinc-600 bg-zinc-700 px-5 text-sm font-medium text-white transition-colors hover:border-zinc-500 hover:bg-zinc-600 active:translate-y-px"
                prefetch={true}
              >
                Start Your 7-Day Free Trial
              </I18nLink>

              <p className="mt-5 text-sm text-zinc-500">
                No credit card required. Lock in the Founder rate.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
