import { parseTweetId } from "@/lib/twitter-screenshot/parse";
import { getTweet } from "react-tweet/api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const idParam = request.nextUrl.searchParams.get("id");
  const tweetId = idParam ? parseTweetId(idParam) : null;

  if (!tweetId) {
    return NextResponse.json(
      { error: "Invalid tweet URL or ID." },
      { status: 400 }
    );
  }

  try {
    const tweet = await getTweet(tweetId);
    if (!tweet) {
      return NextResponse.json({ error: "Tweet not found." }, { status: 404 });
    }
    return NextResponse.json({ data: tweet });
  } catch {
    return NextResponse.json(
      { error: "Failed to load tweet. It may be private or deleted." },
      { status: 502 }
    );
  }
}
