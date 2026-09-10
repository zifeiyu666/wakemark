---
title: "How to Search Tweets by Date on X (Twitter)"
slug: "twitter-search-by-date"
description: "Learn how to search tweets by date on X with since: and until:. Find old tweets that are still online, avoid exclusive end-date mistakes, and use a free form when typing operators gets tedious."
publishedAt: "2026-09-10"
status: "published"
visibility: "public"
isPinned: false
tags: "how to search tweets by date, twitter search by date, old tweets, since until, X search"
featuredImageUrl: "/images/blog/twitter-search-by-date.avif"
---

# How to Search Tweets by Date on X (Twitter)

How to search tweets by date on X (Twitter) means narrowing results with the `since:` and `until:` operators so you see posts from a window you choose, not whatever ranks this week. You can type those operators into X search, use X’s desktop advanced search form, or fill a date picker that writes the query for you.

This guide covers the operators, the exclusive end-date trap, how to find an old tweet that is still online, and when a form is faster than hand-written syntax.

## What “search by date” actually does

X search is not a complete archive of every post ever published. A date filter only searches what X still indexes. Low-engagement or very old posts can be missing even when your dates are correct.

What date search *does* well:

- Pin an event to the days it happened
- Read one account’s posts from a specific month
- Cut last week’s noise out of a topic search

Pair a date window with a keyword, a handle, or both. A bare date range with no other filter is usually too wide to be useful.

## The two operators: since: and until:

| Operator | Meaning | Example |
| --- | --- | --- |
| `since:YYYY-MM-DD` | Posts on or after that day | `since:2024-01-01` |
| `until:YYYY-MM-DD` | Posts **before** that day (exclusive) | `until:2024-07-01` |

**until: is exclusive.** It means posts strictly before that calendar day. To include everything through June 30, set `until:2024-07-01`, not `until:2024-06-30`.

Example for posts in June 2024 about a topic:

```text
climate since:2024-06-01 until:2024-07-01
```

Example for posts from one account in that month:

```text
from:nasa climate since:2024-06-01 until:2024-07-01
```

## How to find a tweet from a specific date

If you remember the day (or a narrow window) and roughly what it said:

1. Write down the date as `YYYY-MM-DD`.
2. Add one or two distinctive words from the post.
3. If you know who posted it, add `from:handle`.
4. Set `since:` to that day and `until:` to the next day so the window is a single day.

Single-day example:

```text
from:nytimes "interest rates" since:2024-03-20 until:2024-03-21
```

If you only know the month, use the first day of the month as `since:` and the first day of the next month as `until:`.

## How do you look at old tweets?

People ask this a few different ways: how do you look at old tweets, how can I find an old tweet, how do you find old tweets on Twitter. The workable answer is the same: use a date window plus whatever else you still remember (words, handle, hashtag). Date search only helps when the post is **still online**. If it was already deleted, that is a different problem — see [deleted tweets search](/blog/deleted-tweets-search).

Practical order:

1. **Handle + date** if you know whose post it was. That is usually enough.
2. **Keyword + date** if you do not remember the account.
3. **Exact phrase + date** if you remember a distinctive line in quotes.
4. Widen the window only if the first pass returns nothing. A year-long range with a vague keyword is hard to scroll.

X’s own apps still bury advanced filters. On desktop, [X’s advanced search help](https://help.x.com/en/using-x/x-advanced-search) documents the operators. On mobile there is still no advanced search form in the app, so you either type operators into the search bar or build the query in a browser tool and open the result on X.

> Typing `since:` and `until:` by hand is easy to get wrong, especially the exclusive end date. If you would rather pick dates and copy the query, use our free [advanced Twitter search tool](/tools/twitter-advanced-search). It writes the operators and opens X with Latest or Top selected.

## Where the official date form lives (and where it does not)

On desktop, X’s advanced search form includes From / To date fields. It is easy to miss if you only use the app search box. On mobile apps, that form is not there. Building the query in a browser, then opening X, is the reliable mobile path.

You still need to be signed in to X to view search results. The date filters live in the URL, so they survive the login screen. If you only want to understand that login wall, see [search Twitter without an account](/blog/search-twitter-without-an-account).

## Common mistakes

- **Using until: as inclusive.** To include June 30, use July 1 as To date.
- **Date only, no keyword or handle.** Results are too broad.
- **Expecting a perfect archive.** Old, quiet posts may never appear.
- **Contradicting filters.** For example a tight date range plus a high `min_faves:` floor can wipe the results.

If you need more operators than dates (likes floors, media filters, domains), keep a [Twitter search operators](/blog/twitter-search-operators) list nearby. To limit results to one person first, see [how to search tweets from a specific user](/blog/search-tweets-from-a-user).

## FAQ

### How do I search tweets by date on X?

Use `since:YYYY-MM-DD` and/or `until:YYYY-MM-DD` in the search box, or fill From date and To date in advanced search / a query builder. Pair the window with a keyword or `from:handle`. Remember that until: stops *before* that day.

### How can I find an old tweet if I only remember the month?

Set `since:` to the first day of the month and `until:` to the first day of the next month. Add the account or a distinctive phrase. Narrow week by week if the month is still too noisy.

### Does Twitter search by date work on mobile?

Yes, if you type the operators into search, or build the query in a mobile browser and open X. The official mobile apps still do not expose a dedicated advanced search form with date pickers.

### Why are there no results for dates I know had posts?

X’s index is incomplete for some old or low-engagement posts. Try a wider window, drop engagement floors, and confirm the account is still public. Protected accounts will not show up in public search.

## Recap

To search tweets by date: use `since:` and `until:`, treat until: as exclusive, and always add a handle or keyword when you can. That is also how you look at old tweets that are still online. When the syntax slows you down, [build the date filter in WakeMark’s advanced Twitter search](/tools/twitter-advanced-search) and open the results on X.

**Read next:** [How to search tweets from a specific user](/blog/search-tweets-from-a-user) · [Twitter search operators](/blog/twitter-search-operators)
