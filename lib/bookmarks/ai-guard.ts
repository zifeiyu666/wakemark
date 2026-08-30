import "server-only";

import { getErrorMessage } from "@/lib/error-utils";
import { getRateLimiter } from "@/lib/upstash";
import { LOWER_CASE_SITE_NAME } from "@/lib/upstash/redis-keys";

// Global OpenRouter budget shared across ALL users, serverless instances,
// manual Sync clicks and cron ticks. The sliding window caps the instantaneous
// request rate no matter how many backlogs are being digested concurrently,
// so a wave of first-time imports cannot melt the upstream shared pool.
const AI_GLOBAL_RATE = {
  prefix: `${LOWER_CASE_SITE_NAME}:rl:bookmark-ai`,
  maxRequests: 5,
  window: "1 s",
};

const SLOT_WAIT_MS = 400;
const SLOT_MAX_WAIT_MS = 30_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Block until the global OpenRouter sliding window has a free slot. Degrades
 * to a no-op when Redis is not configured (per-call concurrency bounds still
 * apply in that case).
 */
export async function acquireAiSlot(): Promise<void> {
  const limiter = getRateLimiter(AI_GLOBAL_RATE);
  if (!limiter) return;
  const startedAt = Date.now();
  for (;;) {
    const { success } = await limiter.limit("global");
    if (success) return;
    if (Date.now() - startedAt > SLOT_MAX_WAIT_MS) {
      console.warn(
        "[bookmarks:ai] global rate limiter saturated, proceeding anyway"
      );
      return;
    }
    await sleep(SLOT_WAIT_MS);
  }
}

const RATE_LIMIT_PATTERN =
  /429|rate limit|too many requests|resource has been exhausted|quota/i;

/**
 * Exponential backoff (1s -> 2s -> 4s) for upstream 429s; non-rate-limit
 * errors rethrow immediately so the model fallback chain can take over.
 */
export async function with429Backoff<T>(
  fn: () => Promise<T>,
  attempts = 3
): Promise<T> {
  let delay = 1000;
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const message = getErrorMessage(error);
      if (!RATE_LIMIT_PATTERN.test(message) || attempt >= attempts - 1) {
        throw error;
      }
      console.warn(
        `[bookmarks:ai] 429 throttled (${message.slice(0, 120)}), backing off ${delay}ms`
      );
      await sleep(delay);
      delay *= 2;
    }
  }
}
