import ChromeInstallButton from "@/components/home/ChromeInstallButton";
import { BG1 } from "@/components/shared/BGs";
import TwitterAdvancedSearchForm from "@/components/tools/TwitterAdvancedSearchForm";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link as I18nLink } from "@/i18n/routing";
import {
  COMPARISON_ROWS,
  FAQS,
  FILTER_GROUPS,
  RECIPES,
} from "@/lib/twitter-search/content";
import {
  OPERATOR_TEASER_ROWS,
  SEARCH_GUIDES,
} from "@/lib/twitter-search/guides";
import { Bookmark, Calendar, Search } from "lucide-react";

export default function TwitterAdvancedSearchTool() {
  return (
    <div className="min-h-screen relative w-full">
      <BG1 />
      <div className="relative z-10 container max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="space-y-4 mb-10">
          <p className="text-xs font-semibold tracking-[0.14em] uppercase text-muted-foreground">
            Free tools
          </p>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-balance">
            Advanced Twitter Search
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl text-pretty">
            Fill in the filters you need, from date range and account to
            minimum likes and media type. We write the X (Twitter) search query
            for you. Free, no WakeMark account required.
          </p>
        </div>

        <section className="grid sm:grid-cols-3 gap-4 mb-10">
          {[
            {
              icon: Search,
              title: "23+ filters in one form",
              text: "Words, accounts, dates, engagement, media, location, and verification.",
            },
            {
              icon: Calendar,
              title: "Twitter search by date",
              text: "since: and until: without memorizing operators or hunting X's desktop-only form.",
            },
            {
              icon: Bookmark,
              title: "No WakeMark signup",
              text: "Build and copy the query in the browser. Recent searches stay on this device.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="border border-border bg-background/70 p-5 space-y-2"
            >
              <item.icon className="size-5" aria-hidden />
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </section>

        <TwitterAdvancedSearchForm />

        <section className="mt-16 space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            What advanced Twitter search is
          </h2>
          <p className="text-muted-foreground text-pretty max-w-3xl">
            Advanced Twitter search lets you narrow posts by words, account,
            date range, engagement, language, and media type instead of
            scrolling a keyword feed. This Twitter search tool exposes those
            filters as form fields, writes the X search syntax, and opens the
            results on X. It is free. You do not need a WakeMark account to use
            it.
          </p>
        </section>

        <section className="mt-16 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              What each filter group does
            </h2>
            <p className="text-muted-foreground max-w-3xl">
              Seven groups of Twitter search filters. Pick only the ones you
              need. Every field is optional, and an empty field is left out of
              the query. Dates use{" "}
              <code className="text-xs bg-muted/50 px-1.5 py-0.5">since:</code>{" "}
              and{" "}
              <code className="text-xs bg-muted/50 px-1.5 py-0.5">until:</code>
              ; until: is exclusive, so to include June 30 set To date to July
              1. For the full walkthrough, see{" "}
              <I18nLink
                href="/blog/twitter-search-by-date"
                className="underline underline-offset-4 text-foreground"
              >
                how to search tweets by date
              </I18nLink>
              .
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {FILTER_GROUPS.map((group) => (
              <div
                key={group.title}
                className="border border-border bg-background/60 p-5 space-y-2"
              >
                <h3 className="font-medium">{group.title}</h3>
                <p className="text-sm text-muted-foreground">{group.body}</p>
                <code className="block text-xs bg-muted/50 px-2 py-1 w-fit">
                  {group.example}
                </code>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            Search one account&apos;s posts for a keyword
          </h2>
          <p className="text-muted-foreground max-w-3xl">
            Put the handle in From these accounts and the term in Include all
            of these words. Example:{" "}
            <code className="bg-muted/50 px-1.5 py-0.5 text-sm">
              from:nytimes climate since:2024-01-01
            </code>
            . Step-by-step, including{" "}
            <code className="text-xs bg-muted/50 px-1 py-0.5">to:</code> and{" "}
            <code className="text-xs bg-muted/50 px-1 py-0.5">@</code> mentions:{" "}
            <I18nLink
              href="/blog/search-tweets-from-a-user"
              className="underline underline-offset-4 text-foreground"
            >
              how to search tweets from a specific user
            </I18nLink>
            .
          </p>
        </section>

        <section className="mt-16 space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Common X search operators this form writes
            </h2>
            <p className="text-muted-foreground max-w-3xl">
              A short sample. X supports more syntax than its own advanced
              search form shows. For the full list with examples, read{" "}
              <I18nLink
                href="/blog/twitter-search-operators"
                className="underline underline-offset-4 text-foreground"
              >
                Twitter search operators
              </I18nLink>
              .
            </p>
          </div>
          <div className="border border-border bg-background/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead>Operator it writes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {OPERATOR_TEASER_ROWS.map((row) => (
                  <TableRow key={row.field}>
                    <TableCell>{row.field}</TableCell>
                    <TableCell>
                      <code className="text-xs sm:text-sm">{row.operator}</code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="mt-16 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Searches worth saving
            </h2>
            <p className="text-muted-foreground max-w-3xl">
              Combinations worth setting up once. Run them, then reuse from
              Recent searches on this device, or copy the URL into a bookmark.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {RECIPES.map((recipe) => (
              <div
                key={recipe.title}
                className="border border-border bg-background/60 p-5 space-y-2"
              >
                <h3 className="font-medium">{recipe.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {recipe.description}
                </p>
                <p className="text-sm">{recipe.setup}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            Do you need an X account?
          </h2>
          <p className="text-muted-foreground max-w-3xl">
            Building the query here: no WakeMark signup. Viewing results on X:
            yes, X currently asks you to sign in. The filters stay in the URL
            through that login. Full explanation:{" "}
            <I18nLink
              href="/blog/search-twitter-without-an-account"
              className="underline underline-offset-4 text-foreground"
            >
              search Twitter without an account
            </I18nLink>
            .
          </p>
        </section>

        <section className="mt-16 space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            Advanced Twitter search on mobile
          </h2>
          <p className="text-muted-foreground max-w-3xl">
            X&apos;s mobile apps have no advanced search form. Open this page in
            your phone&apos;s browser, set the filters, and search from here.
            The form is the same as on desktop. Results open in X, in the app if
            you have it installed.
          </p>
        </section>

        <section className="mt-16 space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              How this compares to X&apos;s own advanced search
            </h2>
            <p className="text-muted-foreground max-w-3xl">
              X can run almost all of these searches. The difference is that
              several rows below are syntax you have to know, because its own
              form does not offer them. Nothing here is a trick X cannot do.
            </p>
          </div>
          <div className="border border-border bg-background/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filter</TableHead>
                  <TableHead>X&apos;s form</TableHead>
                  <TableHead>Here</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {COMPARISON_ROWS.map((row) => (
                  <TableRow key={row.feature}>
                    <TableCell>{row.feature}</TableCell>
                    <TableCell>{row.xForm}</TableCell>
                    <TableCell>{row.here}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="mt-16 space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            What this tool cannot do
          </h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="border border-border bg-background/60 p-4">
              It does not show results on this page. Searches open on X, which
              is where the posts live.
            </li>
            <li className="border border-border bg-background/60 p-4">
              It cannot reach private or protected posts. If an account is
              locked, no public search finds those posts.
            </li>
            <li className="border border-border bg-background/60 p-4">
              It does not cover every post ever made. X&apos;s search index is
              not a complete archive, so old and low-engagement posts can be
              missing even with the right filters.
            </li>
            <li className="border border-border bg-background/60 p-4">
              It does not monitor or alert. A recent search is a filter set you
              re-run, not a watch that notifies you.
            </li>
          </ul>
        </section>

        <section className="mt-16 space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            Twitter advanced search FAQ
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

        <section className="mt-16 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Twitter Search Guides
            </h2>
            <p className="text-muted-foreground max-w-3xl">
              Longer walkthroughs for date range, single-account search,
              operators, searching without an account, and deleted tweets
              (what actually works).
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {SEARCH_GUIDES.map((guide) => (
              <I18nLink
                key={guide.href}
                href={guide.href}
                className="border border-border bg-background/60 p-5 space-y-2 hover:bg-muted/40 transition-colors block"
              >
                <h3 className="font-medium">{guide.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {guide.description}
                </p>
              </I18nLink>
            ))}
          </div>
        </section>

        <section className="mt-16 border border-border p-6 sm:p-8 bg-background/70 space-y-3">
          <h2 className="text-xl font-semibold">
            Keep the tweets you actually want to find again
          </h2>
          <p className="text-muted-foreground text-pretty">
            Advanced search finds posts on X. WakeMark keeps the ones you save:
            full bookmark history, AI tags, Ask AI, and MCP in Cursor or Claude.
            If search visibility looks off, run the{" "}
            <I18nLink
              href="/tools/shadowban-check"
              className="underline underline-offset-4"
            >
              shadowban checker
            </I18nLink>{" "}
            from the Chrome extension.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <ChromeInstallButton label="Install Chrome Extension" />
            <I18nLink
              href="/docs/mcp"
              className="text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground"
            >
              MCP docs
            </I18nLink>
          </div>
        </section>
      </div>
    </div>
  );
}
