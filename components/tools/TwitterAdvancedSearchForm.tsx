"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SEARCH_LANGUAGES } from "@/lib/twitter-search/languages";
import {
  EMPTY_FILTERS,
  buildAdvancedSearchQuery,
  buildXSearchUrl,
  type AdvancedSearchFilters,
  type FollowsFilter,
  type LinksFilter,
  type LocationMode,
  type MediaType,
  type SearchTab,
  type TweetType,
} from "@/lib/twitter-search/query";
import { Check, Copy, RotateCcw, Search } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

const STORAGE_KEY = "wakemark.twitter-advanced-search.v1";
const MAX_RECENT = 5;
const ANY_LANGUAGE = "__any__";

type RecentSearch = {
  query: string;
  savedAt: number;
  filters: AdvancedSearchFilters;
};

function loadRecent(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentSearch[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(entry: RecentSearch, existing: RecentSearch[]): RecentSearch[] {
  const next = [
    entry,
    ...existing.filter((item) => item.query !== entry.query),
  ].slice(0, MAX_RECENT);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

function Field({
  id,
  label,
  operator,
  children,
}: {
  id: string;
  label: string;
  operator?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5 min-w-0">
      <Label htmlFor={id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span>{label}</span>
        {operator ? (
          <code className="text-[11px] font-normal text-muted-foreground">{operator}</code>
        ) : null}
      </Label>
      {children}
    </div>
  );
}

function RadioLine({
  id,
  value,
  label,
}: {
  id: string;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <RadioGroupItem value={value} id={id} />
      <Label htmlFor={id} className="font-normal">
        {label}
      </Label>
    </div>
  );
}

export default function TwitterAdvancedSearchForm() {
  const [filters, setFilters] = useState<AdvancedSearchFilters>(EMPTY_FILTERS);
  const [tab, setTab] = useState<SearchTab>("live");
  const [recent, setRecent] = useState<RecentSearch[]>([]);
  const [copied, setCopied] = useState<"query" | "url" | null>(null);

  const query = useMemo(() => buildAdvancedSearchQuery(filters), [filters]);
  const searchUrl = useMemo(() => (query ? buildXSearchUrl(query, tab) : ""), [query, tab]);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  function patch<K extends keyof AdvancedSearchFilters>(
    key: K,
    value: AdvancedSearchFilters[K]
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function rememberAndOpen() {
    if (!query || !searchUrl) {
      toast.error("Add at least one filter before searching.");
      return;
    }
    setRecent(
      saveRecent(
        { query, savedAt: Date.now(), filters: { ...filters } },
        recent
      )
    );
    window.open(searchUrl, "_blank", "noopener,noreferrer");
  }

  async function copyText(kind: "query" | "url") {
    const value = kind === "query" ? query : searchUrl;
    if (!value) {
      toast.error("Nothing to copy yet.");
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      toast.success(kind === "query" ? "Query copied" : "X search URL copied");
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      toast.error("Could not copy. Select the text and copy it manually.");
    }
  }

  return (
    <form
      className="border border-border bg-background/80"
      onSubmit={(event) => {
        event.preventDefault();
        rememberAndOpen();
      }}
    >
      <div className="border-b border-border bg-background p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
          <p className="text-sm font-medium">Live X search query</p>
          <div className="flex flex-wrap gap-2">
            <Select
              value={tab}
              onValueChange={(value) => setTab(value as SearchTab)}
            >
              <SelectTrigger className="w-[140px]" size="sm" aria-label="Result tab">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="live">Latest</SelectItem>
                <SelectItem value="top">Top</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" size="sm" disabled={!query}>
              <Search />
              Search on X
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => copyText("query")}
              disabled={!query}
            >
              {copied === "query" ? <Check /> : <Copy />}
              Copy query
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => copyText("url")}
              disabled={!searchUrl}
            >
              {copied === "url" ? <Check /> : <Copy />}
              Copy URL
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setFilters(EMPTY_FILTERS)}
            >
              <RotateCcw />
              Reset
            </Button>
          </div>
        </div>
        <pre className="min-h-12 whitespace-pre-wrap break-all rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-xs sm:text-sm">
          {query || "Fill in any filter. The X search operators appear here."}
        </pre>
      </div>

      <div className="p-4 sm:p-6 space-y-10">
        <section className="space-y-4">
          <p className="text-sm font-semibold tracking-[0.12em] uppercase text-muted-foreground">
            Words
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field id="all-words" label="Include all of these words" operator="AND">
              <Input
                id="all-words"
                value={filters.allWords}
                onChange={(event) => patch("allWords", event.target.value)}
                placeholder="indie hacker growth"
              />
            </Field>
            <Field id="exact-phrase" label="Include this exact phrase" operator={`"phrase"`}>
              <Input
                id="exact-phrase"
                value={filters.exactPhrase}
                onChange={(event) => patch("exactPhrase", event.target.value)}
                placeholder="product market fit"
              />
            </Field>
            <Field id="any-words" label="Include any of these words" operator="OR">
              <Input
                id="any-words"
                value={filters.anyWords}
                onChange={(event) => patch("anyWords", event.target.value)}
                placeholder="launch, release, shipped"
              />
            </Field>
            <Field id="exclude-words" label="Exclude these words" operator="-term">
              <Input
                id="exclude-words"
                value={filters.excludeWords}
                onChange={(event) => patch("excludeWords", event.target.value)}
                placeholder="giveaway, nft"
              />
            </Field>
            <Field id="hashtags" label="Hashtags" operator="#tag">
              <Input
                id="hashtags"
                value={filters.hashtags}
                onChange={(event) => patch("hashtags", event.target.value)}
                placeholder="buildinpublic, saas"
              />
            </Field>
            <Field id="language" label="Language" operator="lang:">
              <Select
                value={filters.language || ANY_LANGUAGE}
                onValueChange={(value) =>
                  patch("language", value === ANY_LANGUAGE ? "" : value)
                }
              >
                <SelectTrigger id="language" className="w-full">
                  <SelectValue placeholder="Any language" />
                </SelectTrigger>
                <SelectContent>
                  {SEARCH_LANGUAGES.map((language) => (
                    <SelectItem
                      key={language.code || ANY_LANGUAGE}
                      value={language.code || ANY_LANGUAGE}
                    >
                      {language.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </section>

        <section className="space-y-4">
          <p className="text-sm font-semibold tracking-[0.12em] uppercase text-muted-foreground">
            Accounts
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field id="from-accounts" label="From these accounts" operator="from:">
              <Input
                id="from-accounts"
                value={filters.fromAccounts}
                onChange={(event) => patch("fromAccounts", event.target.value)}
                placeholder="@nasa"
              />
            </Field>
            <Field id="to-accounts" label="To these accounts" operator="to:">
              <Input
                id="to-accounts"
                value={filters.toAccounts}
                onChange={(event) => patch("toAccounts", event.target.value)}
                placeholder="@openai"
              />
            </Field>
            <Field id="mentioning" label="Mentioning these accounts" operator="@">
              <Input
                id="mentioning"
                value={filters.mentioningAccounts}
                onChange={(event) => patch("mentioningAccounts", event.target.value)}
                placeholder="@vercel"
              />
            </Field>
          </div>
        </section>

        <section className="space-y-4">
          <p className="text-sm font-semibold tracking-[0.12em] uppercase text-muted-foreground">
            Engagement
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field id="min-likes" label="Min likes" operator="min_faves:">
              <Input
                id="min-likes"
                type="number"
                min={1}
                inputMode="numeric"
                value={filters.minLikes}
                onChange={(event) => patch("minLikes", event.target.value)}
                placeholder="100"
              />
            </Field>
            <Field id="min-replies" label="Min replies" operator="min_replies:">
              <Input
                id="min-replies"
                type="number"
                min={1}
                inputMode="numeric"
                value={filters.minReplies}
                onChange={(event) => patch("minReplies", event.target.value)}
                placeholder="10"
              />
            </Field>
            <Field id="min-reposts" label="Min reposts" operator="min_retweets:">
              <Input
                id="min-reposts"
                type="number"
                min={1}
                inputMode="numeric"
                value={filters.minRetweets}
                onChange={(event) => patch("minRetweets", event.target.value)}
                placeholder="10"
              />
            </Field>
          </div>
        </section>

        <section className="space-y-4">
          <p className="text-sm font-semibold tracking-[0.12em] uppercase text-muted-foreground">
            Filters
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="space-y-3">
              <p className="text-sm font-medium">Tweet type</p>
              <RadioGroup
                value={filters.tweetType}
                onValueChange={(value) => patch("tweetType", value as TweetType)}
                className="gap-2"
              >
                <RadioLine id="type-all" value="all" label="Show all" />
                <RadioLine id="type-original" value="original" label="Original posts" />
                <RadioLine id="type-replies" value="replies" label="Only replies" />
                <RadioLine id="type-reposts" value="retweets" label="Only reposts" />
                <RadioLine id="type-quotes" value="quotes" label="Only quotes" />
              </RadioGroup>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">Media</p>
              <RadioGroup
                value={filters.media}
                onValueChange={(value) => patch("media", value as MediaType)}
                className="gap-2"
              >
                <RadioLine id="media-all" value="all" label="Show all" />
                <RadioLine id="media-images" value="images" label="Only images" />
                <RadioLine id="media-videos" value="videos" label="Only videos" />
                <RadioLine id="media-gifs" value="gifs" label="Only GIFs" />
              </RadioGroup>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">Links</p>
              <RadioGroup
                value={filters.links}
                onValueChange={(value) => patch("links", value as LinksFilter)}
                className="gap-2"
              >
                <RadioLine id="links-all" value="all" label="Include posts with links" />
                <RadioLine id="links-only" value="only" label="Only posts with links" />
                <RadioLine id="links-none" value="none" label="Don't show posts with links" />
              </RadioGroup>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <p className="text-sm font-semibold tracking-[0.12em] uppercase text-muted-foreground">
            Dates
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field id="since" label="From date" operator="since:">
              <Input
                id="since"
                type="date"
                value={filters.since}
                onChange={(event) => patch("since", event.target.value)}
              />
            </Field>
            <Field id="until" label="To date" operator="until:">
              <Input
                id="until"
                type="date"
                value={filters.until}
                onChange={(event) => patch("until", event.target.value)}
              />
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">
            until: is exclusive. To include June 30, set To date to July 1.
          </p>
        </section>

        <section className="space-y-4">
          <p className="text-sm font-semibold tracking-[0.12em] uppercase text-muted-foreground">
            Location
          </p>
          <RadioGroup
            value={filters.locationMode}
            onValueChange={(value) => patch("locationMode", value as LocationMode)}
            className="flex flex-col sm:flex-row gap-3 sm:gap-6"
          >
            <RadioLine id="loc-anywhere" value="anywhere" label="Anywhere" />
            <RadioLine id="loc-near-you" value="nearYou" label="Near you" />
            <RadioLine id="loc-place" value="place" label="Near a place" />
          </RadioGroup>
          {filters.locationMode === "place" ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <Field id="location" label="Location" operator='near:"city"'>
                <Input
                  id="location"
                  value={filters.location}
                  onChange={(event) => patch("location", event.target.value)}
                  placeholder="Austin"
                />
              </Field>
              <Field id="distance" label="Distance (miles)" operator="within:">
                <Input
                  id="distance"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={filters.distanceMiles}
                  onChange={(event) => patch("distanceMiles", event.target.value)}
                  placeholder="15"
                />
              </Field>
            </div>
          ) : null}
          {filters.locationMode === "nearYou" ? (
            <p className="text-xs text-muted-foreground">
              near:me only works after X can use your location in the logged-in session.
            </p>
          ) : null}
        </section>

        <section className="space-y-4">
          <p className="text-sm font-semibold tracking-[0.12em] uppercase text-muted-foreground">
            Sources and verification
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field id="domains" label="Target domains" operator="url:">
              <Input
                id="domains"
                value={filters.domains}
                onChange={(event) => patch("domains", event.target.value)}
                placeholder="github.com, nytimes.com"
              />
            </Field>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={filters.verifiedOnly}
                  onCheckedChange={(checked) =>
                    patch("verifiedOnly", checked === true)
                  }
                />
                Verified accounts only
                <code className="text-[11px] text-muted-foreground">filter:verified</code>
              </label>
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <p className="text-sm font-medium">Posted by</p>
            <RadioGroup
              value={filters.follows}
              onValueChange={(value) => patch("follows", value as FollowsFilter)}
              className="flex flex-col sm:flex-row gap-3 sm:gap-6"
            >
              <RadioLine id="follows-anyone" value="anyone" label="From anyone" />
              <RadioLine
                id="follows-following"
                value="following"
                label="From accounts you follow"
              />
            </RadioGroup>
            {filters.follows === "following" ? (
              <p className="text-xs text-muted-foreground">
                filter:follows only works while you are signed in to X.
              </p>
            ) : null}
          </div>
        </section>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="submit" disabled={!query}>
            <Search />
            Search on X
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => copyText("query")}
            disabled={!query}
          >
            {copied === "query" ? <Check /> : <Copy />}
            Copy query
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => copyText("url")}
            disabled={!searchUrl}
          >
            {copied === "url" ? <Check /> : <Copy />}
            Copy URL
          </Button>
        </div>

        {recent.length > 0 ? (
          <section className="space-y-3">
            <p className="text-sm font-semibold tracking-[0.12em] uppercase text-muted-foreground">
              Recent searches in this browser
            </p>
            <ul className="space-y-2">
              {recent.map((item) => (
                <li key={`${item.savedAt}-${item.query}`}>
                  <button
                    type="button"
                    className="w-full text-left border border-border px-3 py-2 hover:bg-muted/40 transition-colors"
                    onClick={() => setFilters(item.filters)}
                  >
                    <code className="text-xs sm:text-sm break-all">{item.query}</code>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </form>
  );
}
