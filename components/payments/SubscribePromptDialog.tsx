"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link as I18nLink } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export function SubscribePromptDialog({
  open,
  onOpenChange,
  variant = "expired",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: "expired" | "trialManual" | "notionExport";
}) {
  const t = useTranslations("Bookmarks.subscribePrompt");

  const title =
    variant === "notionExport" ? t("titleNotionExport") : t("title");
  const description =
    variant === "notionExport"
      ? t("descriptionNotionExport")
      : variant === "trialManual"
        ? t("descriptionTrialManual")
        : t("descriptionExpired");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button asChild className="rounded-none">
            <I18nLink href="/subscribe" title={t("cta")}>
              {t("cta")}
            </I18nLink>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
