import { apiResponse } from "@/lib/api-response";
import { takeExtensionGrant } from "@/lib/extension/auth-store";
import {
  extensionOptionsResponse,
  withExtensionCors,
} from "@/lib/extension/cors";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  state: z.string().uuid(),
});

export async function OPTIONS(req: Request) {
  return extensionOptionsResponse(req);
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { state } = bodySchema.parse(json);
    const grant = await takeExtensionGrant(state);

    if (!grant) {
      return withExtensionCors(
        req,
        apiResponse.success({ pending: true })
      );
    }

    return withExtensionCors(
      req,
      apiResponse.success({
        pending: false,
        apiKey: grant.apiKey,
        keyId: grant.keyId,
      })
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return withExtensionCors(req, apiResponse.badRequest("Invalid state."));
    }
    console.error("[extension:poll]", error);
    return withExtensionCors(
      req,
      apiResponse.serverError("Failed to poll extension auth.")
    );
  }
}
