"use client";

import { submitFeedback } from "@/actions/feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FEEDBACK_MESSAGE_MAX_LENGTH,
  FEEDBACK_TITLE_MAX_LENGTH,
  FeedbackCategory,
} from "@/lib/validations";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

const CATEGORIES: FeedbackCategory[] = ["bug", "feature", "question"];

export function FeedbackForm() {
  const t = useTranslations("Feedback");

  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    title.trim().length > 0 && message.trim().length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const result = await submitFeedback({
        category,
        title: title.trim(),
        message: message.trim(),
      });

      if (result.success) {
        toast.success(t("toast.successTitle"), {
          description: t("toast.successDescription"),
        });
        setCategory("bug");
        setTitle("");
        setMessage("");
      } else {
        toast.error(t("toast.errorTitle"), {
          description: result.error || t("toast.errorDescription"),
        });
      }
    } catch (error) {
      toast.error(t("toast.errorTitle"), {
        description: t("toast.errorDescription"),
      });
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-4">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </header>

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="feedback-category">{t("category")}</Label>
          <Select
            value={category}
            onValueChange={(value) => setCategory(value as FeedbackCategory)}
          >
            <SelectTrigger id="feedback-category" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((item) => (
                <SelectItem key={item} value={item}>
                  {t(`categories.${item}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="feedback-title">{t("fieldTitle")}</Label>
          <Input
            id="feedback-title"
            placeholder={t("titlePlaceholder")}
            maxLength={FEEDBACK_TITLE_MAX_LENGTH}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="feedback-message">{t("message")}</Label>
          <Textarea
            id="feedback-message"
            placeholder={t("messagePlaceholder")}
            maxLength={FEEDBACK_MESSAGE_MAX_LENGTH}
            rows={5}
            className="resize-y"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSubmitting}
          />
          <p className="text-sm text-muted-foreground text-right">
            {t("charCount", {
              count: message.length,
              max: FEEDBACK_MESSAGE_MAX_LENGTH,
            })}
          </p>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={!canSubmit}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </div>
      </form>
    </div>
  );
}
