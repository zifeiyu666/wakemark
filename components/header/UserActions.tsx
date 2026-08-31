"use client";

import LoginButton from "@/components/header/LoginButton";
import { Button } from "@/components/ui/button";
import { Link as I18nLink } from "@/i18n/routing";
import { user as userSchema } from "@/lib/db/schema";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

type User = typeof userSchema.$inferSelect;

export function UserActions({ user }: { user: User }) {
  const t = useTranslations("Login");

  if (!user) {
    return <LoginButton />;
  }

  return (
    <Button asChild size="sm">
      <I18nLink href="/dashboard/bookmarks" prefetch={false}>
        {t("Button.dashboard")}
        <ArrowRight />
      </I18nLink>
    </Button>
  );
}
