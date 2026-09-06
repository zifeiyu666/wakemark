import { verifyApiKeyFromRequest } from "@/lib/auth/api-key";
import { apiResponse } from "@/lib/api-response";
import { tweetUrlOf } from "@/lib/bookmarks/ask-ai";
import { queryBookmarks } from "@/lib/bookmarks/query";
import {
  extensionOptionsResponse,
  withExtensionCors,
} from "@/lib/extension/cors";

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

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") ?? 10) || 10, 1),
      20
    );

    if (!q) {
      return withExtensionCors(
        req,
        apiResponse.success({ bookmarks: [], totalCount: 0 })
      );
    }

    const { bookmarks, totalCount } = await queryBookmarks(verified.userId, {
      view: "all",
      pageIndex: 0,
      pageSize: limit,
      sort: "newest",
      search: q,
      categories: [],
    });

    return withExtensionCors(
      req,
      apiResponse.success({
        totalCount,
        bookmarks: bookmarks.map((b) => ({
          id: b.id,
          tweetId: b.tweetId,
          text: b.text.slice(0, 280),
          summary: b.summary,
          authorUsername: b.authorUsername,
          authorName: b.authorName,
          authorProfileImageUrl: b.authorProfileImageUrl,
          primaryCategory: b.primaryCategory,
          isRead: b.isRead,
          tweetUrl: tweetUrlOf(b),
        })),
      })
    );
  } catch (error) {
    console.error("[extension:search]", error);
    return withExtensionCors(
      req,
      apiResponse.serverError("Search failed.")
    );
  }
}
