import {
  Action,
  ActionPanel,
  Detail,
  Form,
  Icon,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useEffect, useRef, useState } from "react";
import {
  askAiEndpoint,
  getOrCreateAskAiSessionId,
  resetAskAiSession,
} from "./lib/api";
import { AuthError, clearStoredAuth, getStoredApiKey } from "./lib/auth";
import { siteUrl } from "./lib/config";
import { SignInList } from "./lib/sign-in-list";
import { streamAskAi, type ChatMessage } from "./lib/stream";

export default function AskAi() {
  const [apiKey, setApiKey] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    void getStoredApiKey().then(setApiKey);
  }, []);

  if (apiKey === undefined) {
    return <Detail isLoading markdown="Loading…" />;
  }
  if (!apiKey) {
    return (
      <SignInList
        title="Sign in to ask your bookmarks"
        onSignedIn={() => {
          void getStoredApiKey().then(setApiKey);
        }}
      />
    );
  }

  return <AskAiSession apiKey={apiKey} onAuthLost={() => setApiKey(null)} />;
}

function AskAiSession({
  apiKey,
  onAuthLost,
}: {
  apiKey: string;
  onAuthLost: () => void;
}) {
  const { push, pop } = useNavigation();
  const messagesRef = useRef<ChatMessage[]>([]);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    void getOrCreateAskAiSessionId().then((id) => {
      sessionIdRef.current = id;
    });
  }, []);

  async function submit(values: { question: string }) {
    const question = values.question.trim();
    if (!question) return;
    const sessionId =
      sessionIdRef.current ?? (await getOrCreateAskAiSessionId());
    sessionIdRef.current = sessionId;
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
    };
    messagesRef.current = [...messagesRef.current, userMsg];
    push(
      <AnswerView
        apiKey={apiKey}
        sessionId={sessionId}
        history={messagesRef.current}
        onUpdateHistory={(next) => {
          messagesRef.current = next;
        }}
        onAuthLost={async () => {
          await clearStoredAuth();
          onAuthLost();
          pop();
        }}
        onFollowUp={() => pop()}
        onNewChat={async () => {
          messagesRef.current = [];
          sessionIdRef.current = await resetAskAiSession();
          pop();
        }}
      />
    );
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Ask" icon={Icon.SpeechBubble} onSubmit={submit} />
          <Action.OpenInBrowser title="Open WakeMark" url={siteUrl()} />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="question"
        title="Question"
        placeholder="What did I save about AI agents?"
        autoFocus
      />
      <Form.Description text="Answers use bookmarks already in WakeMark. Import older X history from the Chrome extension." />
    </Form>
  );
}

function AnswerView({
  apiKey,
  sessionId,
  history,
  onUpdateHistory,
  onAuthLost,
  onFollowUp,
  onNewChat,
}: {
  apiKey: string;
  sessionId: string;
  history: ChatMessage[];
  onUpdateHistory: (next: ChatMessage[]) => void;
  onAuthLost: () => void;
  onFollowUp: () => void;
  onNewChat: () => void;
}) {
  const [markdown, setMarkdown] = useState("Thinking…");
  const [isLoading, setIsLoading] = useState(true);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const assistantId = crypto.randomUUID();
    void (async () => {
      try {
        const text = await streamAskAi({
          apiKey,
          sessionId,
          endpoint: askAiEndpoint(),
          messages: history,
          onDelta: (snapshot) => {
            setMarkdown(snapshot || "Thinking…");
          },
        });
        const next = [
          ...history,
          { id: assistantId, role: "assistant" as const, content: text },
        ];
        onUpdateHistory(next);
        setMarkdown(text.trim() ? text : "_No answer returned._");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Chat failed";
        if (error instanceof AuthError || message.includes("sign in")) {
          await showToast({
            style: Toast.Style.Failure,
            title: "Session expired",
            message,
          });
          onAuthLost();
          return;
        }
        setMarkdown(`**Error**\n\n${message}`);
        await showToast({
          style: Toast.Style.Failure,
          title: "Ask AI failed",
          message,
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [apiKey, history, onAuthLost, onUpdateHistory, sessionId]);

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action title="Ask Follow-up" icon={Icon.Plus} onAction={onFollowUp} />
          <Action title="New Chat" icon={Icon.Trash} onAction={onNewChat} />
          <Action.CopyToClipboard title="Copy Answer" content={markdown} />
          <Action.OpenInBrowser title="Open WakeMark" url={siteUrl()} />
        </ActionPanel>
      }
    />
  );
}
