import { getSession } from "@/lib/auth/server";
import { enqueueNotionSyncForUser } from "@/lib/notion/sync-core";
import { getNotionConnectionByUserId } from "@/lib/notion/connection";
import { hasActiveSubscription } from "@/lib/payments/subscription";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await getSession();
  const user = session?.user;
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!(await hasActiveSubscription(user.id))) {
    return NextResponse.json({ error: "not-subscribed" }, { status: 403 });
  }

  const conn = await getNotionConnectionByUserId(user.id);
  if (!conn?.databaseId) {
    return NextResponse.json({ error: "not-configured" }, { status: 400 });
  }

  let bookmarkIds: string[] | undefined;
  try {
    const body = (await request.json()) as { bookmarkIds?: string[] };
    if (body.bookmarkIds?.length) {
      bookmarkIds = body.bookmarkIds;
    }
  } catch {
    // optional body
  }

  await enqueueNotionSyncForUser(user.id, bookmarkIds, true);
  return NextResponse.json({ ok: true });
}
