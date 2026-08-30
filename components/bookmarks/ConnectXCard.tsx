"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Inbox } from "lucide-react";

export function ConnectXCard() {
  const t = useTranslations("Bookmarks");

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-background px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
        <Inbox className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{t("connect.title")}</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {t("connect.description")}
        </p>
      </div>
      <Button asChild>
        <a href="/api/x/connect">{t("connect.button")}</a>
      </Button>
      <p className="text-xs text-muted-foreground">{t("connect.note")}</p>
    </div>
  );
}
