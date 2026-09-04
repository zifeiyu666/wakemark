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
  dewey: string;
  wakemark: string;
};

type Reason = {
  title: string;
  pain: string;
  benefit: string;
};

type MigrationStep = {
  title: string;
  description: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    dimension: "Sync method",
    dewey: "Browser-extension assisted / manual sync",
    wakemark: "Silent cloud sync running in the background",
  },
  {
    dimension: "Organization",
    dewey: "Manual folders & hand-written tags",
    wakemark: "AI topic tagging (Dev, Design, AI, etc.)",
  },
  {
    dimension: "Retrieval",
    dewey: "Exact keyword matching",
    wakemark: "Vector semantic search + AI Q&A with source links",
  },
  {
    dimension: "Consumption",
    dewey: "Must actively open the web app to browse",
    wakemark: "Scheduled smart Digest delivered to your inbox",
  },
  {
    dimension: "Developer integration",
    dewey: "Export only to Notion / CSV",
    wakemark: "Native MCP Server — plugs straight into Cursor & Claude",
  },
  {
    dimension: "Pricing",
    dewey: "Recurring monthly / yearly fees",
    wakemark: "Grandfathered pricing — lock your rate for life",
  },
];

const REASONS: Reason[] = [
  {
    title: "From Manual Folders to Zero-Effort AI Categorization",
    pain:
      "Every bookmark takes time to tag and file into folders. Once a few hundred pile up, the library becomes a bookmark graveyard — saved, but never seen again.",
    benefit:
      "Connect once and the AI silently analyzes the meaning of every tweet in the background, categorizing them by topic automatically. No organizing required — ever.",
  },
  {
    title: "Conversational Search vs. Guessing Exact Keywords",
    pain:
      "Only literal keyword matching is supported. If you can't remember the exact word the author used, that bookmark is gone for good.",
    benefit:
      "Ask in plain language — \u201CWhat was that Tailwind shadow component tweet I saved last week?\u201D — and get an extracted answer with a link back to the original tweet.",
  },
  {
    title: "Built for the Modern AI Workflow (Model Context Protocol)",
    pain:
      "Your data is trapped in a proprietary vault or static Notion pages, completely disconnected from the tools where real work happens.",
    benefit:
      "Wakemark runs as an MCP Server. While coding in Cursor or thinking with Claude, your agents can pull your X bookmarks in as a live knowledge base.",
  },
];

const MIGRATION_STEPS: MigrationStep[] = [
  {
    title: "Connect your X account",
    description:
      "One-click authorization. No always-on browser extension to install or keep alive.",
  },
  {
    title: "Auto-import existing bookmarks",
    description:
      "Your full history is pulled in automatically, and every new bookmark keeps syncing in the background.",
  },
  {
    title: "Keep your existing workflow",
    description:
      "Export clean Markdown / CSV backups in one click. Your data assets are never locked in.",
  },
];

const FAQS: FaqItem[] = [
  {
    question:
      "Can I use Wakemark if I already have thousands of bookmarks in Dewey?",
    answer:
      "Yes. Wakemark syncs your full library directly from X — the source of truth — and the AI re-organizes years of clutter into clean topics automatically. You don't need to export anything from Dewey.",
  },
  {
    question: "Does Wakemark require a Chrome extension to work?",
    answer:
      "No. Wakemark runs on cloud APIs and syncs automatically in the background — no extension conflicts, and it keeps working even when your browser is closed.",
  },
  {
    question: "How does the MCP integration work with Cursor or Claude?",
    answer:
      "Add a single config entry to claude_desktop_config.json or Cursor's MCP settings. From that moment, your agents can search and cite your bookmarks in real time while you work.",
  },
  {
    question: "Is the pricing grandfathered if I subscribe now?",
    answer:
      "Yes. Early-bird subscribers lock in their rate for life — your price never goes up, even as pricing changes for new users.",
  },
];

/* Shared section header: mono eyebrow + two-tone same-size title block,
   matching the homepage Features heading pattern. */
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

export default function DeweyAlternative() {
  return (
    <div className="w-full">
      <BG1 />

      <div className="home-grid-frame">
        {/* Hero */}
        <section className="overflow-hidden">
          <div className="relative z-10 mx-auto max-w-5xl px-6 pb-28 pt-16 text-center sm:px-10 md:pt-24">
            <span className="inline-flex rounded-md bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
              Dewey Alternative
            </span>
            <h1 className="mt-8 text-3xl font-semibold leading-[1.1] tracking-[-0.04em] sm:text-4xl md:text-5xl">
              <span className="text-foreground">
                Looking for a Dewey Alternative?
              </span>{" "}
              <span className="text-muted-foreground">
                Meet the AI-Native Second Brain for X.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Dewey was built for manual folders and static archives. Wakemark
              automatically tags your bookmarks with AI, lets you chat with
              saved tweets, and plugs straight into Cursor or Claude via MCP.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 w-full gap-2 text-sm font-semibold sm:w-auto"
              >
                <I18nLink href="/login">
                  Import from X in 10s
                  <ArrowRight className="h-4 w-4" />
                </I18nLink>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 w-full text-sm font-semibold sm:w-auto"
              >
                <a href="#comparison">See Feature Comparison</a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Free 7-day trial · No credit card required
            </p>

            <p className="mt-10 font-mono text-[11px] font-medium uppercase tracking-[0.13em] text-muted-foreground/80">
              Over 500,000+ bookmarks indexed • Zero manual folders needed
            </p>
          </div>
          <div aria-hidden className="feature-heading-stripes" />
        </section>

        {/* Quick comparison table */}
        <section id="comparison" className="scroll-mt-24 px-6 py-16 sm:px-10 md:px-14 md:py-24">
          <SectionHeader
            eyebrow="Quick Comparison"
            title="Dewey vs. Wakemark, side by side."
            subtitle="Six dimensions where the daily workflow diverges."
          />

          <div className="mx-auto mt-12 max-w-5xl overflow-x-auto border border-border">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-5 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
                    Capability
                  </th>
                  <th className="px-5 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
                    Dewey
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
                        {row.dewey}
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

        {/* Deep dive */}
        <section className="px-6 py-16 sm:px-10 md:px-14 md:py-24">
          <SectionHeader
            eyebrow="Deep Dive"
            title="Why Creators & Engineers Switch"
            subtitle="Three reasons makers move from Dewey to Wakemark."
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
                      The Dewey way
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

        {/* Migration steps */}
        <section className="px-6 py-16 sm:px-10 md:px-14 md:py-24">
          <SectionHeader
            eyebrow="Migration"
            title="Migration in 3 Simple Steps"
            subtitle="Switch tools without losing a single bookmark."
          />

          <div className="mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-3 md:gap-0 md:divide-x md:divide-border md:border md:border-border">
            {MIGRATION_STEPS.map((step, index) => (
              <div
                key={step.title}
                className="border border-border p-6 md:border-0 md:p-8"
              >
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground/80">
                  Step {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-lg font-medium tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="px-6 py-16 sm:px-10 md:px-14 md:py-24">
          <SectionHeader
            eyebrow="FAQ"
            title="Frequently Asked Questions"
            subtitle="Everything people ask before making the switch."
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

        {/* Bottom CTA */}
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
                Stop organizing. Start using what you save.
              </h2>

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 md:text-lg">
                Join founders, developers, and researchers turning X bookmarks
                into active intelligence.
              </p>

              <I18nLink
                href="/login"
                className="mt-9 inline-flex h-12 items-center rounded-xl border border-zinc-600 bg-zinc-700 px-5 text-sm font-medium text-white transition-colors hover:border-zinc-500 hover:bg-zinc-600 active:translate-y-px"
                prefetch={true}
              >
                Start Free 7-Day Trial
              </I18nLink>

              <p className="mt-5 text-sm text-zinc-500">
                No credit card required · Cancel anytime
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
