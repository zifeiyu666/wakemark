"use client";

import { ArrowUpRight, Heart, MessageSquare, Repeat2 } from "lucide-react";
import Image from "next/image";
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
  avatarSrc: string;
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
    avatarSrc: "/images/x-avatar/elonmusk.jpg",
    unread: true,
    text: "True AGI requires reasoning directly on continuous reality, not just token-prediction over discrete text. Compute efficiency and real-time grounding will separate the survivors from the hype.",
    tags: [
      { label: "AI", color: "#d24b8f" },
      { label: "Tech", color: "#4b7be5" },
    ],
    likes: "2.1k",
    retweets: "847",
    replies: "156",
  },
  {
    handle: "@realDonaldTrump",
    avatarSrc: "/images/x-avatar/trump.jpg",
    text: "The Fake News says America is closed for business. WRONG. We are OPEN, jobs are ROARING BACK, and this Country is WINNING like never before. A golden age!",
    tags: [
      { label: "Politics", color: "#dc2626" },
      { label: "News", color: "#4b7be5" },
    ],
    likes: "48.2k",
    retweets: "12.6k",
    replies: "9.4k",
  },
  {
    handle: "@marclou",
    avatarSrc: "/images/x-avatar/marclou.jpg",
    text: "Building a SaaS isn't about writing pristine code for 6 months. It's launching in 72 hours, collecting $1k on Stripe, and iterating based on real user churn. Ship fast or stay stuck.",
    tags: [{ label: "Saas", color: "#a05cf7" }],
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
      <Image
        src={bookmark.avatarSrc}
        alt={bookmark.handle}
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 rounded-full object-cover"
      />
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
      <div className="w-full overflow-hidden bg-card">
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
