import "server-only";

import { redis } from "@/lib/upstash";

// Minimal distributed mutex over Upstash Redis: SET NX EX to acquire, and a
// token-guarded Lua delete to release (never deletes a lock that TTL-expired
// and was re-acquired by another holder). Degrades to a no-op when Redis is
// not configured, matching the rate limiters in this folder.

const NOOP_TOKEN = "noop";

/**
 * Try to acquire a lock.
 * @returns Ownership token on success, or null when another holder owns it.
 * When Redis is disabled a sentinel token is returned so callers stay
 * lock-free without any special casing.
 */
export async function tryAcquireLock(
  key: string,
  ttlSeconds: number
): Promise<string | null> {
  if (!redis) return NOOP_TOKEN;
  try {
    const token = crypto.randomUUID();
    const ok = await redis.set(key, token, { nx: true, ex: ttlSeconds });
    return ok === "OK" ? token : null;
  } catch (error) {
    // Redis outage must not break syncing: degrade to lock-free, the DB-level
    // guards (unique dedupe, FOR UPDATE SKIP LOCKED) still hold.
    console.warn(
      "[upstash:lock] acquire failed, degrading to no-op:",
      error instanceof Error ? error.message : String(error)
    );
    return NOOP_TOKEN;
  }
}

/**
 * Release a lock only if we still own it. Release failures are never fatal:
 * the TTL guarantees the lock expires on its own.
 */
export async function releaseLock(key: string, token: string): Promise<void> {
  if (!redis || token === NOOP_TOKEN) return;
  try {
    await redis.eval(
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
      [key],
      [token]
    );
  } catch (error) {
    console.warn(
      "[upstash:lock] release failed (TTL will reclaim):",
      error instanceof Error ? error.message : String(error)
    );
  }
}
