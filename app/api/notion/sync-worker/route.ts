import {
  processNotionSyncBatch,
} from "@/lib/notion/sync-core";
import type { NotionSyncJobPayload } from "@/lib/notion/sync-queue";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

async function handler(request: Request) {
  const payload = (await request.json()) as NotionSyncJobPayload;
  if (!payload?.userId) {
    return new Response(JSON.stringify({ error: "invalid-payload" }), {
      status: 400,
    });
  }

  const result = await processNotionSyncBatch(payload);
  return Response.json(result);
}

export const POST = verifySignatureAppRouter(handler);
