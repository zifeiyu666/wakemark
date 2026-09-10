---
title: "X/Twitter Bookmarks Exporter: Markdown, CSV, JSON, and Notion"
slug: "x-twitter-bookmarks-exporter"
description: "Export your X (Twitter) bookmarks as Markdown zip, CSV, JSON, or Notion pages. WakeMark imports full history first, then lets you download tagged, summarized saves you actually own."
publishedAt: "2026-09-10"
status: "published"
visibility: "public"
isPinned: false
tags: "X bookmarks exporter, Twitter bookmarks exporter, Markdown, CSV, JSON, Notion, Obsidian"
featuredImageUrl: "/images/blog/x-twitter-bookmarks-exporter.avif"
---

# X/Twitter Bookmarks Exporter: Markdown, CSV, JSON, and Notion

X will let you bookmark a post in one tap. It will not give you a clean way to take those bookmarks with you.

There is no official “download my saved tweets” button. The bookmarks page is a scroll. The official API only returns about the newest 20 bookmarks. Older saves sit behind your logged-in `x.com` session. If you want the pile in Obsidian, a spreadsheet, a script, or Notion, you are on your own.

WakeMark is an X/Twitter bookmarks exporter built around that gap. First it imports the library (including history the API will not return). Then it lets you download the result as files you can open anywhere, or push pages into Notion in the background.

This post is the practical version: what you can export, what is in each file, and how to run it from the dashboard.

## Why a dedicated exporter still matters

Most “Twitter bookmark exporter” tools I tried fell into one of three buckets.

**Scrapers with no home.** A one-shot script dumps JSON, then you are left to clean authors, dates, and media URLs yourself. Next week’s bookmarks are a second job.

**Capture apps that are too wide.** They want every URL, PDF, and Kindle highlight. Export exists, but the object is a generic web clip, not a tweet with an author, status URL, thread text, and tags.

**Manual copy into Notion.** Fine for twenty posts. Painful for two thousand.

The workflow we actually needed was narrower:

1. Keep bookmarking on X the way you already do.
2. Get the **full** history into one private library.
3. Export that library in formats other tools already understand.

If you want the product origin story, I wrote that here: [I built WakeMark because my X bookmarks were a graveyard](/blog/why-i-built-wakemark).

## What WakeMark exports (and what it does not)

Exports include the useful tweet payload, plus the work WakeMark already did in the background:

- Tweet text
- Canonical URL (`https://x.com/i/status/{id}`)
- Author name and `@username`
- Original post date
- AI summary
- Primary category and tags
- Outbound links from the post
- Media URLs and types
- Read status and last sync time

Trash is never included. Embedding vectors stay in WakeMark; you do not download a giant vector dump.

You can export **all** non-trashed bookmarks, or enter selection mode and export only the rows you checked.

File downloads (Markdown zip, JSON, CSV) are available from the bookmarks board once you are signed in. **Export to Notion** runs on a paid plan after you connect a Notion parent in Settings.

## Formats

![Printed Markdown, JSON, and CSV artifacts laid out as an export kit](/images/blog/x-twitter-bookmarks-exporter-formats.avif)

### Markdown zip (best for Obsidian and notes vaults)

This is the format I use when I want the library to live next to writing.

The download is a zip named like `wakemark-export-YYYY-MM-DD.zip`. Inside `wakemark-export/` you get:

- One `.md` file per bookmark, named `{date}-{tweetId}.md`
- `export.json`
- `export.csv`

Each Markdown file has YAML frontmatter (`title`, `author`, `url`, `date`, `tags`), the tweet as a blockquote, an AI summary section when one exists, then Links and Media lists.

Drop the folder into Obsidian or any Markdown vault. Search, backlinks, and your own notes sit on top of files you own. If WakeMark disappeared tomorrow, the zip would still open.

### JSON (best for scripts)

One pretty-printed array. Each object has ids, URL, text, author fields, timestamps, tags, summary, links, media, status, and `isRead`.

Use it when you want a custom importer, a local search index, or a one-off analysis. You do not need to parse Markdown to get structured fields.

### CSV (best for spreadsheets)

Columns: `id`, `tweet_id`, `url`, `text`, `author`, `tweet_created_at`, `tags`, `summary`, `links`, `status`, `is_read`, `synced_at`.

Open it in Numbers, Excel, or Google Sheets. Filter by tag, sort by date, or share a slice with someone who does not want a zip of Markdown files. Tags and links are joined with `; ` so they stay in one cell.

### Notion (best if your database already lives there)

Connect Notion in Settings, pick a parent, then use **Export to Notion** on the board (all bookmarks or a selection). Pages are created in the background in batches. You can keep browsing; you do not wait on a single long request.

WakeMark skips bookmarks that already have a Notion page id, so a second run is a resume, not a duplicate storm. Auto-sync can enqueue new ready bookmarks after they are tagged, if you turn that on.

This is the path for people who already run research in Notion and want X saves as rows, not as a competing app.

![A paper card wall and a dated Markdown notebook standing in for Notion and Obsidian](/images/blog/x-twitter-bookmarks-exporter-vault.avif)

## How to export X bookmarks with WakeMark

### 1. Get the bookmarks in first

Sign in at [wakemark.app](https://wakemark.app/), connect X with read-only OAuth, and sync. That covers recent bookmarks.

For everything older than the ~20 posts the official API returns, install the [Chrome extension](https://chromewebstore.google.com/detail/wakemark/njgbiipglkpcpkapmjimkpbenjjlhbjn), open the popup, run **Import history**, and leave the X bookmarks tab open until scrolling finishes. Duplicates are skipped.

An exporter that only sees twenty rows is a demo. The import step is the actual product.

### 2. Download files from the board

Open **Dashboard → Bookmarks**.

- Toolbar **Export** → **Markdown zip**, **JSON**, or **CSV** for the full (non-trash) library.
- **Select**, check rows, then bulk **Export** for a subset.

The browser downloads from `/api/export/bookmarks`. You stay on the same page.

### 3. Or send pages to Notion

Connect Notion first. Paid plans can export all or selected bookmarks. Status toasts tell you when a job is queued or already running. Do not click it in a panic loop; one job keeps writing pages until the batch is done.

Step-by-step copy also lives in the docs: [Export bookmarks](/docs/start/export).

## A Markdown file looks like this

Frontmatter plus the tweet, then optional summary and links:

```markdown
---
title: "A short slice of the tweet text…"
author: "@handle"
url: "https://x.com/i/status/123"
date: "2026-03-12"
tags: ["development", "nextjs"]
---

> The original post body.

### AI 核心摘要

- Short bullets WakeMark generated from the post.

### Links

- https://example.com/the-repo
```

Media, when present, is listed as typed URLs rather than binary blobs inside the zip. That keeps the archive small and lets you fetch images only when you need them.

## Exporter vs. leaving everything inside WakeMark

Export is a backup and an interoperability layer. It is not a replacement for search, Ask AI, digest email, or [MCP in Cursor and Claude](/blog/turn-your-saved-tweets-into-context-for-cursor-and-claude-with-mcp).

A reasonable split:

| You want | Use |
| --- | --- |
| Offline vault / Obsidian | Markdown zip |
| Spreadsheet triage | CSV |
| Your own script | JSON |
| Team wiki / personal Notion DB | Notion export |
| Ask the library while you code | Stay in WakeMark + MCP |

I export on a schedule even though I live in the product. Ownership should not depend on a login.

## FAQ

### Does X offer an official bookmarks exporter?

No complete one. You can scroll bookmarks in the app, and developers can read a short window through the API. Full history and a file you can hand to Obsidian are not part of that.

### Can I export all of my Twitter bookmarks, or only recent ones?

After a full WakeMark import (OAuth sync + extension history), file export includes every non-trashed bookmark in your account library. Selection mode limits the download to checked rows.

### Will this download videos and images as files?

The export stores **media URLs**, not the binary files. Markdown, JSON, and CSV all point at those URLs. If you need a local media mirror, start from the URL list in JSON or the Media section in each `.md` file.

### Is Notion export the same as the zip?

No. The zip is an immediate file download. Notion creates pages asynchronously in your workspace and requires a paid plan plus a connected integration.

### Can I use this as a Twitter bookmarks to Obsidian pipeline?

Yes. Markdown zip is the intended path: dated filenames, YAML tags, tweet quote, summary. Import the folder, then tag or link as you would any other notes.

## Export the pile you already saved

If the only copy of your research is an infinite X scroll, you do not have a library. You have a feed.

[Create a WakeMark account](https://wakemark.app/), import history, then hit **Export**. Seven-day trial, no card. Early pricing stays locked while you remain subscribed.
