import { getLanguageModel } from "@/config/ai-providers";
import { streamText, type StopCondition, type Tool } from "ai";

interface ChatOptions {
  provider: string;
  modelId: string;
  messages?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  prompt?: string;
  system?: string;
  /** Optional tool set for agentic (tool-calling) chats. */
  tools?: Record<string, Tool>;
  /** Optional stop condition, e.g. stepCountIs(n) for multi-step tool loops. */
  stopWhen?: StopCondition<any>;
  /** Optional completion hook, e.g. persist the assistant reply. */
  onFinish?: (result: {
    text: string;
    usage?: { inputTokens?: number; outputTokens?: number };
  }) => void | Promise<void>;
}

/**
 * Unified chat generation entry point. Supports both single-turn (prompt) and multi-turn (messages).
 * Returns the AI SDK streamText result; the API route calls .toTextStreamResponse() to stream it to the client.
 */
export function streamChat(options: ChatOptions) {
  const model = getLanguageModel(options.provider, options.modelId);

  const messages = options.messages ?? [
    { role: "user" as const, content: options.prompt ?? "" },
  ];

  return streamText({
    model,
    system: options.system,
    messages,
    tools: options.tools,
    stopWhen: options.stopWhen,
    onFinish: async ({ text, usage }) => {
      if (options.onFinish) {
        await options.onFinish({ text, usage });
      } else {
        console.log(text);
        // you can insert data to database here
      }
    },
  });
}
