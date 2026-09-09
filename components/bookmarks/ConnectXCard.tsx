"use client";

import { Button } from "@/components/ui/button";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { authClient } from "@/lib/auth/auth-client";
import { useLocale, useTranslations } from "next-intl";
import { Inbox } from "lucide-react";
import { useState } from "react";

export function ConnectXCard({
  errorMessage,
  oauthError,
  linkedXUsername,
}: {
  errorMessage?: string | null;
  oauthError?: string | null;
  linkedXUsername?: string | null;
}) {
  const t = useTranslations("Bookmarks");
  const locale = useLocale();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  const alreadyLinked =
    oauthError === "account_already_linked_to_different_user";
  const busy = isConnecting || isSwitching;

  // Re-authorize through the auth provider so the refreshed X tokens land in
  // both the account table and the xConnections store.
  const handleConnect = async () => {
    setIsConnecting(true);
    await authClient.linkSocial({
      provider: "twitter",
      callbackURL: `${prefix}/dashboard/bookmarks`,
      errorCallbackURL: `${prefix}/dashboard/bookmarks?error=link-failed`,
    });
  };

  // This X identity already belongs to another WakeMark user. Sign out of
  // the current (email) session and complete a Twitter sign-in so better-auth
  // resumes that original account. X usually skips consent if already granted.
  const handleSignInAsLinkedX = async () => {
    setIsSwitching(true);
    await authClient.signOut();
    await authClient.signIn.social({
      provider: "twitter",
      callbackURL: `${prefix}/dashboard/bookmarks`,
      errorCallbackURL: `${prefix}/dashboard/bookmarks?error=link-failed`,
    });
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-none border border-border bg-card px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
        <Inbox className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{t("connect.title")}</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {t("connect.description")}
        </p>
      </div>
      {errorMessage ? (
        <p className="max-w-md text-sm text-destructive">{errorMessage}</p>
      ) : null}
      {alreadyLinked ? (
        <Button onClick={handleSignInAsLinkedX} disabled={busy}>
          {linkedXUsername
            ? t("connect.signInAsX", { username: linkedXUsername })
            : t("connect.signInAsXUnknown")}
        </Button>
      ) : null}
      <Button
        variant={alreadyLinked ? "outline" : "default"}
        onClick={handleConnect}
        disabled={busy}
      >
        {alreadyLinked ? t("connect.useDifferentX") : t("connect.button")}
      </Button>
      <p className="text-xs text-muted-foreground">{t("connect.note")}</p>
    </div>
  );
}
