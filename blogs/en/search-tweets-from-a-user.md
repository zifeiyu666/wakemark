---
title: "How to Search Tweets from a Specific User on X"
slug: "search-tweets-from-a-user"
description: "Search tweets from a specific user on X with from: plus a keyword. Learn how to: and @mentions differ, combine date ranges, and generate the query without memorizing operators."
publishedAt: "2026-09-10"
status: "published"
visibility: "public"
isPinned: false
tags: "search tweets from a user, twitter search from account, from operator, X search"
featuredImageUrl: "/images/blog/search-tweets-from-a-user.avif"
---

# How to Search Tweets from a Specific User on X

Searching tweets from a specific user on X means limiting results to posts written by one (or a few) accounts, usually with `from:handle`. Add a keyword when you want that person's posts about a topic, not their entire timeline.

This is the pattern X buries hardest: people try the profile search box, scroll for minutes, and still miss it. The reliable method is `from:` in search, optionally with dates and other filters.

## What from: does (and what it does not)

| Operator | What it matches |
| --- | --- |
| `from:handle` | Posts authored by that account |
| `to:handle` | Replies directed at that account |
| `@handle` | Posts that mention the account |

`from:` is “things they wrote.” `to:` is “replies sent to them.” `@` is “anyone who tagged them.” Mixing these up is the most common reason a “search this person’s tweets” attempt feels broken.

Handles work with or without `@`. `from:nasa` and `from:@nasa` both work. Multiple accounts become an OR group:

```text
(from:nasa OR from:esa) climate
```

## Search one account for a keyword

1. Put the handle in the From field (or type `from:handle`).
2. Put the topic words in the all-words / keyword field.
3. Open Latest if you want chronological results instead of Top.

Example:

```text
from:nytimes climate
```

That returns posts *by* @nytimes that contain “climate,” not every post that mentions the Times.

> Prefer checkboxes over typing operators? Use our [Twitter search generator](/tools/twitter-advanced-search): set From these accounts, add your words, then Search on X or copy the query.

## Add a date range when you only want a window

Old posts from one account are easier when you combine `from:` with `since:` / `until:`. Remember that `until:` is exclusive (posts before that day).

```text
from:nasa climate since:2024-01-01 until:2024-07-01
```

Full date walkthrough: [how to search tweets by date](/blog/twitter-search-by-date).

## Mentions and replies: related but different jobs

Use these when the goal is not “what they posted,” but “what people said to or about them.”

- Replies to the account: `to:handle`
- Mentions of the account: `@handle` or `(@handle)`
- Mentions without their own posts dominating: combine carefully; start with `@handle -from:handle` if you want other people’s mentions only

Example: people talking *to* OpenAI’s account:

```text
to:openai
```

Example: posts that mention Vercel:

```text
@vercel
```

## Multiple accounts and exclusions

Comma-separated handles in a form, or OR in the query box:

```text
(from:verge OR from:techcrunch) "apple"
```

Exclude noise with `-term`:

```text
from:nasa -giveaway -nft
```

More operators: [Twitter search operators](/blog/twitter-search-operators).

## Why profile search feels broken

On a profile page, X’s on-page search is limited and easy to confuse with global search. Advanced filters (date, engagement, media) are not sitting next to the profile the way people expect. Building `from:handle keyword` in search (or in a form that writes it) is the durable method across desktop and mobile.

You still need to be signed in to X to view results. Building the query does not require a WakeMark account. See [search Twitter without an account](/blog/search-twitter-without-an-account) for that distinction.

## Common mistakes

- Searching the handle as a normal keyword instead of `from:handle` (you get mentions and noise).
- Using `to:` when you meant “posts by them.”
- Expecting private / protected accounts to appear in public search.
- Stacking too many filters (high min likes + narrow date + exact phrase) until nothing matches.

## FAQ

### How do I search tweets from a specific user?

Use `from:username` in X search, then add keywords if needed. Example: `from:nasa mars`. Or fill From these accounts in an [advanced Twitter search](/tools/twitter-advanced-search) form.

### Can I search one person’s tweets for a word?

Yes. That is exactly `from:handle` plus the word. Add `since:` / `until:` if you only care about a period.

### What is the difference between from: and @?

`from:` limits to posts the account authored. `@` finds posts that mention the account, from anyone.

### Does this work for my own account?

Yes. Use your own handle with `from:` to find old posts you still have live on X. It will not recover posts you already removed from the platform.

## Recap

To search tweets from a user: start with `from:handle`, add a keyword and optional date range, and do not confuse that with `to:` or `@`. When you do not want to memorize the syntax, [generate the query](/tools/twitter-advanced-search) and open it on X.

**Read next:** [How to search tweets by date](/blog/twitter-search-by-date) · [Twitter search operators](/blog/twitter-search-operators)
