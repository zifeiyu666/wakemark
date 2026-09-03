"use client";

import { usePlanCheckout } from "@/components/pricing/use-plan-checkout";
import { Button } from "@/components/ui/button";
import { pricingPlans as pricingPlansSchema } from "@/lib/db/schema";
import { Loader2 } from "lucide-react";

type PricingPlan = typeof pricingPlansSchema.$inferSelect;

interface PricingLockCTAProps {
  plan: PricingPlan;
  label: string;
}

/** Checkout CTA for the active tier card in the landing pricing ladder */
export default function PricingLockCTA({ plan, label }: PricingLockCTAProps) {
  const { isLoading, handleCheckout } = usePlanCheckout(plan);

  return (
    <Button
      size="lg"
      disabled={isLoading}
      onClick={() => handleCheckout()}
      className="h-12 w-full bg-neutral-900 text-white hover:bg-neutral-800"
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {label}
    </Button>
  );
}
