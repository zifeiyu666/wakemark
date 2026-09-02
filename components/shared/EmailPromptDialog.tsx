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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/auth-client";
import { isSyntheticEmail, normalizeEmail, validateEmail } from "@/lib/email";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Shown to users who signed in with X without sharing an email (placeholder
 * address on file). Dismissible, but reappears on every dashboard visit until
 * a real email is saved.
 */
export default function EmailPromptDialog({
  email,
}: {
  email?: string | null;
}) {
  const t = useTranslations("EmailPrompt");
  const [open, setOpen] = useState(true);
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!(!email || isSyntheticEmail(email))) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeEmail(value);
    if (!validateEmail(normalized).isValid) {
      toast.error(t("toast.errorTitle"), {
        description: t("toast.invalidEmailDescription"),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await authClient.changeEmail({
        newEmail: normalized,
      });
      if (error) {
        toast.error(t("toast.errorTitle"), {
          description: error.message || t("toast.takenDescription"),
        });
        return;
      }
      toast.success(t("toast.successTitle"), {
        description: t("toast.successDescription"),
      });
      setOpen(false);
      await authClient.getSession({ query: { disableCookieCache: true } });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-prompt-input">{t("label")}</Label>
            <Input
              id="email-prompt-input"
              type="email"
              placeholder={t("placeholder")}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">{t("hint")}</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              {t("skipButton")}
            </Button>
            <Button type="submit" disabled={!value || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {t("submittingButton")}
                </>
              ) : (
                t("submitButton")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
