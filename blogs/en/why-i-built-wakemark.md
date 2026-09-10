---
title: "I Built WakeMark Because My X Bookmarks Were a Graveyard"
slug: "why-i-built-wakemark"
description: "A founder note on why X bookmarks go to die, why existing tools miss this workflow, and how WakeMark turns saves into a searchable, agent-ready knowledge base."
publishedAt: "2026-09-10"
status: "published"
visibility: "public"
isPinned: false
tags: "X bookmarks, founder story, WakeMark, MCP, personal knowledge, AI"
featuredImageUrl: "/images/blog/why-i-built-wakemark.avif"
---

# I Built WakeMark Because My X Bookmarks Were a Graveyard

I have a habit I used to defend as research.

Someone on X posts a layout trick that finally explains a CSS bug I have been fighting. Someone else writes a thread on RAG evaluation that is more honest than most blog posts. A founder drops a one-line pricing lesson. I hit bookmark. Future me, I tell myself, will come back.

Future me almost never does.

For a long time I treated that as a personal failure. I should be more disciplined. I should review my saves every Sunday. I should export them into Notion like a serious person. Then I looked at the product I was using (X itself) and the products around it, and the picture got simpler: the save button is excellent. The retrieval system is almost absent.

WakeMark started there. Not as a “second brain” slogan. As a private irritation I could not talk myself out of.

## The bookmark graveyard is real

If you use X the way a lot of builders do, bookmarks are not a hobby list. They are a working archive: code snippets, product teardown threads, hiring notes, paper links, prompts that actually worked, arguments you want to steal later.

X does not treat them that way. The official bookmarks view is a chronological dump. Search is weak when you only remember a feeling (“that thread about evals, maybe from a researcher, maybe last winter”). The official API only returns about the newest 20 bookmarks, so anything older is trapped in the logged-in web session. After a few hundred saves, the list stops being a library and starts being a landfill.

![Printed tweet cards stacked like an archive that nobody visits](/images/blog/why-i-built-wakemark-bookmark-graveyard.avif)

The worst part is the false comfort. Bookmarking feels like work. You did something with the information. You did not. You deferred it into a place that is hostile to finding things again.

I have searched my own bookmarks for ten minutes, given up, and Googled the topic as if I had never saved it. That is embarrassing to admit in public. It is also extremely common. People do not have a bookmark problem because they are lazy. They have a bookmark problem because the product they saved into was never built for recall.

## I looked at the market. Almost nobody was building for this.

When I got tired of lecturing myself, I did the obvious founder thing: I tried to buy the solution.

Read-it-later apps are good at articles. Kindle highlight tools are good at books. Browser bookmark managers are good at URLs you opened in Chrome. Notion, Raindrop, and similar databases can store anything if you are willing to become the librarian.

None of that matched the actual loop I was in:

1. I am already on X.
2. I save a post in one tap.
3. Weeks later I need the idea, not the URL, and I need it while I am coding, writing, or thinking with an agent.

The closest tools asked me to change the habit. Clip the tweet into another app. Tag it by hand. Maintain folders. Copy the thread into a notes doc. That works for 40 carefully chosen items. It does not work for the volume X produces if you are paying attention.

The other cluster of products went the opposite way: huge capture suites that also do PDFs, web clips, newsletters, Kindle, podcasts, and a whiteboard. I do not want a new operating system for reading. I want the specific pile I already created on X to become usable.

So the gap was narrower than “knowledge management.” It was: **X bookmarks as a first-class dataset**, with the ugly parts included (full history behind a session, duplicates, half-threads, posts that aged badly).

If that sounds too vertical, that is the point. Vertical is how you stop competing with everyone’s Notion template.

## Sync that needs a ritual is not sync

Even after I exported a few batches by hand, another issue showed up immediately.

I would remember to import on a Sunday. Then I would bookmark twelve more posts on Monday and forget the pipeline exists. The library in the other tool drifted from the library in X. Once that happens, you stop trusting the other tool. You go back to scrolling X, because at least that dump is current, even if it is unusable.

I wanted the boring version of magic: I keep tapping bookmark on X, and the system I own stays up to date without another weekly chore.

That is why WakeMark leans on two paths instead of a pretty CSV upload:

- Dashboard sync through official read-only X OAuth. We do not post for you. We do not ask for your X password.
- Chrome extension import for the rest of the history, from your already logged-in `x.com` session, because that is where the older bookmarks actually live.

After that, the job is to stay current. Auto-tagging, summaries, and search only matter if yesterday’s save is already in the index when you look for it tomorrow.

If a knowledge product requires you to become its operator, you will abandon it the week work gets busy. I know because I abandoned my own Notion databases that way.

## Agents cannot use a graveyard

The last reason I built this is more recent, and it is the one that made the old “notes app” answers feel finished.

I now spend a large part of the day in Cursor, Claude, and similar tools. When I get stuck, I often remember that I already saved the answer. The model does not know that. My editor does not know that. The bookmark sits in a social app, on another domain, behind a feed.

Copy-pasting tweets into the chat is a joke as a workflow. Dumping thousands of posts into a markdown file is worse. You either under-share (the model never sees the one post that matters) or over-share (you blow the context window with noise).

What I wanted was ordinary:

- Search my saves by meaning, not only by exact words.
- Ask a question in the product and get answers that cite the original posts.
- Expose the same library to coding agents through MCP, so the retrieval happens where I already work.

That last piece is not a feature checkbox for me. It is the difference between a website I have to remember to open and a knowledge base that can be queried like a tool.

If you want the setup walkthrough, I wrote that separately: [Turn your saved tweets into context for Cursor and Claude with MCP](/blog/turn-your-saved-tweets-into-context-for-cursor-and-claude-with-mcp).

## What WakeMark is, in practice

![A desk with bookmarks, a private digest, and an editor using saved posts as context](/images/blog/why-i-built-wakemark-agent-knowledge.avif)

WakeMark is the product I wished existed when I was still pretending I would “clean up bookmarks later.”

**Automatic sync.** Keep saving on X. WakeMark pulls new bookmarks in the background and imports the older history the API will not give you. Duplicates get skipped. You should not have to babysit an export.

**A library you can actually query.** Text, author, tags, summaries. Auto-tags so you are not maintaining a taxonomy as a second job. Ask AI on the collection; answers point back at the original posts instead of inventing a vibe.

**A digest that interrupts the rot.** A scheduled email (and a private newsletter-style briefing) that groups what you saved, so the pile comes back to you instead of waiting for a burst of guilt. I do not need another unread inbox. I need a short return path to my own research.

**MCP into the agent loop.** One API key, Streamable HTTP, tools like `search_bookmarks` and `ask_bookmarks`. Cursor, Claude, ChatGPT, or VS Code can pull from the same personal X corpus while you are in a file.

The sentence I use internally is unromantic: **your X bookmarks should become a private knowledge base.** Searchable. Email-visible. Agent-reachable. Still yours.

## What I am not trying to be

I am not trying to replace your browser bookmarks. Those are a different mess, and plenty of people have already built for it.

I am not trying to be the everything-capture app. If you want Kindle, podcasts, and PDFs in one graph, there are mature products for that. Use them. Export WakeMark to Notion if you already live there.

I am not claiming every saved tweet is wisdom. Plenty of bookmarks are jokes, rage, or a screenshot you will never need. A personal knowledge base still has to tolerate junk, because the alternative is a capture process so strict you stop capturing.

The bet is narrower: people who already treat X as a research feed deserve a tool that respects that feed, including the ugly API limits, and then makes the data useful in 2026 (search, mail, agents) instead of 2014 (folders).

## If this is your pile too

Install the [Chrome extension](https://chromewebstore.google.com/detail/wakemark/njgbiipglkpcpkapmjimkpbenjjlhbjn), sign in, import history, and try to find one thing you *know* you saved months ago. That is the test I care about. If search or Ask AI misses it, that is on me.

[Start a 7-day trial on WakeMark](https://wakemark.app/). No card for the trial. Early pricing stays locked while you remain subscribed.

I built this because I was tired of lying to myself about “I’ll read it later.” If you have been lying about the same thing, the graveyard is optional now.
