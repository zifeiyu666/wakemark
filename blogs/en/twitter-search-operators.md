---
title: "Twitter Search Operators: The Complete List"
slug: "twitter-search-operators"
description: "A practical Twitter search operators list for X: from:, since:, until:, min_faves:, filter:images, and more, with examples you can type or generate in a free advanced search form."
publishedAt: "2026-09-10"
status: "published"
visibility: "public"
isPinned: false
tags: "twitter search operators, twitter search operators list, X search syntax, advanced search"
featuredImageUrl: "/images/blog/twitter-search-operators.avif"
---

# Twitter Search Operators: The Complete List

Twitter search operators are short prefixes and filters you type into X search (`from:`, `since:`, `min_faves:`, `filter:images`, and the rest). They are the same feature people call X advanced search. This page is a readable list with examples, not a claim that every operator works for every account or every old post.

X documents the basics in its [advanced search help](https://help.x.com/en/using-x/x-advanced-search). The official desktop form exposes only some of these. The rest you type by hand, or you use a form that writes them.

> Prefer fields over syntax? Open our [advanced twitter search](/tools/twitter-advanced-search) tool, fill the filters, and copy the live query.

## Words and phrases

| Goal | Operator / pattern | Example |
| --- | --- | --- |
| All of these words | space-separated terms | `indie hacker` |
| Exact phrase | `"phrase"` | `"product market fit"` |
| Any of these words | `(a OR b)` | `(launch OR shipped)` |
| Exclude a word | `-term` | `coffee -decaf` |
| Hashtag | `#tag` | `#buildinpublic` |
| Language | `lang:code` | `lang:en` |

## Accounts

| Goal | Operator | Example |
| --- | --- | --- |
| From an account | `from:handle` | `from:nasa` |
| Replies to an account | `to:handle` | `to:openai` |
| Mentions an account | `@handle` | `@vercel` |

Walkthrough for single-account search: [search tweets from a specific user](/blog/search-tweets-from-a-user).

## Engagement floors

| Goal | Operator | Example |
| --- | --- | --- |
| Minimum likes | `min_faves:N` | `min_faves:500` |
| Minimum replies | `min_replies:N` | `min_replies:10` |
| Minimum reposts | `min_retweets:N` | `min_retweets:10` |

These cut the long tail. They also wipe results if you set them too high on a niche topic.

## Post type and media

| Goal | Operator |
| --- | --- |
| Replies only | `filter:replies` |
| Reposts only | `filter:retweets` |
| Quotes only | `filter:quote` |
| Original-ish (exclude replies, reposts, quotes) | `-filter:replies -filter:retweets -filter:quote` |
| Images | `filter:images` |
| Video | `filter:videos` |
| GIFs | `filter:gifs` |
| Has links | `filter:links` |
| No links | `-filter:links` |

## Dates

| Goal | Operator | Example |
| --- | --- | --- |
| On or after a day | `since:YYYY-MM-DD` | `since:2024-01-01` |
| Before a day (exclusive) | `until:YYYY-MM-DD` | `until:2024-07-01` |

`until:` does not include that calendar day. To cover all of June 2024, use `since:2024-06-01 until:2024-07-01`. More detail: [how to search tweets by date](/blog/twitter-search-by-date).

## Location, links, verification

| Goal | Operator | Example |
| --- | --- | --- |
| Near a place | `near:"City"` | `near:"Austin"` |
| Within miles | `within:Nmi` | `within:15mi` |
| Near you | `near:me` | (needs X location permission) |
| Links to a domain | `url:domain` | `url:github.com` |
| Verified accounts | `filter:verified` | `filter:verified` |
| Accounts you follow | `filter:follows` | (needs you signed in) |

Location search only covers posts that carry location data. Coverage is uneven.

## Example queries worth copying

Brand mentions without the @ or hashtag:

```text
(wakemark OR "wake mark") -from:wakemarkapp
```

High-signal posts on a topic:

```text
"product market fit" min_faves:200 lang:en
```

One account, one topic, one half-year:

```text
from:nytimes climate since:2024-01-01 until:2024-07-01
```

Links to a site from verified accounts:

```text
url:nytimes.com filter:verified
```

## Operators vs the official form

X’s own advanced search form covers words, accounts, engagement, and dates well. Several rows above (media-only filters, domain `url:`, verified-only, quote-only) are easier as typed operators or as fields in a third-party builder. Nothing in this list is a hidden API: it is syntax X already runs when you search.

## Limits that matter

- Protected accounts do not appear in public search.
- X’s index is incomplete for some old, low-engagement posts.
- Contradicting filters (require links and also exclude links) return nothing.
- You need an X session to *view* results; building the query string does not require WakeMark signup ([search Twitter without an account](/blog/search-twitter-without-an-account)).

## FAQ

### What are Twitter search operators?

Short search syntax for X: prefixes like `from:` and `since:`, and filters like `filter:images`. They narrow results beyond a plain keyword.

### Is there a complete Twitter search operators list?

This page covers the operators people use most for research and day-to-day search. X may add or change behavior over time; treat official help as the source of truth when something stops working.

### Do operators still work after the Twitter to X rename?

Yes. The same operators work on x.com search. People still search for “Twitter” and “tweet”; the syntax did not rename.

### Should I memorize these or use a form?

Memorize the few you use weekly (`from:`, `since:`, `min_faves:`). For rare combinations, a form that writes the query is faster and less error-prone.

## Recap

Twitter search operators are how advanced search actually works under the hood. Start with words, `from:`, and dates; add engagement and media filters when the feed is noisy. When you want the list applied without typing, use [advanced twitter search](/tools/twitter-advanced-search).

**Read next:** [How to search tweets by date](/blog/twitter-search-by-date) · [How to search tweets from a specific user](/blog/search-tweets-from-a-user)
