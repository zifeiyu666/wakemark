"use server";

import { ActionResult, actionResponse } from "@/lib/action-response";
import { getSession } from "@/lib/auth/server";
import { processPendingForUser } from "@/lib/bookmarks/process-core";
import { getErrorMessage } from "@/lib/error-utils";

export async function processPendingBookmarks(): Promise<
  ActionResult<{ processed: number; remaining: number }>
> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  if (!process.env.OPENROUTER_API_KEY) {
    return actionResponse.error(
      "OpenRouter is not configured (OPENROUTER_API_KEY missing).",
      "openrouter-missing"
    );
  }

  try {
    return actionResponse.success(await processPendingForUser(user.id));
  } catch (error) {
    console.error("[bookmarks:process] error processing bookmarks", error);
    return actionResponse.error(getErrorMessage(error));
  }
}
