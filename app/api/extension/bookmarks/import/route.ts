import { apiResponse } from "@/lib/api-response";
import { verifyApiKeyFromRequest } from "@/lib/auth/api-key";
import { insertBookmarkBatch } from "@/lib/bookmarks/ingest";
import { db } from "@/lib/db";
import { xConnections } from "@/lib/db/schema";
import {
  extensionOptionsResponse,
  withExtensionCors,
} from "@/lib/extension/cors";
import { hasBookmarkServiceAccess } from "@/lib/payments/subscription";
import { getRateLimiter } from "@/lib/upstash";
import { REDIS_RATE_LIMIT_CONFIGS } from "@/lib/upstash/redis-rate-limit-configs";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_ITEMS = 100;

function parseCreatedAt(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

const itemSchema = z.object({
  tweet_id: z.string().min(1).max(64),
  text: z.string().max(50_000),
  author_id: z.string().max(64).optional(),
  author_name: z.string().max(200).optional(),
  author_username: z.string().max(200).optional(),
  author_profile_image_url: z.string().max(2000).optional(),
  created_at: z.string().max(64).optional(),
  media_urls: z.array(z.string().max(2000)).max(20).optional(),
  media_types: z.array(z.string().max(40)).max(20).optional(),
  media_playback_urls: z.array(z.string().max(2000)).max(20).optional(),
  urls: z.array(z.string().max(2000)).max(50).optional(),
  entities: z
    .object({
      urls: z
        .array(
          z.object({
            expanded_url: z.string().optional(),
            url: z.string().optional(),
          })
        )
        .optional(),
    })
    .passthrough()
    .optional(),
});

const bodySchema = z.object({
  source: z.literal("chrome_extension").optional(),
  done: z.boolean().optional(),
  items: z.array(itemSchema).max(MAX_ITEMS),
});

export async function OPTIONS(req: Request) {
  return extensionOptionsResponse(req);
}

export async function POST(req: Request) {
  try {
    const verified = await verifyApiKeyFromRequest(req);
    if (!verified) {
      return withExtensionCors(
        req,
        apiResponse.unauthorized("Missing or invalid API key.")
      );
    }

    const userId = verified.userId;
    if (!(await hasBookmarkServiceAccess(userId))) {
      return withExtensionCors(
        req,
        apiResponse.error(
          "An active subscription is required to import bookmarks.",
          402
        )
      );
    }

    const limiter = getRateLimiter(REDIS_RATE_LIMIT_CONFIGS.extensionImport);
    if (limiter) {
      const { success } = await limiter.limit(userId);
      if (!success) {
        return withExtensionCors(
          req,
          apiResponse.error("Too many import requests. Please slow down.", 429)
        );
      }
    }

    const json = await req.json();
    const body = bodySchema.parse(json);

    const ingest = await insertBookmarkBatch(
      userId,
      body.items.map((item) => {
        const entityUrls = (item.entities?.urls ?? [])
          .map((u) => u.expanded_url ?? u.url ?? "")
          .filter(Boolean);
        return {
          tweetId: item.tweet_id,
          text: item.text.trim() || "(no text)",
          authorXId: item.author_id,
          authorName: item.author_name,
          authorUsername: item.author_username,
          authorProfileImageUrl: item.author_profile_image_url,
          tweetCreatedAt: parseCreatedAt(item.created_at),
          mediaUrls: item.media_urls ?? [],
          mediaTypes: item.media_types ?? [],
          mediaPlaybackUrls: item.media_playback_urls ?? [],
          urls: item.urls ?? entityUrls,
        };
      }),
      "extension"
    );

    if (body.done) {
      await db
        .update(xConnections)
        .set({ historyImportCompleted: true })
        .where(eq(xConnections.userId, userId));
    }

    const [conn] = await db
      .select({
        historyImportCompleted: xConnections.historyImportCompleted,
      })
      .from(xConnections)
      .where(eq(xConnections.userId, userId))
      .limit(1);

    return withExtensionCors(
      req,
      apiResponse.success({
        inserted: ingest.inserted,
        skipped: ingest.skipped,
        pendingCount: ingest.pendingCount,
        historyImportCompleted: conn?.historyImportCompleted ?? false,
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return withExtensionCors(
        req,
        apiResponse.badRequest("Invalid import payload.")
      );
    }
    console.error("[extension:import]", error);
    return withExtensionCors(
      req,
      apiResponse.serverError("Import failed.")
    );
  }
}
