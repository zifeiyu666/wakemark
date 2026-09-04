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

type ComparisonRow = {
  dimension: string;
  readwise: string;
  wakemark: string;
};

type Reason = {
  title: string;
  pain: string;
  benefit: string;
};

type TransitionPoint = {
  title: string;
  description: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    dimension: "Product focus",
    readwise: "Kindle ebooks, Instapaper highlights, long-form Reader",
    wakemark: "X (Twitter) posts and technical content as a working knowledge base",
  },
  {
    dimension: "Pricing",
    readwise: "$119.88/year (or $9.99/month), and still climbing",
    wakemark: "$59/year Founder rate, locked for life while you stay subscribed",
  },
  {
    dimension: "Search",
    readwise: "Basic keyword matching",
    wakemark: "Vector semantic search plus native AI chat",
  },
  {
    dimension: "Organization",
    readwise: "Flat sync. You tag by hand or push to Notion",
    wakemark: "AI auto-tags topics like Dev, AI, and Design",
  },
  {
    dimension: "How you revisit content",
    readwise: "Five random highlight emails (spaced repetition)",
    wakemark: "Topic-grouped AI Digest you actually want to read",
  },
  {
    dimension: "AI & developer workflow",
    readwise: "Export to static Obsidian or Notion docs",
    wakemark: "Native MCP Server. Cursor and Claude can query your library live",
  },
];

const REASONS: Reason[] = [
  {
    title: "You shouldn't pay $10+/mo just to save tweets",
    pain:
      "A lot of heavy X users turn on Readwise only to sync tweets, then pay full price for Reader, Kindle sync, and highlight algorithms they never use.",
    benefit:
      "Wakemark is built for X. No long-form reader tax. A lighter bookmark workflow, at about half the cost.",
  },
  {
    title: "From passive spaced repetition to conversational recall",
    pain:
      "Readwise Daily Review sends five random tweet highlights. When you need an answer, you still cannot remember the author or the exact wording.",
    benefit:
      'Ask Wakemark the way you would ask a coworker: "Find the React Server Actions error thread I saved last month." The AI pulls the tweet and the original link.',
  },
  {
    title: "Your bookmarks should live in your editor, not a Notion table",
    pain:
      "Readwise is good at dumping highlights into Obsidian or Notion. For developers that just moves a bookmark graveyard into a notes graveyard. You still never open it while coding.",
    benefit:
      "Wakemark ships a native Model Context Protocol (MCP) server. While you write in Cursor or Claude, the agent can read your technical bookmarks as live context.",
  },
];

const TRANSITION_POINTS: TransitionPoint[] = [
  {
    title: "No messy export formats",
    description:
      "Connect X and Wakemark starts indexing your full bookmark history in the cloud. Quietly. No CSV gymnastics.",
  },
  {
    title: "Keep both tools if you want",
    description:
      "Leave Readwise on Kindle and long-form highlights. Hand X posts to Wakemark, which is built for social and technical language.",
  },
  {
    title: "Your data stays yours",
    description:
      "Export bookmarks and AI tags anytime as clean Markdown and JSON. Nothing is locked in.",
  },
];

const FAQS: FaqItem[] = [
  {
    question:
      "Can I keep using Readwise for Kindle highlights alongside Wakemark?",
    answer:
      "Yes. Plenty of engineers and writers split the work: Readwise for deep book highlights, Wakemark for fast-moving X posts, technical threads, and sparks of inspiration.",
  },
  {
    question: "Does Wakemark automatically sync new bookmarks I save on mobile?",
    answer:
      "Yes. Cloud sync runs in the background. Bookmark in the official X app and Wakemark pulls, cleans, and tags the post without you opening another client.",
  },
  {
    question: "How does the Founder pricing guarantee work?",
    answer:
      "Subscribe at the early-bird rate (currently $59/year) and that price stays locked for as long as you remain subscribed. New features do not raise your renewal.",
  },
];

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
      className="relative mx-auto w-full max-w-[420px] lg:ml-auto lg:mr-0"
    >
      <div className="rounded-2xl border border-border bg-zinc-50 p-4 dark:bg-zinc-900/40 sm:p-5">
        <article className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(24,24,27,0.04),0_8px_24px_rgba(24,24,27,0.04)] dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium text-zinc-500">Readwise</p>
            <p className="text-[11px] text-zinc-400">Daily Review</p>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            Highlight from{" "}
            <span className="bg-amber-100 px-0.5 text-zinc-800 dark:bg-amber-900/40 dark:text-amber-100">
              a random saved tweet
            </span>
            . No tags. No way to ask a follow-up.
          </p>
          <p className="mt-3 text-[11px] text-zinc-400">5 of 5 highlights today</p>
        </article>

        <article className="mt-3 rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(24,24,27,0.04),0_12px_28px_rgba(24,24,27,0.06)] dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium text-zinc-800 dark:text-zinc-200">
              Wakemark
            </p>
            <p className="text-[11px] text-primary">AI Chat + MCP</p>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300">
            React Server Actions error thread from last month, with the original
            post linked.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["Dev", "AI", "React"].map((tag) => (
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
              Ask: where did I save that Server Actions bug?
            </p>
            <p className="mt-1 text-[11px] font-medium text-zinc-800 dark:text-zinc-200">
              Cursor can query this via MCP.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}

export default function ReadwiseAlternative() {
  return (
    <div className="w-full">
      <BG1 />

      <div className="home-grid-frame">
        <section className="overflow-hidden">
          <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-16 sm:px-10 md:pt-24 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 lg:pb-28 lg:pt-20">
            <div className="text-center lg:text-left">
              <span className="inline-flex rounded-md bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
                Readwise Alternative for X
              </span>
              <h1 className="mt-8 text-3xl font-semibold leading-[1.1] tracking-[-0.04em] sm:text-4xl md:text-5xl">
                <span className="text-foreground">
                  Love Readwise for books?
                </span>{" "}
                <span className="text-muted-foreground">
                  Use Wakemark for your X bookmarks.
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground lg:mx-0 md:text-lg">
                Readwise was built for highlights and spaced repetition. Wakemark
                turns saved tweets into an AI knowledge base you can search,
                digest, and plug into Cursor and Claude.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="h-12 w-full gap-2 text-sm font-semibold sm:w-auto"
                >
                  <I18nLink href="/login">
                    Import X Bookmarks in Seconds
                    <ArrowRight className="h-4 w-4" />
                  </I18nLink>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 w-full text-sm font-semibold sm:w-auto"
                >
                  <a href="#comparison">Compare Features &amp; Pricing</a>
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

        <section id="comparison" className="scroll-mt-24 px-6 py-16 sm:px-10 md:px-14 md:py-24">
          <SectionHeader
            eyebrow="Quick Comparison"
            title="Readwise vs. Wakemark, side by side."
            subtitle="Where a $10/month highlight app stops being the right tool for X."
          />

          <div className="mx-auto mt-12 max-w-5xl overflow-x-auto border border-border">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-5 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
                    Capability
                  </th>
                  <th className="px-5 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
                    Readwise
                  </th>
                  <th className="bg-primary/4 px-5 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.13em] text-primary">
                    Wakemark
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
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/45" />
                        {row.readwise}
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
            eyebrow="Why Switch"
            title="Three reasons to choose Wakemark for X"
            subtitle="Keep Readwise for books. Use Wakemark for tweets."
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
                      The Readwise way
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {reason.pain}
                    </p>
                  </div>
                  <div className="bg-primary/4 p-6 md:p-8">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-primary">
                      The Wakemark way
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

        <section className="px-6 py-16 sm:px-10 md:px-14 md:py-24">
          <SectionHeader
            eyebrow="Transition"
            title="Zero-friction switch"
            subtitle="Keep Kindle in Readwise. Move X bookmarks without a migration project."
          />

          <div className="mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-3 md:gap-0 md:divide-x md:divide-border md:border md:border-border">
            {TRANSITION_POINTS.map((step) => (
              <div
                key={step.title}
                className="border border-border p-6 md:border-0 md:p-8"
              >
                <h3 className="text-lg font-medium tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 py-16 sm:px-10 md:px-14 md:py-24">
          <SectionHeader
            eyebrow="FAQ"
            title="Frequently Asked Questions"
            subtitle="The usual questions before you split Readwise and X."
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
                Stop letting great tweets die in Readwise.
              </h2>

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 md:text-lg">
                Auto-tagging, conversational search, and Cursor-ready MCP, for
                about half the cost.
              </p>

              <I18nLink
                href="/login"
                className="mt-9 inline-flex h-12 items-center rounded-xl border border-zinc-600 bg-zinc-700 px-5 text-sm font-medium text-white transition-colors hover:border-zinc-500 hover:bg-zinc-600 active:translate-y-px"
                prefetch={true}
              >
                Start Your 7-Day Free Trial
              </I18nLink>

              <p className="mt-5 text-sm text-zinc-500">
                No credit card required to explore. Lock in the Founder rate.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
