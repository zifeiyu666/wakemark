"use client";

import { recordUserTimezone } from "@/actions/digests";
import { useEffect } from "react";

// Silently captures the browser's IANA time zone so the weekly digest can be
// delivered on the user's local Friday morning. Only reports when the value
// differs from what is already stored; explicit Settings choices for the
// send hour / enabled flag are untouched.
export function TimezoneReporter({
  storedTimeZone,
}: {
  storedTimeZone: string | null;
}) {
  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timeZone || timeZone === storedTimeZone) return;
    recordUserTimezone(timeZone).catch(() => {
      // Best-effort capture; never block the dashboard on it.
    });
  }, [storedTimeZone]);
  return null;
}
