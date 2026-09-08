import { streamChat } from "@/lib/ai/chat";
import { apiResponse } from "@/lib/api-response";
import { getSession } from "@/lib/auth/server";
import { createBookmarkTools } from "@/lib/bookmarks/ask-ai-tools";
import { db } from "@/lib/db";
import { askAiMessages } from "@/lib/db/schema";
import { hasBookmarkServiceAccess } from "@/lib/payments/subscription";
import { getRateLimiter } from "@/lib/upstash";
import { REDIS_RATE_LIMIT_CONFIGS } from "@/lib/upstash/redis-rate-limit-configs";
import { stepCountIs } from "ai";
import { z } from "zod";

// The assistant reuses the OpenRouter bookmark model: cheap and fast enough
// for interactive chat, and already configured for tagging/summary work.
const ASK_AI_MODEL =
  process.env.BOOKMARK_AI_MODEL ?? "deepseek/deepseek-v4-flash";

// Cap on the history fed to the model: long sessions stay cheap while the DB
// keeps the full transcript for restoration.
const HISTORY_LIMIT = 20;

const ASK_AI_SYSTEM_PROMPT = [
  "You are the bookmark assistant inside WakeMark, answering questions about the user's own X (Twitter) bookmarks.",
  "Ground every answer in tool results; never guess or invent bookmark content.",
  "- For counts, totals and breakdowns call countBookmarks.",
  "- For listing bookmarks by category, tag, author, read state or keyword call listBookmarks.",
  "- For open-ended content questions (topics, recommendations, what a tweet said) call searchBookmarks.",
  "- You may combine multiple tools in one answer when needed.",
  "Whenever you refer to a specific bookmark, cite it as a markdown link using its tweetUrl: [@author](tweetUrl).",
  "If the tools return no matching bookmarks, say so honestly and briefly suggest what the user could try next.",
  "Keep answers concise and scannable; use markdown lists where helpful.",
].join("\n");

// v6 UIMessage format: messages have `parts` array instead of `content` string
const uiMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().optional(),
  parts: z
    .array(
      z.object({
        type: z.string(),
        text: z.string().optional(),
      }).passthrough()
    )
    .optional(),
});

const inputSchema = z.object({
  messages: z.array(uiMessageSchema).min(1),
  sessionId: z.string().uuid(),
});

function extractContent(msg: z.infer<typeof uiMessageSchema>): string {
  if (msg.content) return msg.content;
  if (msg.parts) {
    return msg.parts
      .filter((p) => p.type === "text" && p.text)
      .map((p) => p.text!)
      .join("");
  }
  return "";
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const user = session?.user;
    if (!user) {
      return apiResponse.unauthorized("Please sign in to ask your bookmarks.");
    }

    if (!(await hasBookmarkServiceAccess(user.id))) {
      return apiResponse.error(
        "An active subscription is required to ask your bookmarks.",
        402
      );
    }

    const limiter = getRateLimiter(REDIS_RATE_LIMIT_CONFIGS.askAi);
    if (limiter) {
      const { success } = await limiter.limit(user.id);
      if (!success) {
        return apiResponse.error(
          "Too many questions today. Please try again tomorrow.",
          429
        );
      }
    }

    const body = await req.json();
    const input = inputSchema.parse(body);

    // Drop empty turns (assistant messages that only carried tool parts) and
    // cap the context window; the last entry must stay the current question.
    const messages = input.messages
      .map((m) => ({ role: m.role, content: extractContent(m) }))
      .filter((m) => m.content.trim())
      .slice(-HISTORY_LIMIT);

    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      return apiResponse.badRequest("Invalid chat payload.");
    }

    // Persist the user turn before streaming so a failed generation still
    // leaves the question in the transcript.
    await db.insert(askAiMessages).values({
      userId: user.id,
      sessionId: input.sessionId,
      role: "user",
      content: messages[messages.length - 1].content,
    });

    const result = streamChat({
      provider: "openrouter",
      modelId: ASK_AI_MODEL,
      messages,
      system: ASK_AI_SYSTEM_PROMPT,
      tools: createBookmarkTools(user.id),
      stopWhen: stepCountIs(4),
      onFinish: async ({ text, usage }) => {
        if (!text.trim()) return;
        try {
          await db.insert(askAiMessages).values({
            userId: user.id,
            sessionId: input.sessionId,
            role: "assistant",
            content: text,
            modelId: ASK_AI_MODEL,
            promptTokens: usage?.inputTokens,
            completionTokens: usage?.outputTokens,
          });
        } catch (error) {
          console.warn("[ask-ai] failed to persist assistant reply", error);
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return apiResponse.badRequest("Invalid chat payload.");
    }
    return apiResponse.serverError(error.message || "Chat generation failed");
  }
}
