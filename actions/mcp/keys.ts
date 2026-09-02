"use server";

import { ActionResult, actionResponse } from "@/lib/action-response";
import { auth } from "@/lib/auth";
import { getSession } from "@/lib/auth/server";
import { getErrorMessage } from "@/lib/error-utils";
import { headers } from "next/headers";
import { z } from "zod";

// API key management for the WakeMark MCP endpoint. Keys are owned by the
// signed-in user and verified per-request by /api/mcp via better-auth.

export type ApiKeyRow = {
  id: string;
  name: string | null;
  start: string | null;
  prefix: string | null;
  enabled: boolean | null;
  createdAt: Date;
  lastRequest: Date | null;
  expiresAt: Date | null;
};

const CreateKeySchema = z.object({
  name: z.string().trim().min(1).max(60),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

export async function createMcpApiKey(params: {
  name: string;
  expiresInDays?: number;
}): Promise<ActionResult<{ id: string; key: string }>> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  try {
    const parsed = CreateKeySchema.parse(params);
    const created = await auth.api.createApiKey({
      headers: await headers(),
      body: {
        name: parsed.name,
        expiresIn: parsed.expiresInDays
          ? parsed.expiresInDays * 24 * 60 * 60
          : null,
        metadata: { purpose: "mcp" },
      },
    });
    if (!created?.key) {
      return actionResponse.error("Failed to create API key.");
    }
    // The plaintext key is only ever returned here; afterwards only the
    // stored prefix ("start") is visible.
    return actionResponse.success({ id: created.id, key: created.key });
  } catch (error) {
    console.error("[mcp:keys] create failed", error);
    return actionResponse.error(getErrorMessage(error));
  }
}

export async function listMcpApiKeys(): Promise<ActionResult<ApiKeyRow[]>> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  try {
    const keys = await auth.api.listApiKeys({
      headers: await headers(),
    });
    const rows: ApiKeyRow[] = (keys ?? []).map((k) => ({
      id: k.id,
      name: k.name ?? null,
      start: k.start ?? null,
      prefix: k.prefix ?? null,
      enabled: k.enabled ?? true,
      createdAt: new Date(k.createdAt),
      lastRequest: k.lastRequest ? new Date(k.lastRequest) : null,
      expiresAt: k.expiresAt ? new Date(k.expiresAt) : null,
    }));
    rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return actionResponse.success(rows);
  } catch (error) {
    console.error("[mcp:keys] list failed", error);
    return actionResponse.error(getErrorMessage(error));
  }
}

export async function revokeMcpApiKey(keyId: string): Promise<ActionResult> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  try {
    await auth.api.deleteApiKey({
      headers: await headers(),
      body: { keyId },
    });
    return actionResponse.success();
  } catch (error) {
    console.error("[mcp:keys] revoke failed", error);
    return actionResponse.error(getErrorMessage(error));
  }
}
