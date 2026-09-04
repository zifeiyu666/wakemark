import { categoryHex } from "@/config/bookmark-categories";
import { siteConfig } from "@/config/site";
import {
  DEFAULT_DIGEST_LANGUAGE,
  digestEmailCopy,
  formatDigestWeekKey,
  type DigestLanguage,
} from "@/lib/digests/language";
import type { DigestContent } from "@/lib/digests/types";
import * as React from "react";

interface WeeklyDigestEmailProps {
  /** Local Friday date in the user's timezone, YYYY-MM-DD. */
  weekKey: string;
  overview: string;
  highlightCount: number;
  bookmarkCount: number;
  content: DigestContent;
  language?: DigestLanguage;
  unsubscribeLink?: string;
}

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const styles = {
  body: {
    fontFamily: SANS,
    backgroundColor: "#f7f6f3",
    padding: "32px 16px",
  } as const,
  container: {
    maxWidth: "640px",
    margin: "0 auto",
    backgroundColor: "#f7f6f3",
  } as const,
  ruleLabelRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    margin: "0 0 28px",
  } as const,
  ruleLine: {
    flex: 1,
    height: "1px",
    backgroundColor: "#1f1e1b",
  } as const,
  ruleLineLight: {
    flex: 1,
    height: "1px",
    backgroundColor: "#ddd9d2",
  } as const,
  ruleLabel: {
    fontFamily: SANS,
    fontSize: "11px",
    letterSpacing: "0.22em",
    textTransform: "uppercase" as const,
    color: "#8b877f",
    whiteSpace: "nowrap" as const,
  },
  statsRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "stretch",
    gap: "0px",
    margin: "0 0 36px",
  } as const,
  statCell: {
    textAlign: "center" as const,
    padding: "0 32px",
  },
  statDivider: {
    width: "1px",
    backgroundColor: "#ddd9d2",
  } as const,
  statNumber: {
    fontFamily: SERIF,
    fontSize: "30px",
    fontWeight: 700,
    color: "#1f1e1b",
    margin: "0 0 4px",
  } as const,
  statLabel: {
    fontSize: "10px",
    letterSpacing: "0.22em",
    textTransform: "uppercase" as const,
    color: "#8b877f",
  } as const,
  overview: {
    fontFamily: SERIF,
    fontSize: "19px",
    lineHeight: 1.75,
    color: "#2b2a26",
    textAlign: "center" as const,
    margin: "0 auto 44px",
    maxWidth: "560px",
  } as const,
  groupHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "36px 0 20px",
  } as const,
  groupSwatch: {
    width: "10px",
    height: "10px",
    display: "inline-block",
  } as const,
  groupName: {
    fontFamily: SERIF,
    fontSize: "22px",
    fontWeight: 700,
    color: "#1f1e1b",
    margin: 0,
  } as const,
  groupCount: {
    fontSize: "12px",
    color: "#8b877f",
    whiteSpace: "nowrap" as const,
  },
  item: {
    display: "flex",
    gap: "16px",
    margin: "0 0 28px",
  } as const,
  itemNumber: {
    fontFamily: SERIF,
    fontSize: "22px",
    fontWeight: 700,
    color: "#d8d4cc",
    minWidth: "34px",
  } as const,
  itemBody: { flex: 1 } as const,
  authorRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    margin: "0 0 10px",
  } as const,
  avatar: {
    width: "24px",
    height: "24px",
    borderRadius: "4px",
    objectFit: "cover" as const,
  } as const,
  authorName: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#1f1e1b",
  } as const,
  authorHandle: {
    fontSize: "12px",
    color: "#8b877f",
  } as const,
  summary: {
    fontSize: "14px",
    lineHeight: 1.65,
    color: "#3a3833",
    margin: "0 0 10px",
  } as const,
  readLink: {
    fontSize: "11px",
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "#8b877f",
    textDecoration: "none",
  } as const,
  insight: {
    fontFamily: SERIF,
    fontStyle: "italic" as const,
    fontSize: "13px",
    lineHeight: 1.6,
    color: "#8b877f",
    borderLeft: "2px solid #ddd9d2",
    paddingLeft: "12px",
    margin: "14px 0 0",
  } as const,
  alsoRow: {
    display: "flex",
    gap: "24px",
    padding: "12px 0",
    borderTop: "1px solid #e6e2db",
  } as const,
  alsoHandle: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#1f1e1b",
    minWidth: "120px",
  } as const,
  alsoText: {
    fontSize: "13px",
    color: "#6b675f",
    flex: 1,
  } as const,
  footer: {
    marginTop: "44px",
    paddingTop: "20px",
    borderTop: "1px solid #e6e2db",
    textAlign: "center" as const,
  } as const,
  footerText: {
    fontSize: "12px",
    color: "#8b877f",
    margin: "0 0 8px",
  } as const,
  unsubscribe: {
    fontSize: "12px",
    color: "#6b675f",
  } as const,
  link: { color: "#1f1e1b", textDecoration: "underline" } as const,
};

function SectionRule({ label }: { label: string }) {
  return (
    <div style={styles.ruleLabelRow}>
      <div style={styles.ruleLineLight} />
      <span style={styles.ruleLabel}>{label}</span>
      <div style={styles.ruleLineLight} />
    </div>
  );
}

export const WeeklyDigestEmail: React.FC<WeeklyDigestEmailProps> = ({
  weekKey,
  overview,
  highlightCount,
  bookmarkCount,
  content,
  language = DEFAULT_DIGEST_LANGUAGE,
  unsubscribeLink,
}) => {
  let itemIndex = 0;
  const copy = digestEmailCopy(language);

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        {/* Date masthead */}
        <div style={styles.ruleLabelRow}>
          <div style={styles.ruleLine} />
          <span style={{ ...styles.ruleLabel, color: "#6b675f" }}>
            {formatDigestWeekKey(weekKey, language)}
          </span>
          <div style={styles.ruleLine} />
        </div>

        {/* Stats */}
        <div style={styles.statsRow}>
          <div style={styles.statCell}>
            <p style={styles.statNumber}>{highlightCount}</p>
            <span style={styles.statLabel}>{copy.highlightsStat}</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statCell}>
            <p style={styles.statNumber}>{bookmarkCount}</p>
            <span style={styles.statLabel}>{copy.bookmarksStat}</span>
          </div>
        </div>

        {/* Global overview */}
        {overview ? <p style={styles.overview}>{overview}</p> : null}

        {/* Highlights */}
        {content.highlightGroups.length > 0 && (
          <>
            <SectionRule label={copy.yourHighlights} />
            {content.highlightGroups.map((group) => (
              <div key={group.category}>
                <div style={styles.groupHeader}>
                  <span
                    style={{
                      ...styles.groupSwatch,
                      backgroundColor: categoryHex(group.category),
                    }}
                  />
                  <h2 style={styles.groupName}>{group.category}</h2>
                  <div style={styles.ruleLineLight} />
                  <span style={styles.groupCount}>
                    {group.items.length}{" "}
                    {group.items.length === 1
                      ? copy.highlightOne
                      : copy.highlightMany}
                  </span>
                </div>
                {group.items.map((item) => {
                  itemIndex += 1;
                  const number = String(itemIndex).padStart(2, "0");
                  const tweetUrl = item.authorUsername
                    ? `https://x.com/${item.authorUsername}/status/${item.tweetId}`
                    : `https://x.com/i/web/status/${item.tweetId}`;
                  return (
                    <div key={item.tweetId} style={styles.item}>
                      <span style={styles.itemNumber}>{number}</span>
                      <div style={styles.itemBody}>
                        <div style={styles.authorRow}>
                          {item.authorProfileImageUrl ? (
                            <img
                              src={item.authorProfileImageUrl}
                              alt=""
                              width={24}
                              height={24}
                              style={styles.avatar}
                            />
                          ) : null}
                          <span style={styles.authorName}>
                            {item.authorName || item.authorUsername || "Unknown"}
                          </span>
                          {item.authorUsername ? (
                            <span style={styles.authorHandle}>
                              @{item.authorUsername}
                            </span>
                          ) : null}
                        </div>
                        <p style={styles.summary}>{item.summary}</p>
                        <a href={tweetUrl} style={styles.readLink}>
                          {copy.readOnX}
                        </a>
                        {item.insight ? (
                          <p style={styles.insight}>{item.insight}</p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </>
        )}

        {/* Also bookmarked */}
        {content.alsoBookmarked.length > 0 && (
          <>
            <div style={{ marginTop: "44px" }}>
              <SectionRule label={copy.alsoBookmarked} />
            </div>
            <div>
              {content.alsoBookmarked.map((row) => (
                <div key={row.tweetId} style={styles.alsoRow}>
                  <span style={styles.alsoHandle}>
                    @{row.authorUsername || "unknown"}
                  </span>
                  <span style={styles.alsoText}>{row.text}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            © {new Date().getFullYear()} {siteConfig.name} — {copy.footer}
          </p>
          {unsubscribeLink && (
            <p style={styles.unsubscribe}>
              <a href={unsubscribeLink} style={styles.link}>
                {copy.unsubscribe}
              </a>{" "}
              {copy.fromWeeklyDigests}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
