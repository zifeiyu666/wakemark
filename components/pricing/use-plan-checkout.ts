"use client";

import { DEFAULT_LOCALE, useRouter } from "@/i18n/routing";
import { pricingPlans as pricingPlansSchema } from "@/lib/db/schema";
import { useLocale } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

type PricingPlan = typeof pricingPlansSchema.$inferSelect;

/**
 * Shared checkout flow for pricing CTAs: creates a checkout session for the
 * plan's provider (Stripe/Creem/PayPal) and redirects to the payment URL.
 * Unauthenticated users are sent to /login.
 */
export function usePlanCheckout(plan: PricingPlan) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const locale = useLocale();

  const provider = plan.provider;
  const isCreem = provider === "creem";
  const isStripe = provider === "stripe";
  const isPayPal = provider === "paypal";

  const handleCheckout = async (applyCoupon = true) => {
    const stripePriceId = plan.stripePriceId ?? null;
    if (isStripe && !stripePriceId) {
      toast.error("Stripe price ID is missing for this plan.");
      return;
    }

    const creemProductId = plan.creemProductId ?? null;
    if (isCreem && !creemProductId) {
      toast.error("Creem product ID is missing for this plan.");
      return;
    }

    // PayPal one-time payments are handled by the PayPalCheckoutButton component
    if (isPayPal && plan.paymentType === "one_time") {
      toast.error("PayPal one-time payments should use PayPalCheckoutButton.");
      return;
    }
    if (isPayPal && plan.paymentType === "recurring" && !plan.paypalPlanId) {
      toast.error("PayPal Plan ID is missing for this subscription plan.");
      return;
    }
    if (isPayPal && !plan.paymentType) {
      toast.error("This plan is not configured for PayPal payments.");
      return;
    }

    setIsLoading(true);
    try {
      let requestBody: {
        provider: string;
        couponCode?: string;
        // Stripe
        stripePriceId?: string;
        referral?: string;

        // Creem
        creemProductId?: string;

        // PayPal
        planId?: string;
      } = {
        provider: provider || "stripe",
      };

      if (isStripe) {
        requestBody.stripePriceId = stripePriceId!;
        requestBody.couponCode =
          applyCoupon && plan.stripeCouponId ? plan.stripeCouponId : undefined;

        const toltReferral = (window as any).tolt_referral;
        requestBody.referral = toltReferral ?? undefined;
      }
      if (isCreem) {
        requestBody.creemProductId = creemProductId!;
        requestBody.couponCode =
          applyCoupon && plan.creemDiscountCode
            ? plan.creemDiscountCode
            : undefined;
      }
      // PayPal subscriptions use planId (redirect flow)
      if (isPayPal) {
        requestBody.planId = plan.id;
      }

      const response = await fetch("/api/payment/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": (locale || DEFAULT_LOCALE) as string,
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          toast.error("You must be logged in to purchase a plan.");
          return;
        }
        throw new Error(
          result.error || "HTTP error! status: " + response.status
        );
      }

      if (!result.success) {
        throw new Error(result.error || "Failed to create checkout session.");
      }

      const data = result.data;

      if (data.url) {
        router.push(data.url);
        setIsLoading(false);
      } else {
        throw new Error("Checkout URL not received.");
      }
    } catch (error) {
      console.error("Checkout Error:", error);
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred."
      );
      setIsLoading(false);
    }
  };

  return { isLoading, handleCheckout };
}
