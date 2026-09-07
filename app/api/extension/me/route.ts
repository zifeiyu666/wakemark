import { verifyApiKeyFromRequest } from "@/lib/auth/api-key";
import { apiResponse } from "@/lib/api-response";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import {
  extensionOptionsResponse,
  withExtensionCors,
} from "@/lib/extension/cors";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function OPTIONS(req: Request) {
  return extensionOptionsResponse(req);
}

export async function GET(req: Request) {
  try {
    const verified = await verifyApiKeyFromRequest(req);
    if (!verified) {
      return withExtensionCors(
        req,
        apiResponse.unauthorized("Missing or invalid API key.")
      );
    }

    const [row] = await db
      .select({
        id: user.id,
        name: user.name,
        image: user.image,
      })
      .from(user)
      .where(eq(user.id, verified.userId))
      .limit(1);

    if (!row) {
      return withExtensionCors(req, apiResponse.notFound("User not found."));
    }

    return withExtensionCors(
      req,
      apiResponse.success({
        id: row.id,
        name: row.name ?? null,
        image: row.image ?? null,
      })
    );
  } catch (error) {
    console.error("[extension:me]", error);
    return withExtensionCors(
      req,
      apiResponse.serverError("Failed to load profile.")
    );
  }
}
