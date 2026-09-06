import { FormEvent, useEffect, useRef, useState } from "react";
import {
  askAiEndpoint,
  getOrCreateAskAiSessionId,
  getStoredApiKey,
} from "./api";

type Part = { type: string; text?: string };
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  parts: Part[];
};

export function textOf(message: ChatMessage): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

function extractDelta(event: Record<string, unknown>): string | null {
  const type = typeof event.type === "string" ? event.type : "";
  if (
    type === "text-delta" ||
    type === "text-delta.delta" ||
    type.endsWith("text-delta")
  ) {
    if (typeof event.delta === "string") return event.delta;
    if (typeof event.textDelta === "string") return event.textDelta;
  }
  // Older / alternate shapes
  if (typeof event.textDelta === "string") return event.textDelta;
  return null;
}

/**
 * Minimal streaming chat client for POST /api/extension/ask-ai
 * (AI SDK toUIMessageStreamResponse).
 */
export function useAskAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"ready" | "streaming" | "error">(
    "ready"
  );
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    void getOrCreateAskAiSessionId().then((id) => {
      sessionIdRef.current = id;
    });
  }, []);

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || status === "streaming") return;

    const sessionId =
      sessionIdRef.current ?? (await getOrCreateAskAiSessionId());
    sessionIdRef.current = sessionId;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      parts: [{ type: "text", text }],
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setStatus("streaming");
    setError(null);

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        parts: [{ type: "text", text: "" }],
      },
    ]);

    try {
      const apiKey = await getStoredApiKey();
      if (!apiKey) throw new Error("Not signed in");

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch(askAiEndpoint(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          messages: nextMessages.map((m) => ({
            role: m.role,
            parts: m.parts,
          })),
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let message = `Request failed (${res.status})`;
        try {
          const json = (await res.json()) as { error?: string };
          if (json.error) message = json.error;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      if (!res.body) throw new Error("Empty response");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      const pushText = (delta: string) => {
        assistantText += delta;
        const snapshot = assistantText;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, parts: [{ type: "text", text: snapshot }] }
              : m
          )
        );
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;
          let payload = trimmed.startsWith("data:")
            ? trimmed.slice(5).trim()
            : trimmed;
          if (!payload || payload === "[DONE]") continue;
          try {
            const event = JSON.parse(payload) as Record<string, unknown>;
            const delta = extractDelta(event);
            if (delta) pushText(delta);
          } catch {
            // ignore non-JSON
          }
        }
      }

      setStatus("ready");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setStatus("ready");
        return;
      }
      const message = err instanceof Error ? err.message : "Chat failed";
      setError(message);
      setStatus("error");
      setMessages((prev) =>
        prev.filter((m) => !(m.id === assistantId && !textOf(m).trim()))
      );
    }
  }

  return {
    messages,
    input,
    setInput,
    status,
    error,
    send,
  };
}
