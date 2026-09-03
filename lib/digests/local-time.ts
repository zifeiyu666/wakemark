// User-local time helpers for the timezone-aware weekly digest schedule.
// IANA time zones + Intl handle DST automatically; no manual offset tables.

export type LocalParts = {
  /** "Mon".."Sun" */
  weekday: string;
  /** 0-23 */
  hour: number;
};

// Stored time zones come from user input/capture; a bad IANA name must never
// crash the cron tick. Fall back to UTC instead.
function safeFormat(
  timeZone: string,
  options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone, ...options });
  } catch {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });
  }
}

export function getLocalParts(timeZone: string): LocalParts {
  const parts = safeFormat(timeZone, {
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const weekday =
    parts.find((p) => p.type === "weekday")?.value ?? "UTC-fallback";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  return { weekday, hour: Number.isFinite(hour) ? hour : 0 };
}

// Returns the user's local date (YYYY-MM-DD) when it is Friday in their
// timezone, otherwise null. Used both as the send-window check and as the
// idempotency key (digests.week_key) for that week.
export function fridayWeekKey(timeZone: string): string | null {
  const parts = safeFormat(timeZone, {
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  if (get("weekday") !== "Fri") return null;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

// Returns the user's local date (YYYY-MM-DD) regardless of weekday. Used as
// the weekKey for the new-user welcome digest; the unique (userId, weekKey)
// constraint keeps same-day re-triggers idempotent.
export function todayWeekKey(timeZone: string): string {
  const parts = safeFormat(timeZone, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
