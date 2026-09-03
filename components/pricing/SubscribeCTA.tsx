"use client";

import { usePlanCheckout } from "@/components/pricing/use-plan-checkout";
import { Button } from "@/components/ui/button";
import { pricingPlans as pricingPlansSchema } from "@/lib/db/schema";
import { Loader2 } from "lucide-react";

type PricingPlan = typeof pricingPlansSchema.$inferSelect;

interface SubscribeCTAProps {
  plan: PricingPlan;
  label: string;
}

/** Checkout CTA on the subscribe page: starts the trial checkout flow. */
export default function SubscribeCTA({ plan, label }: SubscribeCTAProps) {
  const { isLoading, handleCheckout } = usePlanCheckout(plan);

  return (
    <Button
      size="lg"
      disabled={isLoading}
      onClick={() => handleCheckout()}
      className="h-12 w-full rounded-none bg-foreground text-base font-semibold text-background hover:bg-foreground/90"
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {label}
    </Button>
  );
}
