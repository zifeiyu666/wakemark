"use client";

import { Button } from "@/components/ui/button";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { authClient } from "@/lib/auth/auth-client";
import { useLocale, useTranslations } from "next-intl";
import { Inbox } from "lucide-react";
import { useState } from "react";

export function ConnectXCard() {
  const t = useTranslations("Bookmarks");
  const locale = useLocale();
  const [isConnecting, setIsConnecting] = useState(false);

  // Re-authorize through the auth provider so the refreshed X tokens land in
  // both the account table and the xConnections store.
  const handleConnect = async () => {
    setIsConnecting(true);
    const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
    await authClient.linkSocial({
      provider: "twitter",
      callbackURL: `${prefix}/dashboard/bookmarks`,
      errorCallbackURL: `${prefix}/dashboard/bookmarks?error=link-failed`,
    });
  };

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
      <Button onClick={handleConnect} disabled={isConnecting}>
        {t("connect.button")}
      </Button>
      <p className="text-xs text-muted-foreground">{t("connect.note")}</p>
    </div>
  );
}
