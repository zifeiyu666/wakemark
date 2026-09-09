import { auth } from "@/lib/auth";
import { getSession } from "@/lib/auth/server";
import { apiResponse } from "@/lib/api-response";
import { storeExtensionGrant } from "@/lib/extension/auth-store";
import { EXTENSION_CLIENTS } from "@/lib/extension/clients";
import {
  extensionOptionsResponse,
  withExtensionCors,
} from "@/lib/extension/cors";
import { db } from "@/lib/db";
import { apikey } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  state: z.string().uuid(),
  client: z.enum(["chrome", "raycast"]).optional().default("chrome"),
});

function parseMetadata(raw: string | null | undefined): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function OPTIONS(req: Request) {
  return extensionOptionsResponse(req);
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const user = session?.user;
    if (!user) {
      return withExtensionCors(
        req,
        apiResponse.unauthorized("Please sign in to connect the extension.")
      );
    }

    const json = await req.json();
    const { state, client } = bodySchema.parse(json);
    const { purpose, keyName } = EXTENSION_CLIENTS[client];

    // One active key per client (Chrome vs Raycast) so signing into Raycast
    // does not kick the Chrome extension offline.
    const existing = await db
      .select({ id: apikey.id, metadata: apikey.metadata })
      .from(apikey)
      .where(eq(apikey.userId, user.id));

    for (const row of existing) {
      const meta = parseMetadata(row.metadata);
      if (meta?.purpose === purpose) {
        try {
          await auth.api.deleteApiKey({
            headers: await headers(),
            body: { keyId: row.id },
          });
        } catch (error) {
          console.warn("[extension:grant] failed to revoke prior key", error);
        }
      }
    }

    const created = await auth.api.createApiKey({
      headers: await headers(),
      body: {
        name: keyName,
        expiresIn: null,
        metadata: { purpose },
      },
    });

    if (!created?.key || !created.id) {
      return withExtensionCors(
        req,
        apiResponse.serverError("Failed to create extension API key.")
      );
    }

    await storeExtensionGrant(state, {
      apiKey: created.key,
      userId: user.id,
      keyId: created.id,
      user: {
        id: user.id,
        name: user.name ?? null,
        image: user.image ?? null,
      },
    });

    return withExtensionCors(
      req,
      apiResponse.success({ granted: true })
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return withExtensionCors(req, apiResponse.badRequest("Invalid state."));
    }
    console.error("[extension:grant]", error);
    return withExtensionCors(
      req,
      apiResponse.serverError("Failed to grant extension access.")
    );
  }
}
