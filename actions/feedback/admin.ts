"use server";

import { ActionResult, actionResponse } from "@/lib/action-response";
import { isAdmin } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { feedbacks, user as userSchema } from "@/lib/db/schema";
import { getErrorMessage } from "@/lib/error-utils";
import { count, desc, eq } from "drizzle-orm";

export type FeedbackListItem = {
  id: string;
  category: "bug" | "feature" | "question";
  title: string;
  message: string;
  createdAt: Date;
  user: {
    email: string | null;
    name: string | null;
  } | null;
};

export type GetFeedbacksResult = ActionResult<{
  items: FeedbackListItem[];
  totalCount: number;
}>;

const DEFAULT_PAGE_SIZE = 20;

export async function getFeedbacks({
  pageIndex = 0,
  pageSize = DEFAULT_PAGE_SIZE,
}: {
  pageIndex?: number;
  pageSize?: number;
} = {}): Promise<GetFeedbacksResult> {
  if (!(await isAdmin())) {
    return actionResponse.forbidden("Admin privileges required.");
  }

  try {
    const safePageIndex = Math.max(0, pageIndex);
    const safePageSize = Math.min(Math.max(1, pageSize), 100);

    const itemsQuery = db
      .select({
        id: feedbacks.id,
        category: feedbacks.category,
        title: feedbacks.title,
        message: feedbacks.message,
        createdAt: feedbacks.createdAt,
        user: {
          email: userSchema.email,
          name: userSchema.name,
        },
      })
      .from(feedbacks)
      .leftJoin(userSchema, eq(feedbacks.userId, userSchema.id))
      .orderBy(desc(feedbacks.createdAt))
      .offset(safePageIndex * safePageSize)
      .limit(safePageSize);

    const totalCountQuery = db.select({ value: count() }).from(feedbacks);

    const [rows, totalCountResult] = await Promise.all([
      itemsQuery,
      totalCountQuery,
    ]);

    return actionResponse.success({
      items: rows,
      totalCount: totalCountResult[0]?.value ?? 0,
    });
  } catch (error) {
    return actionResponse.error(getErrorMessage(error));
  }
}
