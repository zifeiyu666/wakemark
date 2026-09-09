import "server-only";

import { Client } from "@upstash/qstash";

const BATCH_SIZE = 50;
const BATCH_DELAY_SECONDS = 5;

export type NotionSyncJobPayload = {
  userId: string;
  bookmarkIds?: string[];
  cursorBookmarkId?: string | null;
  manual?: boolean;
};

function getSiteUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL is not configured");
  }
  return siteUrl.replace(/\/$/, "");
}

function getQStashClient(): Client {
  const token = process.env.QSTASH_TOKEN;
  if (!token) {
    throw new Error("QSTASH_TOKEN is not configured");
  }
  const baseUrl = process.env.QSTASH_URL;
  return new Client(baseUrl ? { token, baseUrl } : { token });
}

export function notionSyncWorkerUrl(): string {
  return `${getSiteUrl()}/api/notion/sync-worker`;
}

function notionDedupeId(
  payload: NotionSyncJobPayload,
  delaySeconds: number
): string | undefined {
  // Collapse duplicate auto-start clicks only. Continuations must not reuse
  // this id: QStash drops duplicates for ~10 minutes, which would stop the
  // chain after the first batch (what looked like "only 15 pages then stuck").
  if (
    delaySeconds === 0 &&
    !payload.manual &&
    !payload.cursorBookmarkId &&
    !payload.bookmarkIds?.length
  ) {
    return `notion-sync-${payload.userId}`;
  }
  return undefined;
}

export async function publishNotionSyncBatch(
  payload: NotionSyncJobPayload,
  delaySeconds = 0
): Promise<void> {
  const client = getQStashClient();
  const deduplicationId = notionDedupeId(payload, delaySeconds);
  console.log(
    `[notion:sync] enqueue ${JSON.stringify({
      userId: payload.userId,
      delaySeconds,
      cursor: payload.cursorBookmarkId ?? null,
      manual: payload.manual === true,
      selected: payload.bookmarkIds?.length ?? 0,
      deduped: Boolean(deduplicationId),
    })}`
  );
  await client.publishJSON({
    url: notionSyncWorkerUrl(),
    body: payload,
    delay: delaySeconds,
    deduplicationId,
  });
}

export { BATCH_DELAY_SECONDS, BATCH_SIZE };
