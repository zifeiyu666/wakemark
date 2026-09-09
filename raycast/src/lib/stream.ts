import { AuthError } from "./auth";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

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
  if (typeof event.textDelta === "string") return event.textDelta;
  return null;
}

export async function streamAskAi(opts: {
  sessionId: string;
  apiKey: string;
  endpoint: string;
  messages: ChatMessage[];
  onDelta: (text: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const res = await fetch(opts.endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sessionId: opts.sessionId,
      messages: opts.messages.map((m) => ({
        role: m.role,
        parts: [{ type: "text", text: m.content }],
      })),
    }),
    signal: opts.signal,
  });

  if (res.status === 401) {
    throw new AuthError("Session expired. Please sign in again.");
  }

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

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(":")) continue;
      const payload = trimmed.startsWith("data:")
        ? trimmed.slice(5).trim()
        : trimmed;
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload) as Record<string, unknown>;
        const delta = extractDelta(event);
        if (delta) {
          assistantText += delta;
          opts.onDelta(assistantText);
        }
      } catch {
        // ignore partial JSON
      }
    }
  }

  return assistantText;
}
