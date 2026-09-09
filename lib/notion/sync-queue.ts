import "server-only";

import { Client } from "@upstash/qstash";

const BATCH_SIZE = 15;
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

export async function publishNotionSyncBatch(
  payload: NotionSyncJobPayload,
  delaySeconds = 0
): Promise<void> {
  const client = getQStashClient();
  await client.publishJSON({
    url: notionSyncWorkerUrl(),
    body: payload,
    delay: delaySeconds,
    deduplicationId: payload.bookmarkIds?.length
      ? undefined
      : `notion-sync-${payload.userId}`,
  });
}

export { BATCH_DELAY_SECONDS, BATCH_SIZE };
