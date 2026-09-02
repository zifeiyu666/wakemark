"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useId, type FormEvent, type ReactNode } from "react";

interface SettingsCardProps {
  title: string;
  description?: string;
  /** Left-side helper text rendered in the muted footer bar. */
  footerHint?: string;
  /** When provided (with onSubmit), the card body is wrapped in a form and a
   *  primary save button is rendered on the right side of the footer. */
  submitLabel?: string;
  submitting?: boolean;
  submitDisabled?: boolean;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  /** Custom footer action (e.g. portal / upgrade button) replacing the save button. */
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/**
 * Vercel-style settings card: title & description live inside the card,
 * and a muted footer bar carries a helper hint on the left and the
 * primary action on the right.
 */
export default function SettingsCard({
  title,
  description,
  footerHint,
  submitLabel,
  submitting = false,
  submitDisabled = false,
  onSubmit,
  action,
  className,
  children,
}: SettingsCardProps) {
  const formId = useId();

  return (
    <Card className={cn("gap-0 overflow-hidden py-0", className)}>
      <CardHeader className="pt-6">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="pt-4 pb-6">
        {onSubmit ? (
          <form id={formId} onSubmit={onSubmit} className="space-y-4">
            {children}
          </form>
        ) : (
          children
        )}
      </CardContent>
      <CardFooter className="justify-between gap-4 border-t bg-muted/50 py-4 [.border-t]:pt-4">
        <p className="text-sm text-muted-foreground">{footerHint}</p>
        {action ??
          (onSubmit && (
            <Button
              type="submit"
              form={formId}
              disabled={submitDisabled || submitting}
            >
              {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
              {submitLabel}
            </Button>
          ))}
      </CardFooter>
    </Card>
  );
}
