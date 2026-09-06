import { redis } from "@/lib/upstash";

// One-time auth handoff: the signed-in web session grants a Chrome extension
// API key which is parked under a short-lived state token for the extension
// to poll. Redis is preferred; an in-memory Map covers local dev without
// Upstash.

const TTL_SECONDS = 120;
const PREFIX = "ext-auth:";

type GrantPayload = {
  apiKey: string;
  userId: string;
  keyId: string;
};

const memory = new Map<string, { value: GrantPayload; expiresAt: number }>();

function memoryGet(state: string): GrantPayload | null {
  const row = memory.get(state);
  if (!row) return null;
  if (Date.now() > row.expiresAt) {
    memory.delete(state);
    return null;
  }
  return row.value;
}

function memorySet(state: string, value: GrantPayload): void {
  memory.set(state, {
    value,
    expiresAt: Date.now() + TTL_SECONDS * 1000,
  });
}

function memoryDel(state: string): void {
  memory.delete(state);
}

export async function storeExtensionGrant(
  state: string,
  payload: GrantPayload
): Promise<void> {
  if (redis) {
    await redis.set(`${PREFIX}${state}`, payload, { ex: TTL_SECONDS });
    return;
  }
  memorySet(state, payload);
}

export async function takeExtensionGrant(
  state: string
): Promise<GrantPayload | null> {
  if (redis) {
    const key = `${PREFIX}${state}`;
    const value = await redis.get<GrantPayload>(key);
    if (!value) return null;
    await redis.del(key);
    return value;
  }
  const value = memoryGet(state);
  if (value) memoryDel(state);
  return value;
}
