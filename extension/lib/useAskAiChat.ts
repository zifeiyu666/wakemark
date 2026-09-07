import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  askAiEndpoint,
  AuthError,
  clearStoredAuth,
  getOrCreateAskAiSessionId,
  getStoredApiKey,
} from "./api";
import { STORAGE_KEYS } from "./config";

type Part = { type: string; text?: string };
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  parts: Part[];
};

const MAX_CACHED_MESSAGES = 80;

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
  if (typeof event.textDelta === "string") return event.textDelta;
  return null;
}

function normalizeMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        typeof m === "object" &&
        typeof (m as ChatMessage).id === "string" &&
        ((m as ChatMessage).role === "user" ||
          (m as ChatMessage).role === "assistant") &&
        Array.isArray((m as ChatMessage).parts)
    )
    .map((m) => ({
      id: m.id,
      role: m.role,
      parts: m.parts
        .filter((p) => p && typeof p.type === "string")
        .map((p) => ({ type: p.type, text: typeof p.text === "string" ? p.text : "" })),
    }))
    // Drop empty trailing assistant bubbles left from interrupted streams.
    .filter((m, i, arr) => {
      if (m.role !== "assistant") return true;
      if (textOf(m).trim()) return true;
      return i !== arr.length - 1;
    });
}

async function persistMessages(messages: ChatMessage[]) {
  const trimmed = messages.slice(-MAX_CACHED_MESSAGES);
  await chrome.storage.local.set({
    [STORAGE_KEYS.askAiMessages]: trimmed,
  });
}

async function persistDraft(draft: string) {
  await chrome.storage.local.set({
    [STORAGE_KEYS.askAiDraft]: draft,
  });
}

/**
 * Minimal streaming chat client for POST /api/extension/ask-ai.
 * Transcript + draft input are cached in chrome.storage.local so switching
 * tabs / closing the popup does not wipe the conversation.
 */
export function useAskAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInputState] = useState("");
  const [status, setStatus] = useState<"ready" | "streaming" | "error">(
    "ready"
  );
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedulePersist = useCallback((next: ChatMessage[]) => {
    messagesRef.current = next;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      void persistMessages(next);
    }, 200);
  }, []);

  const commitMessages = useCallback(
    (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      setMessages((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        schedulePersist(next);
        return next;
      });
    },
    [schedulePersist]
  );

  const setInput = useCallback((value: string) => {
    setInputState(value);
    void persistDraft(value);
  }, []);

  // Hydrate from local storage once.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [sessionId, stored] = await Promise.all([
        getOrCreateAskAiSessionId(),
        chrome.storage.local.get([
          STORAGE_KEYS.askAiMessages,
          STORAGE_KEYS.askAiDraft,
        ]),
      ]);
      if (cancelled) return;
      sessionIdRef.current = sessionId;
      const restored = normalizeMessages(stored[STORAGE_KEYS.askAiMessages]);
      messagesRef.current = restored;
      setMessages(restored);
      const draft = stored[STORAGE_KEYS.askAiDraft];
      if (typeof draft === "string") setInputState(draft);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep in sync if another surface (popup ↔ sidepanel) writes the cache.
  useEffect(() => {
    const onChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if (area !== "local") return;
      if (STORAGE_KEYS.askAiMessages in changes && status !== "streaming") {
        const restored = normalizeMessages(
          changes[STORAGE_KEYS.askAiMessages].newValue
        );
        messagesRef.current = restored;
        setMessages(restored);
      }
      if (STORAGE_KEYS.askAiDraft in changes && status !== "streaming") {
        const draft = changes[STORAGE_KEYS.askAiDraft].newValue;
        if (typeof draft === "string") setInputState(draft);
      }
      if (
        STORAGE_KEYS.apiKey in changes &&
        !changes[STORAGE_KEYS.apiKey].newValue
      ) {
        // Signed out elsewhere.
        messagesRef.current = [];
        setMessages([]);
        setInputState("");
        setError(null);
        setStatus("ready");
      }
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, [status]);

  useEffect(() => {
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
      // Flush latest transcript on unmount (tab switch / popup close).
      void persistMessages(messagesRef.current);
    };
  }, []);

  async function send(e?: FormEvent) {
    e?.preventDefault();
    if (!hydrated) return;
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
    const nextMessages = [...messagesRef.current, userMsg];
    commitMessages(nextMessages);
    setInput("");
    setStatus("streaming");
    setError(null);

    const assistantId = crypto.randomUUID();
    commitMessages([
      ...nextMessages,
      {
        id: assistantId,
        role: "assistant",
        parts: [{ type: "text", text: "" }],
      },
    ]);

    try {
      const apiKey = await getStoredApiKey();
      if (!apiKey) throw new AuthError();

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

      if (res.status === 401) {
        await clearStoredAuth();
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

      const pushText = (delta: string) => {
        assistantText += delta;
        const snapshot = assistantText;
        commitMessages((prev) =>
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
            // ignore
          }
        }
      }

      // Final flush
      await persistMessages(messagesRef.current);
      setStatus("ready");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // Keep whatever partial assistant text we already have.
        commitMessages((prev) =>
          prev.filter((m) => !(m.id === assistantId && !textOf(m).trim()))
        );
        await persistMessages(messagesRef.current);
        setStatus("ready");
        return;
      }
      const message = err instanceof Error ? err.message : "Chat failed";
      setError(message);
      setStatus("error");
      commitMessages((prev) =>
        prev.filter((m) => !(m.id === assistantId && !textOf(m).trim()))
      );
      await persistMessages(messagesRef.current);
    }
  }

  function stop() {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("ready");
  }

  async function clearChat() {
    abortRef.current?.abort();
    abortRef.current = null;
    messagesRef.current = [];
    setMessages([]);
    setInput("");
    setError(null);
    setStatus("ready");
    // New server session for a fresh transcript.
    const id = crypto.randomUUID();
    sessionIdRef.current = id;
    await chrome.storage.local.set({
      [STORAGE_KEYS.askAiSessionId]: id,
      [STORAGE_KEYS.askAiMessages]: [],
      [STORAGE_KEYS.askAiDraft]: "",
    });
  }

  return {
    messages,
    input,
    setInput,
    status,
    error,
    hydrated,
    send,
    stop,
    clearChat,
  };
}
