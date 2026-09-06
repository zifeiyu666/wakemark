import { streamChat } from "@/lib/ai/chat";
import { apiResponse } from "@/lib/api-response";
import { verifyApiKeyFromRequest } from "@/lib/auth/api-key";
import { createBookmarkTools } from "@/lib/bookmarks/ask-ai-tools";
import { db } from "@/lib/db";
import { askAiMessages } from "@/lib/db/schema";
import {
  extensionOptionsResponse,
  withExtensionCors,
} from "@/lib/extension/cors";
import { getRateLimiter } from "@/lib/upstash";
import { REDIS_RATE_LIMIT_CONFIGS } from "@/lib/upstash/redis-rate-limit-configs";
import { stepCountIs } from "ai";
import { z } from "zod";

export const runtime = "nodejs";

const ASK_AI_MODEL =
  process.env.BOOKMARK_AI_MODEL ?? "deepseek/deepseek-v4-flash";

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

const uiMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().optional(),
  parts: z
    .array(
      z
        .object({
          type: z.string(),
          text: z.string().optional(),
        })
        .passthrough()
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

export async function OPTIONS(req: Request) {
  return extensionOptionsResponse(req);
}

export async function POST(req: Request) {
  try {
    const verified = await verifyApiKeyFromRequest(req);
    if (!verified) {
      return withExtensionCors(
        req,
        apiResponse.unauthorized("Please sign in via the extension to ask your bookmarks.")
      );
    }

    const userId = verified.userId;

    const limiter = getRateLimiter(REDIS_RATE_LIMIT_CONFIGS.askAi);
    if (limiter) {
      const { success } = await limiter.limit(userId);
      if (!success) {
        return withExtensionCors(
          req,
          apiResponse.error(
            "Too many questions today. Please try again tomorrow.",
            429
          )
        );
      }
    }

    const body = await req.json();
    const input = inputSchema.parse(body);

    const messages = input.messages
      .map((m) => ({ role: m.role, content: extractContent(m) }))
      .filter((m) => m.content.trim())
      .slice(-HISTORY_LIMIT);

    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      return withExtensionCors(
        req,
        apiResponse.badRequest("Invalid chat payload.")
      );
    }

    await db.insert(askAiMessages).values({
      userId,
      sessionId: input.sessionId,
      role: "user",
      content: messages[messages.length - 1].content,
    });

    const result = streamChat({
      provider: "openrouter",
      modelId: ASK_AI_MODEL,
      messages,
      system: ASK_AI_SYSTEM_PROMPT,
      tools: createBookmarkTools(userId),
      stopWhen: stepCountIs(4),
      onFinish: async ({ text, usage }) => {
        if (!text.trim()) return;
        try {
          await db.insert(askAiMessages).values({
            userId,
            sessionId: input.sessionId,
            role: "assistant",
            content: text,
            modelId: ASK_AI_MODEL,
            promptTokens: usage?.inputTokens,
            completionTokens: usage?.outputTokens,
          });
        } catch (error) {
          console.warn("[extension:ask-ai] failed to persist assistant reply", error);
        }
      },
    });

    const streamResponse = result.toUIMessageStreamResponse();
    return withExtensionCors(req, streamResponse);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return withExtensionCors(
        req,
        apiResponse.badRequest("Invalid chat payload.")
      );
    }
    const message =
      error instanceof Error ? error.message : "Chat generation failed";
    return withExtensionCors(req, apiResponse.serverError(message));
  }
}
