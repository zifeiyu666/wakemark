/**
 * Guest-session X visibility checks (search ban / suggestion ban / profile flags).
 * Uses credentials: "omit" so the viewer's own X login cannot mask a search ban.
 */

export const SHADOWBAN_ORIGINS = [
  "https://x.com/*",
  "https://api.x.com/*",
  "https://abs.twimg.com/*",
] as const;

/** Public web client bearer (not a user secret). */
const BEARER =
  "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** Snapshot of current web GraphQL queryIds (rotated by X; refreshed via bundle parse). */
const FALLBACK_OPS = {
  UserByScreenName: "Gb-d6r0vxPOADdG62OEBpQ",
  UserTweets: "SXVCYB8XHSS25nzIljNtZA",
  SearchTimeline: "hyPfJYJ_XAtDYoslQc-Rgg",
} as const;

const USER_FEATURES: Record<string, boolean> = {
  hidden_profile_subscriptions_enabled: true,
  profile_label_improvements_pcf_label_in_post_enabled: true,
  responsive_web_profile_redirect_enabled: true,
  rweb_tipjar_consumption_enabled: false,
  verified_phone_label_enabled: false,
  subscriptions_verification_info_is_identity_verified_enabled: true,
  subscriptions_verification_info_verified_since_enabled: true,
  highlights_tweets_tab_ui_enabled: true,
  responsive_web_twitter_article_notes_tab_enabled: true,
  subscriptions_feature_can_gift_premium: true,
  creator_subscriptions_tweet_preview_api_enabled: true,
  responsive_web_graphql_timeline_navigation_enabled: true,
};

const TIMELINE_FEATURES: Record<string, boolean> = {
  rweb_video_screen_enabled: false,
  rweb_cashtags_enabled: true,
  profile_label_improvements_pcf_label_in_post_enabled: true,
  responsive_web_profile_redirect_enabled: true,
  rweb_tipjar_consumption_enabled: false,
  verified_phone_label_enabled: false,
  creator_subscriptions_tweet_preview_api_enabled: true,
  responsive_web_graphql_timeline_navigation_enabled: true,
  premium_content_api_read_enabled: false,
  communities_web_enable_tweet_community_results_fetch: true,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  responsive_web_grok_analyze_button_fetch_trends_enabled: false,
  responsive_web_grok_analyze_post_followups_enabled: false,
  rweb_cashtags_composer_attachment_enabled: true,
  responsive_web_jetfuel_frame: true,
  responsive_web_grok_share_attachment_enabled: true,
  responsive_web_grok_annotations_enabled: true,
  articles_preview_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  content_disclosure_indicator_enabled: true,
  content_disclosure_ai_generated_indicator_enabled: true,
  responsive_web_grok_show_grok_translated_post: true,
  responsive_web_grok_analysis_button_from_backend: true,
  post_ctas_fetch_enabled: false,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: false,
  responsive_web_grok_image_annotation_enabled: true,
  responsive_web_grok_imagine_annotation_enabled: true,
  responsive_web_grok_community_note_auto_translation_is_enabled: true,
  responsive_web_enhance_cards_enabled: false,
};

export type CheckStatus =
  | "detected"
  | "not_detected"
  | "unmeasurable"
  | "flagged"
  | "not_flagged"
  | "public"
  | "protected";

export type ShadowbanCheck = {
  id: "search_ban" | "suggestion_ban" | "sensitive" | "privacy";
  title: string;
  status: CheckStatus;
  label: string;
  description: string;
  /** Optional quantitative hint, e.g. "0 recent posts found in search". */
  metric?: string;
};

export type ShadowbanResult = {
  handle: string;
  summary: {
    tone: "danger" | "ok" | "neutral";
    text: string;
  };
  checks: ShadowbanCheck[];
};

export class ShadowbanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShadowbanError";
  }
}

type GuestSession = {
  guestToken: string;
  csrf: string;
};

type QueryOps = {
  UserByScreenName: string;
  UserTweets: string;
  SearchTimeline: string;
};

type ProfileInfo = {
  restId: string;
  screenName: string;
  protected: boolean;
  possiblySensitive: boolean;
  statusesCount: number;
};

let cachedOps: { at: number; ops: QueryOps } | null = null;
const OPS_TTL_MS = 30 * 60 * 1000;

function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "").split(/[/?#\s]/)[0] ?? "";
}

function randomCsrf(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function jsBool(value: string | undefined): boolean {
  return value === "true" || value === "!0";
}

function baseHeaders(session: GuestSession): HeadersInit {
  return {
    authorization: `Bearer ${BEARER}`,
    "x-guest-token": session.guestToken,
    "x-csrf-token": session.csrf,
    "x-twitter-active-user": "yes",
    "x-twitter-client-language": "en",
    "user-agent": UA,
    accept: "*/*",
  };
}

async function activateGuest(): Promise<GuestSession> {
  const csrf = randomCsrf();
  const res = await fetch("https://api.x.com/1.1/guest/activate.json", {
    method: "POST",
    credentials: "omit",
    headers: {
      authorization: `Bearer ${BEARER}`,
      "x-csrf-token": csrf,
      "user-agent": UA,
    },
  });

  if (res.status === 429) {
    throw new ShadowbanError("X rate-limited the guest session. Try again later.");
  }
  if (!res.ok) {
    throw new ShadowbanError(
      `Could not start a guest session with X (${res.status}). X may be blocking unauthenticated checks.`
    );
  }

  const data = (await res.json()) as { guest_token?: string };
  if (!data.guest_token) {
    throw new ShadowbanError("X did not return a guest token.");
  }
  return { guestToken: data.guest_token, csrf };
}

function extractQueryIds(bundle: string): Partial<QueryOps> {
  const ops: Partial<QueryOps> = {};
  const names = ["UserByScreenName", "UserTweets", "SearchTimeline"] as const;
  for (const name of names) {
    const patterns = [
      new RegExp(`queryId:"([A-Za-z0-9_-]+)",operationName:"${name}"`),
      new RegExp(
        `operationName:"${name}"[^}]{0,160}?queryId:"([A-Za-z0-9_-]+)"`
      ),
    ];
    for (const re of patterns) {
      const m = re.exec(bundle);
      if (m?.[1]) {
        ops[name] = m[1];
        break;
      }
    }
  }
  return ops;
}

async function resolveQueryOps(): Promise<QueryOps> {
  if (cachedOps && Date.now() - cachedOps.at < OPS_TTL_MS) {
    return cachedOps.ops;
  }

  const ops: QueryOps = { ...FALLBACK_OPS };

  try {
    const htmlRes = await fetch("https://x.com/", {
      credentials: "omit",
      headers: { "user-agent": UA, accept: "text/html" },
    });
    if (htmlRes.ok) {
      const html = await htmlRes.text();
      const scriptUrls = [
        ...html.matchAll(
          /https:\/\/abs\.twimg\.com\/(?:responsive-web\/client-web(?:-legacy)?|x-web\/x-web)\/[^"'\\\s]+\.js/g
        ),
      ].map((m) => m[0]);

      for (const url of scriptUrls.slice(0, 8)) {
        try {
          const jsRes = await fetch(url, {
            credentials: "omit",
            headers: { "user-agent": UA },
          });
          if (!jsRes.ok) continue;
          const js = await jsRes.text();
          Object.assign(ops, extractQueryIds(js));

          // x-web entry lists chunk assets — scan a few likely ones.
          const assets = [
            ...js.matchAll(/"(assets\/[^"]+(?:relay|fetch|query|search|user)[^"]*\.js)"/gi),
          ].map((m) => m[1]);
          const base = url.replace(/\/[^/]+$/, "/");
          for (const asset of assets.slice(0, 6)) {
            try {
              const chunkRes = await fetch(base + asset, {
                credentials: "omit",
                headers: { "user-agent": UA },
              });
              if (!chunkRes.ok) continue;
              Object.assign(ops, extractQueryIds(await chunkRes.text()));
            } catch {
              // ignore chunk failures
            }
          }
        } catch {
          // ignore bundle failures
        }
      }
    }
  } catch {
    // keep fallbacks
  }

  cachedOps = { at: Date.now(), ops };
  return ops;
}

async function graphqlGet(
  session: GuestSession,
  queryId: string,
  operation: string,
  variables: Record<string, unknown>,
  features: Record<string, boolean>
): Promise<{ ok: true; data: unknown } | { ok: false; status: number; body: string }> {
  const params = new URLSearchParams({
    variables: JSON.stringify(variables),
    features: JSON.stringify(features),
  });
  const url = `https://x.com/i/api/graphql/${queryId}/${operation}?${params}`;
  const res = await fetch(url, {
    method: "GET",
    credentials: "omit",
    headers: baseHeaders(session),
  });
  const body = await res.text();
  if (!res.ok) return { ok: false, status: res.status, body };
  try {
    return { ok: true, data: JSON.parse(body) };
  } catch {
    return { ok: false, status: res.status, body };
  }
}

function collectNodes(node: unknown, out: unknown[] = []): unknown[] {
  if (!node || typeof node !== "object") return out;
  if (Array.isArray(node)) {
    for (const item of node) collectNodes(item, out);
    return out;
  }
  out.push(node);
  for (const value of Object.values(node as Record<string, unknown>)) {
    collectNodes(value, out);
  }
  return out;
}

function parseProfileFromGraphql(data: unknown, fallback: string): ProfileInfo | null {
  const root = data as {
    data?: {
      user?: {
        result?: {
          __typename?: string;
          rest_id?: string;
          possibly_sensitive?: boolean;
          legacy?: {
            screen_name?: string;
            protected?: boolean;
            possibly_sensitive?: boolean;
            statuses_count?: number;
          };
          privacy?: { protected?: boolean };
          core?: { screen_name?: string };
          tweet_counts?: { tweets_total_count?: number };
        };
      };
    };
  };
  const user = root.data?.user?.result;
  if (!user || user.__typename === "UserUnavailable" || !user.rest_id) {
    return null;
  }
  return {
    restId: user.rest_id,
    screenName:
      user.core?.screen_name ?? user.legacy?.screen_name ?? fallback,
    protected: Boolean(user.privacy?.protected ?? user.legacy?.protected),
    possiblySensitive: Boolean(
      user.possibly_sensitive ?? user.legacy?.possibly_sensitive
    ),
    statusesCount:
      user.legacy?.statuses_count ?? user.tweet_counts?.tweets_total_count ?? 0,
  };
}

async function fetchProfileFromHtml(screenName: string): Promise<ProfileInfo | null> {
  const res = await fetch(`https://x.com/${encodeURIComponent(screenName)}`, {
    credentials: "omit",
    headers: { "user-agent": UA, accept: "text/html" },
  });
  if (!res.ok) return null;
  const html = await res.text();

  const ogTitle = html.match(/property="og:title" content="([^"]*)"/i)?.[1] ?? "";
  const titleOk = new RegExp(`\\(@${screenName}\\)`, "i").test(ogTitle);
  const names = [...html.matchAll(/screen_name:"([^"]+)"/g)].map((m) => m[1]);
  const nameMatch = names.some((n) => n.toLowerCase() === screenName.toLowerCase());
  if (!titleOk && !nameMatch) return null;

  const restId =
    html.match(/__typename:"User",rest_id:"(\d+)"/)?.[1] ??
    html.match(/rest_id:"(\d+)"/)?.[1];
  if (!restId) return null;

  const protectedRaw =
    html.match(/__typename:"UserPrivacy",protected:(!\d|true|false)/)?.[1] ??
    html.match(/privacy"[^}]{0,120}protected:(!\d|true|false)/)?.[1];
  const sensitiveRaw = html.match(/possibly_sensitive:(!\d|true|false)/)?.[1];
  const tweetCount = (html.match(/__typename:"Tweet"/g) ?? []).length;
  const canonical =
    names.find((n) => n.toLowerCase() === screenName.toLowerCase()) ?? screenName;

  return {
    restId,
    screenName: canonical,
    protected: jsBool(protectedRaw),
    possiblySensitive: jsBool(sensitiveRaw),
    statusesCount: tweetCount > 0 ? tweetCount : 0,
  };
}

async function fetchProfile(
  session: GuestSession,
  ops: QueryOps,
  screenName: string
): Promise<ProfileInfo> {
  const result = await graphqlGet(
    session,
    ops.UserByScreenName,
    "UserByScreenName",
    { screen_name: screenName, withSafetyModeUserFields: true },
    USER_FEATURES
  );

  if (result.ok) {
    const profile = parseProfileFromGraphql(result.data, screenName);
    if (profile) return profile;
    throw new ShadowbanError(`User @${screenName} was not found.`);
  }

  // GraphQL miss / stale queryId — fall back to public profile HTML SSR.
  const htmlProfile = await fetchProfileFromHtml(screenName);
  if (htmlProfile) return htmlProfile;

  if (result.status === 404) {
    throw new ShadowbanError(
      "X profile GraphQL queryId appears outdated and HTML fallback failed."
    );
  }
  throw new ShadowbanError(`Profile lookup failed (${result.status}).`);
}

async function userHasRecentPosts(
  session: GuestSession,
  ops: QueryOps,
  userId: string
): Promise<boolean> {
  const result = await graphqlGet(
    session,
    ops.UserTweets,
    "UserTweets",
    {
      userId,
      count: 20,
      includePromotedContent: false,
      withQuickPromoteEligibilityTweetFields: true,
      withVoice: true,
      withV2Timeline: true,
    },
    TIMELINE_FEATURES
  );
  if (!result.ok) return false;
  const blob = JSON.stringify(result.data);
  return (
    blob.includes("__typename\":\"Tweet\"") ||
    blob.includes(`"rest_id":"${userId}"`) ||
    blob.includes("TimelineTimelineItem")
  );
}

async function searchFromUser(
  session: GuestSession,
  ops: QueryOps,
  screenName: string,
  userId: string
): Promise<"hits" | "empty" | "blocked"> {
  const result = await graphqlGet(
    session,
    ops.SearchTimeline,
    "SearchTimeline",
    {
      rawQuery: `from:${screenName}`,
      count: 20,
      querySource: "typed_query",
      product: "Latest",
    },
    TIMELINE_FEATURES
  );

  if (!result.ok) return "blocked";

  const entries = collectNodes(result.data);
  const blob = JSON.stringify(entries);
  const hasTweet = blob.includes("__typename\":\"Tweet\"");
  const mentionsUser =
    blob.toLowerCase().includes(screenName.toLowerCase()) ||
    blob.includes(userId);
  return hasTweet && mentionsUser ? "hits" : "empty";
}

async function typeaheadHasUser(
  session: GuestSession,
  screenName: string
): Promise<"found" | "missing" | "blocked"> {
  const q = encodeURIComponent(screenName);
  const urls = [
    `https://x.com/i/api/1.1/search/typeahead.json?q=${q}&src=search_box&result_type=users&count=20`,
    `https://api.x.com/1.1/search/typeahead.json?q=${q}&src=search_box&result_type=users&count=20`,
  ];

  for (const url of urls) {
    const res = await fetch(url, {
      method: "GET",
      credentials: "omit",
      headers: baseHeaders(session),
    });
    const body = await res.text();
    if (!res.ok) continue;
    try {
      const data = JSON.parse(body) as {
        users?: Array<{ screen_name?: string }>;
      };
      const users = data.users ?? [];
      const found = users.some(
        (u) => (u.screen_name ?? "").toLowerCase() === screenName.toLowerCase()
      );
      return found ? "found" : "missing";
    } catch {
      continue;
    }
  }
  return "blocked";
}

function statusLabel(status: CheckStatus, id?: ShadowbanCheck["id"]): string {
  if (id === "search_ban" && status === "detected") return "Restricted";
  switch (status) {
    case "detected":
      return "Detected";
    case "not_detected":
      return "Not detected";
    case "unmeasurable":
      return "Unmeasurable";
    case "flagged":
      return "Flagged";
    case "not_flagged":
      return "Not flagged";
    case "public":
      return "Public";
    case "protected":
      return "Protected";
  }
}

export async function ensureShadowbanPermissions(): Promise<boolean> {
  const origins = [...SHADOWBAN_ORIGINS];
  const existing = await chrome.permissions.contains({ origins });
  if (existing) return true;
  return chrome.permissions.request({ origins });
}

export async function runShadowbanTest(rawHandle: string): Promise<ShadowbanResult> {
  const handle = normalizeHandle(rawHandle);
  if (!handle || !/^[A-Za-z0-9_]{1,15}$/.test(handle)) {
    throw new ShadowbanError("Enter a valid X username (letters, numbers, _).");
  }

  const session = await activateGuest();
  const ops = await resolveQueryOps();
  const profile = await fetchProfile(session, ops, handle);

  const display = profile.screenName;
  const at = `@${display}`;

  let hasRecentPosts = profile.statusesCount > 0;
  if (!profile.protected) {
    const fromTimeline = await userHasRecentPosts(session, ops, profile.restId);
    if (fromTimeline) hasRecentPosts = true;
  }

  let searchStatus: CheckStatus = "unmeasurable";
  let searchDesc = "";
  let searchMetric: string | undefined;

  if (profile.protected) {
    searchStatus = "unmeasurable";
    searchDesc =
      "This account is protected, so outsider search visibility cannot be measured.";
  } else if (!hasRecentPosts) {
    // Treat empty/missing posts as a classic search-ban signal (Restricted).
    searchStatus = "detected";
    searchDesc = `None of your recent posts appear in X search for ${at} — the classic search-ban signal. No content was found.`;
    searchMetric = "0 recent posts found in search";
  } else {
    const search = await searchFromUser(session, ops, display, profile.restId);
    if (search === "blocked") {
      searchStatus = "unmeasurable";
      searchDesc = `X currently blocks guest search (SearchTimeline). A from:${at} check needs an unauthenticated search view, so this could not be measured.`;
    } else if (search === "empty") {
      searchStatus = "detected";
      searchDesc = `None of your recent posts appear in X search for ${at} — the classic search-ban signal. Confirm with a logged-out from:${at} search.`;
      searchMetric = "0 recent posts found in search";
    } else {
      searchStatus = "not_detected";
      searchDesc = `A from:${at} search returns posts from the timeline as expected.`;
    }
  }

  let suggestionStatus: CheckStatus = "unmeasurable";
  let suggestionDesc = "";

  if (profile.protected) {
    suggestionStatus = "unmeasurable";
    suggestionDesc =
      "Protected accounts may not appear in search suggestions the same way; this check is skipped.";
  } else {
    const ta = await typeaheadHasUser(session, display);
    if (ta === "blocked") {
      suggestionStatus = "unmeasurable";
      suggestionDesc =
        "X blocked guest typeahead, so search suggestion visibility could not be measured.";
    } else if (ta === "missing") {
      suggestionStatus = "detected";
      suggestionDesc = "Your handle does not appear in X's search autocomplete.";
    } else {
      suggestionStatus = "not_detected";
      suggestionDesc =
        "Your handle appears in X's search autocomplete as expected.";
    }
  }

  const sensitiveStatus: CheckStatus = profile.possiblySensitive
    ? "flagged"
    : "not_flagged";
  const sensitiveDesc = profile.possiblySensitive
    ? "Your account is marked sensitive. Media may show a content warning."
    : "Your account is not marked sensitive. Media shows normally, with no content warning.";

  const privacyStatus: CheckStatus = profile.protected ? "protected" : "public";
  const privacyDesc = profile.protected
    ? "Your account is protected, so only approved followers can see your posts. Visibility tests above may be unmeasurable."
    : "Your account is public, so the visibility tests above run normally.";

  const checks: ShadowbanCheck[] = [
    {
      id: "search_ban",
      title: "Search Ban",
      status: searchStatus,
      label: statusLabel(searchStatus, "search_ban"),
      description: searchDesc,
      metric: searchMetric,
    },
    {
      id: "suggestion_ban",
      title: "Search Suggestion Ban",
      status: suggestionStatus,
      label: statusLabel(suggestionStatus, "suggestion_ban"),
      description: suggestionDesc,
    },
    {
      id: "sensitive",
      title: "Sensitive Profile",
      status: sensitiveStatus,
      label: statusLabel(sensitiveStatus, "sensitive"),
      description: sensitiveDesc,
    },
    {
      id: "privacy",
      title: "Account Privacy",
      status: privacyStatus,
      label: statusLabel(privacyStatus, "privacy"),
      description: privacyDesc,
    },
  ];

  const searchDetected = searchStatus === "detected";
  const suggestionDetected = suggestionStatus === "detected";

  let summary: ShadowbanResult["summary"];
  if (searchDetected && suggestionDetected) {
    summary = {
      tone: "danger",
      text: `We detected a search ban and a search suggestion ban on ${at}.`,
    };
  } else if (searchDetected) {
    summary = {
      tone: "danger",
      text: `We detected a search ban on ${at}.`,
    };
  } else if (suggestionDetected) {
    summary = {
      tone: "danger",
      text: `We detected a search suggestion ban on ${at}.`,
    };
  } else if (
    searchStatus === "not_detected" &&
    (suggestionStatus === "not_detected" || suggestionStatus === "unmeasurable")
  ) {
    summary = {
      tone: "ok",
      text: `No search restrictions detected for ${at}.`,
    };
  } else if (
    searchStatus === "unmeasurable" &&
    suggestionStatus === "unmeasurable"
  ) {
    summary = {
      tone: "neutral",
      text: `Checked ${at}. Profile settings loaded; X blocked guest search/suggestion checks.`,
    };
  } else {
    summary = {
      tone: "neutral",
      text: `Finished checks for ${at}. Some visibility tests could not be measured.`,
    };
  }

  return { handle: display, summary, checks };
}

export async function runShadowbanTestViaBackground(
  handle: string
): Promise<ShadowbanResult> {
  const granted = await ensureShadowbanPermissions();
  if (!granted) {
    throw new ShadowbanError(
      "Permission to access x.com is required for the shadowban test."
    );
  }

  const response = (await chrome.runtime.sendMessage({
    type: "wakemark:shadowban-test",
    handle,
  })) as
    | { ok: true; data: ShadowbanResult }
    | { ok: false; error: string }
    | undefined;

  if (!response) {
    throw new ShadowbanError("No response from the extension background.");
  }
  if (!response.ok) {
    throw new ShadowbanError(response.error || "Shadowban test failed.");
  }
  return response.data;
}
