"use client";

import { getAskAiSession } from "@/actions/bookmarks/ask-ai";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader2, MessageCircle, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { AskAiChat } from "./AskAiChat";

/**
 * Floating "Ask AI" trigger (bottom-right of the dashboard) that expands on
 * hover and opens a right-side drawer for bookmark Q&A.
 */
export default function AskAiWidget() {
  const t = useTranslations("AskAi");
  const [open, setOpen] = useState(false);
  // Remounting the chat clears the in-memory conversation ("New chat").
  const [chatKey, setChatKey] = useState(0);
  // Active chat session: resolved once on mount (most recent or brand new).
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAskAiSession()
      .then((session) => {
        if (!cancelled) setSessionId(session?.sessionId ?? crypto.randomUUID());
      })
      .catch(() => {
        // History lookup failed: still allow chatting in a fresh session.
        if (!cancelled) setSessionId(crypto.randomUUID());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNewChat = () => {
    setSessionId(crypto.randomUUID());
    setChatKey((k) => k + 1);
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("trigger")}
          className="group fixed right-6 bottom-6 z-50 flex h-14 items-center rounded-full bg-primary px-[15px] text-primary-foreground shadow-lg transition-shadow hover:shadow-xl"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="max-w-0 overflow-hidden text-sm font-medium whitespace-nowrap opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-24 group-hover:opacity-100">
            {t("trigger")}
          </span>
        </button>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full gap-0 p-0 sm:max-w-[600px]"
        >
          <SheetHeader className="flex-row items-center justify-between gap-2 border-b py-3 pr-12">
            <SheetTitle className="text-base font-semibold">
              {t("title")}
            </SheetTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewChat}
            >
              <Plus className="h-3.5 w-3.5" />
              {t("newChat")}
            </Button>
          </SheetHeader>
          {sessionId ? (
            <AskAiChat key={chatKey} sessionId={sessionId} />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
