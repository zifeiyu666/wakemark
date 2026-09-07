import { Fragment, type ReactNode, useMemo } from "react";

/**
 * Lightweight markdown renderer for Ask AI bubbles.
 * Covers the shapes the bookmark assistant actually emits:
 * headings, lists, bold, and [@author](tweetUrl) citation links.
 */

function openUrl(href: string) {
  if (!/^https?:\/\//i.test(href)) return;
  void chrome.tabs.create({ url: href });
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Match markdown links first, then bold.
  const token =
    /(\[([^\]]+)\]\((https?:\/\/[^)\s]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = token.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }

    if (match[1]) {
      const label = match[2];
      const href = match[3];
      nodes.push(
        <a
          key={`${keyPrefix}-a-${i++}`}
          href={href}
          className="md-link"
          onClick={(e) => {
            e.preventDefault();
            openUrl(href);
          }}
        >
          {label}
        </a>
      );
    } else if (match[4]) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${i++}`}>{match[5]}</strong>
      );
    } else if (match[6]) {
      nodes.push(<em key={`${keyPrefix}-i-${i++}`}>{match[7]}</em>);
    }

    last = match.index + match[0].length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function renderBlock(line: string, index: number): ReactNode {
  const heading = /^(#{1,3})\s+(.+)$/.exec(line);
  if (heading) {
    const level = heading[1].length;
    const Tag = (`h${level}` as "h1" | "h2" | "h3");
    return (
      <Tag key={`h-${index}`} className={`md-h md-h${level}`}>
        {renderInline(heading[2], `h${index}`)}
      </Tag>
    );
  }

  const list = /^(\s*)([-*]|\d+\.)\s+(.+)$/.exec(line);
  if (list) {
    return (
      <div key={`li-${index}`} className="md-li">
        <span className="md-bullet">{list[2].endsWith(".") ? list[2] : "•"}</span>
        <span>{renderInline(list[3], `li${index}`)}</span>
      </div>
    );
  }

  if (!line.trim()) {
    return <div key={`sp-${index}`} className="md-spacer" />;
  }

  return (
    <p key={`p-${index}`} className="md-p">
      {renderInline(line, `p${index}`)}
    </p>
  );
}

export function ChatMarkdown({ content }: { content: string }) {
  const blocks = useMemo(() => {
    const lines = content.replace(/\r\n/g, "\n").split("\n");
    return lines.map((line, i) => (
      <Fragment key={i}>{renderBlock(line, i)}</Fragment>
    ));
  }, [content]);

  return <div className="md-body">{blocks}</div>;
}
