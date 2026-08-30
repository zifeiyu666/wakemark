"use client";

import { Button } from "@/components/ui/button";
import { PaymentProvider } from "@/lib/db/schema";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormStatus } from "react-dom";

interface PortalButtonProps {
  provider: PaymentProvider;
}

function SubmitButton({ provider }: PortalButtonProps) {
  const { pending } = useFormStatus();
  const t = useTranslations("Settings");

  const buttonText =
    provider === "stripe"
      ? t("subscription.manageStripeButton")
      : t("subscription.manageCreemButton");

  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          {t("subscription.loadingButton")}
        </>
      ) : (
        buttonText
      )}
    </Button>
  );
}

export function PortalButton({
  provider,
  action,
}: PortalButtonProps & {
  action: () => Promise<void>;
}) {
  return (
    <form action={action}>
      <SubmitButton provider={provider} />
    </form>
  );
}
