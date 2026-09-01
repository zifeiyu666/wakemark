"use client";

import { ArrowUpRight, Heart, MessageSquare, Repeat2 } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

/**
 * Mock UI Animation — "Sync + Auto Tag" demo.
 *
 * A fully programmatic product demo: the sync indicator spins forever while
 * topic tags (AI / Tech / Dev / Design) are "applied" to each bookmark in a
 * staggered loop — growing in from left to right, holding, then sliding out
 * to the right so the whole lifecycle flows in one direction.
 *
 * Every loop is a pure CSS keyframe animation (transform/opacity only, see
 * `tag-sweep` in globals.css), so it runs on the compositor thread and stays
 * silky even while the main thread is busy. Tags live in fixed-size
 * overflow-hidden windows, so the card layout never shifts.
 */

/** Stagger between consecutive tag slots, in seconds. */
const TAG_STAGGER = 0.45;

type TagSpec = { label: string; color: string };

type BookmarkSpec = {
  handle: string;
  initials: string;
  avatarClass: string;
  unread?: boolean;
  text: string;
  tags: TagSpec[];
  likes: string;
  retweets: string;
  replies: string;
};

const BOOKMARKS: BookmarkSpec[] = [
  {
    handle: "@elonmusk",
    initials: "E",
    avatarClass: "from-rose-500 to-red-800",
    unread: true,
    text: "Tokenization is at the heart of much weirdness of LLMs. Do not brush it off.",
    tags: [
      { label: "AI", color: "#d24b8f" },
      { label: "Tech", color: "#4b7be5" },
    ],
    likes: "2.1k",
    retweets: "847",
    replies: "156",
  },
  {
    handle: "@shadcn",
    initials: "S",
    avatarClass: "from-violet-500 to-indigo-700",
    text: "The missing piece for AI agents is a universal context protocol that lets them share state...",
    tags: [
      { label: "AI", color: "#d24b8f" },
      { label: "Dev", color: "#3ba272" },
    ],
    likes: "1.4k",
    retweets: "392",
    replies: "87",
  },
  {
    handle: "@marclou",
    initials: "M",
    avatarClass: "from-amber-400 to-orange-600",
    text: "Great thread on design systems that actually scale across teams without slowing anyone down.",
    tags: [{ label: "Design", color: "#a05cf7" }],
    likes: "634",
    retweets: "128",
    replies: "42",
  },
];

/**
 * A tag that loops: hidden → grows in from left to right (mask reveal) →
 * holds → slides out to the right → hidden until the next cycle.
 */
const AnimatedTag = ({ tag, slot }: { tag: TagSpec; slot: number }) => {
  const innerRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      if (innerRef.current) setWidth(innerRef.current.offsetWidth);
    };
    measure();
    document.fonts?.ready.then(measure).catch(() => {});
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    /* Fixed-size window: reserves the tag's space so nothing ever shifts. */
    <span className="flex-none overflow-hidden" style={{ width }}>
      <span
        ref={innerRef}
        className="inline-flex items-center whitespace-nowrap rounded-sm px-2.5 py-1 text-xs font-medium text-white animate-tag-sweep motion-reduce:animate-none"
        style={{
          backgroundColor: tag.color,
          animationDelay: `${slot * TAG_STAGGER}s`,
        }}
      >
        {tag.label}
      </span>
    </span>
  );
};

const BookmarkRow = ({
  bookmark,
  tagSlotOffset,
}: {
  bookmark: BookmarkSpec;
  tagSlotOffset: number;
}) => (
  <div className="border-b px-4 py-4 last:border-b-0 sm:px-5">
    <div className="flex items-center gap-2.5">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${bookmark.avatarClass} text-xs font-semibold text-white`}
      >
        {bookmark.initials}
      </span>
      <span className="text-sm font-semibold">{bookmark.handle}</span>
      {bookmark.unread && (
        <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-medium text-background">
          Unread
        </span>
      )}
    </div>

    <p className="mt-2.5 text-sm leading-relaxed text-foreground/90">
      {bookmark.text}
    </p>

    {/* Fixed-height row: tags sweep in/out without shifting the layout. */}
    <div className="mt-3 flex h-6 items-center gap-2">
      {bookmark.tags.map((tag, i) => (
        <AnimatedTag key={tag.label} tag={tag} slot={tagSlotOffset + i} />
      ))}
    </div>

    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <Heart className="h-3.5 w-3.5" />
        {bookmark.likes}
      </span>
      <span className="flex items-center gap-1">
        <Repeat2 className="h-3.5 w-3.5" />
        {bookmark.retweets}
      </span>
      <span className="flex items-center gap-1">
        <MessageSquare className="h-3.5 w-3.5" />
        {bookmark.replies}
      </span>
      <span className="ml-auto flex items-center gap-0.5 font-medium text-foreground/80">
        Open tweet
        <ArrowUpRight className="h-3 w-3" />
      </span>
    </div>
  </div>
);

export default function SyncAutoTagDemo() {
  let tagSlot = 0;
  const slotOffsets = BOOKMARKS.map((b) => {
    const offset = tagSlot;
    tagSlot += b.tags.length;
    return offset;
  });

  return (
      <div className="w-full overflow-hidden rounded-xl bg-card">
        {/* Header: collection name + ever-spinning sync indicator */}
        <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground/50 motion-reduce:animate-none" />
            <span className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">
              BOOKMARKS
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              aria-hidden
              className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-muted-foreground/25 border-t-muted-foreground motion-reduce:animate-none"
            />
            <span>Syncing</span>
          </div>
        </div>

        {BOOKMARKS.map((bookmark, i) => (
          <BookmarkRow
            key={bookmark.handle}
            bookmark={bookmark}
            tagSlotOffset={slotOffsets[i]}
          />
        ))}
      </div>
  );
}
