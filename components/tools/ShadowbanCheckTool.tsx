import ChromeInstallButton from "@/components/home/ChromeInstallButton";
import { BG1 } from "@/components/shared/BGs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link as I18nLink } from "@/i18n/routing";
import {
  AlertTriangle,
  CheckCircle2,
  EyeOff,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

type CheckItem = {
  title: string;
  description: string;
};

type Sign = {
  title: string;
  description: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

const CHECKS: CheckItem[] = [
  {
    title: "Search ban",
    description:
      "Whether your posts show up for a from:@handle search. If the timeline has content but search returns nothing, that is the classic search-ban signal.",
  },
  {
    title: "Search suggestion ban",
    description:
      "Whether your handle appears in X search autocomplete when someone starts typing your username.",
  },
  {
    title: "Sensitive profile",
    description:
      "Whether X has flagged the account as sensitive. That is a profile setting/label, not a silent reach limit — but it changes how media is shown.",
  },
  {
    title: "Account privacy",
    description:
      "Whether the account is public or protected. Protected accounts make outsider visibility tests unmeasurable.",
  },
];

const SIGNS: Sign[] = [
  {
    title: "Sudden engagement drop",
    description:
      "Likes, replies, and reposts fall off without an obvious content change.",
  },
  {
    title: "Search invisibility",
    description:
      "Your posts do not appear when people search your handle or related keywords.",
  },
  {
    title: "Missing autocomplete",
    description:
      "Your username no longer shows up in search suggestions as people type.",
  },
  {
    title: "You still see yourself",
    description:
      "Logged-in views of your own account look normal — which is why shadowbans are easy to miss.",
  },
];

const STEPS = [
  {
    title: "Install the WakeMark Chrome extension",
    description:
      "Add WakeMark from the Chrome Web Store. The shadowban test lives in the popup Health tab.",
  },
  {
    title: "Open Health and enter a username",
    description:
      "Type any public @handle. The first run may ask for permission to access x.com for guest visibility checks.",
  },
  {
    title: "Read the signals",
    description:
      "Restricted / Detected means a visibility problem. Unmeasurable means X blocked the guest check or the account settings make the test inconclusive.",
  },
];

const FAQS: FaqItem[] = [
  {
    question: "What is a shadow ban on X (Twitter)?",
    answer:
      "A shadow ban (also called a stealth ban or search ban) is when X limits how widely your account or posts appear — often without a notification. Your own timeline can look fine while outsiders cannot find you in search.",
  },
  {
    question: "How does the WakeMark shadowban checker work?",
    answer:
      "The Chrome extension runs checks from a logged-out guest session whenever possible, so your own login cannot mask a search ban. It looks at search visibility, suggestion visibility, sensitive-profile flags, and public vs protected privacy.",
  },
  {
    question: "Why does Search Ban show Restricted when no posts are found?",
    answer:
      "If none of your recent posts appear for your handle in search, that is treated as the classic search-ban signal — the same pattern people confirm manually with a logged-out from:@username search.",
  },
  {
    question: "Do I need to log into WakeMark or X to run the test?",
    answer:
      "You do not need a WakeMark login for the Health / shadowban test. The extension uses a guest view of X. Sign-in is only required for bookmark search and Ask AI.",
  },
  {
    question: "What should I do if I am restricted?",
    answer:
      "Pause aggressive automation, remove content that may violate X rules, take a short break from posting, then return with normal engagement. Many search restrictions lift on their own within a few days.",
  },
];

export default function ShadowbanCheckTool() {
  return (
    <div className="min-h-screen relative">
      <BG1 />
      <div className="relative z-10 container max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="space-y-4 mb-10">
          <p className="text-xs font-semibold tracking-[0.14em] uppercase text-muted-foreground">
            Free tools
          </p>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-balance">
            X (Twitter) Shadowban Checker
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl text-pretty">
            Check if your X account is search-banned or hidden from suggestions.
            WakeMark&apos;s Chrome extension verifies search visibility and
            profile settings from a guest session — free, no WakeMark login
            required.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <ChromeInstallButton
              label="Install Chrome Extension"
              size="lg"
            />
            <p className="text-sm text-muted-foreground">
              Free · Instant · Runs in the Health tab
            </p>
          </div>
        </div>

        <section className="grid sm:grid-cols-3 gap-4 mb-16">
          {[
            {
              icon: Search,
              title: "Search visibility",
              text: "Catch the classic from:@handle empty-search signal.",
            },
            {
              icon: EyeOff,
              title: "Suggestion checks",
              text: "See whether autocomplete still surfaces your handle.",
            },
            {
              icon: ShieldAlert,
              title: "Profile settings",
              text: "Sensitive flags and protected accounts explained clearly.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="border border-border bg-background/70 p-5 space-y-2"
            >
              <item.icon className="size-5" aria-hidden />
              <h2 className="font-semibold">{item.title}</h2>
              <p className="text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </section>

        <section className="mb-16 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              What is a shadow ban on X?
            </h2>
            <p className="text-muted-foreground text-pretty">
              A shadow ban is when X quietly reduces how discoverable your
              account is. Posts may still exist on your profile, but they fail
              to show up in search, suggestions, or other people&apos;s feeds.
              Because there is often no in-app warning, creators only notice
              after engagement collapses.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {SIGNS.map((sign) => (
              <div
                key={sign.title}
                className="border border-border p-4 space-y-1 bg-background/60"
              >
                <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="size-4 text-destructive" />
                  {sign.title}
                </div>
                <p className="text-sm text-muted-foreground">
                  {sign.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              What WakeMark checks
            </h2>
            <p className="text-muted-foreground">
              The Health tab in the extension reports the same signals people
              use for a manual shadowban test — without relying on your own
              logged-in search results.
            </p>
          </div>
          <div className="space-y-3">
            {CHECKS.map((check) => (
              <div
                key={check.title}
                className="border border-border p-4 flex gap-3 bg-background/60"
              >
                <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium">{check.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {check.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              How to run the test
            </h2>
          </div>
          <ol className="space-y-4">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="border border-border p-4 bg-background/60 flex gap-4"
              >
                <span className="flex size-8 shrink-0 items-center justify-center border border-border font-semibold text-sm">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <div className="border border-border bg-muted/40 p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex gap-3 items-start">
              <Sparkles className="size-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Ready to check your account?</p>
                <p className="text-sm text-muted-foreground">
                  Install WakeMark, open the popup, switch to Health, and enter
                  your @username.
                </p>
              </div>
            </div>
            <ChromeInstallButton label="Install Chrome Extension" />
          </div>
        </section>

        <section className="mb-16 space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">FAQ</h2>
          <Accordion type="single" collapsible className="w-full border border-border px-4 bg-background/60">
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

        <section className="border border-border p-6 sm:p-8 bg-background/70 space-y-3">
          <h2 className="text-xl font-semibold">
            More than a shadowban check
          </h2>
          <p className="text-muted-foreground text-pretty">
            WakeMark also syncs your X bookmarks, auto-tags them with AI, and
            lets you search or Ask AI across everything you saved — including
            via MCP in Cursor and Claude.
          </p>
          <div className="flex flex-wrap gap-4 pt-1 text-sm">
            <I18nLink
              href="/tools/twitter-advanced-search"
              className="underline underline-offset-4 hover:text-foreground text-muted-foreground"
            >
              Advanced Twitter Search
            </I18nLink>
            <I18nLink
              href="/tools/twitter-screenshot"
              className="underline underline-offset-4 hover:text-foreground text-muted-foreground"
            >
              Twitter Screenshot Generator
            </I18nLink>
            <I18nLink
              href="/docs/extension"
              className="underline underline-offset-4 hover:text-foreground text-muted-foreground"
            >
              Extension docs
            </I18nLink>
            <I18nLink
              href="/docs/mcp"
              className="underline underline-offset-4 hover:text-foreground text-muted-foreground"
            >
              MCP docs
            </I18nLink>
            <I18nLink
              href="/#pricing"
              className="underline underline-offset-4 hover:text-foreground text-muted-foreground"
            >
              Pricing
            </I18nLink>
          </div>
        </section>
      </div>
    </div>
  );
}
