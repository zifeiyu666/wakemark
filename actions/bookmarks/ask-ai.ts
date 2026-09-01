"use server";

import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { askAiMessages } from "@/lib/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";

// Restoring a whole session only needs recent context; very old turns stay in
// the DB but are not re-sent to the client.
const SESSION_RESTORE_LIMIT = 100;

export type AskAiSessionPayload = {
  sessionId: string;
  messages: { id: string; role: "user" | "assistant"; content: string }[];
};

/**
 * Returns the transcript of one Ask AI chat session. Without a sessionId the
 * user's most recent session is resolved; null when nothing was saved yet.
 */
export async function getAskAiSession(
  sessionId?: string
): Promise<AskAiSessionPayload | null> {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return null;

  let sid = sessionId;
  if (!sid) {
    const [latest] = await db
      .select({ sessionId: askAiMessages.sessionId })
      .from(askAiMessages)
      .where(eq(askAiMessages.userId, userId))
      .orderBy(desc(askAiMessages.createdAt))
      .limit(1);
    sid = latest?.sessionId;
  }
  if (!sid) return null;

  const rows = await db
    .select({
      id: askAiMessages.id,
      role: askAiMessages.role,
      content: askAiMessages.content,
    })
    .from(askAiMessages)
    .where(
      and(eq(askAiMessages.userId, userId), eq(askAiMessages.sessionId, sid))
    )
    .orderBy(asc(askAiMessages.createdAt))
    .limit(SESSION_RESTORE_LIMIT);

  return {
    sessionId: sid,
    messages: rows.map((row) => ({
      id: row.id,
      role: row.role === "assistant" ? "assistant" : "user",
      content: row.content,
    })),
  };
}
