import { verifyApiKeyFromRequest } from "@/lib/auth/api-key";
import { apiResponse } from "@/lib/api-response";
import { db } from "@/lib/db";
import { apikey } from "@/lib/db/schema";
import {
  extensionOptionsResponse,
  withExtensionCors,
} from "@/lib/extension/cors";
import { and, eq } from "drizzle-orm";

export const runtime = "nodejs";

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

    await db
      .delete(apikey)
      .where(and(eq(apikey.id, verified.id), eq(apikey.userId, verified.userId)));

    return withExtensionCors(req, apiResponse.success({ revoked: true }));
  } catch (error) {
    console.error("[extension:revoke]", error);
    return withExtensionCors(
      req,
      apiResponse.serverError("Failed to revoke extension key.")
    );
  }
}
