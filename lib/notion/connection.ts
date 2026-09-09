import "server-only";

import { db } from "@/lib/db";
import { notionConnections } from "@/lib/db/schema";
import { decryptText } from "@/lib/x/crypto";
import { Client } from "@notionhq/client";
import { eq } from "drizzle-orm";

export async function getNotionConnectionByUserId(userId: string) {
  const [row] = await db
    .select()
    .from(notionConnections)
    .where(eq(notionConnections.userId, userId))
    .limit(1);
  return row ?? null;
}

export function createNotionClient(accessTokenEncrypted: string): Client {
  const accessToken = decryptText(accessTokenEncrypted);
  return new Client({ auth: accessToken });
}

export async function getNotionClientForUser(userId: string): Promise<Client | null> {
  const conn = await getNotionConnectionByUserId(userId);
  if (!conn) return null;
  return createNotionClient(conn.accessToken);
}
