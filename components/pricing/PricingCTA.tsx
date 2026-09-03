"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/routing";
import { pricingPlans as pricingPlansSchema } from "@/lib/db/schema";
import { Loader2, MousePointerClick } from "lucide-react";
import Link from "next/link";
import { PayPalCheckoutButton } from "./PayPalCheckoutButton";
import { usePlanCheckout } from "./use-plan-checkout";

type PricingPlan = typeof pricingPlansSchema.$inferSelect;

type Params = {
  plan: PricingPlan;
  localizedPlan: any;
};

export default function PricingCTA({ plan, localizedPlan }: Params) {
  const { isLoading, handleCheckout } = usePlanCheckout(plan);
  const router = useRouter();

  const provider = plan.provider;
  const isCreem = provider === "creem";
  const isStripe = provider === "stripe";
  const isPayPal = provider === "paypal";

  let defaultCouponCode = null;
  if (isCreem) {
    defaultCouponCode = plan.creemDiscountCode;
  } else if (isStripe) {
    defaultCouponCode = plan.stripeCouponId;
  }

  const allowManualCoupon =
    Boolean(defaultCouponCode) && plan.enableManualInputCoupon;

  // For PayPal one-time payments, render the PayPal buttons (no page redirect)
  if (isPayPal && plan.paymentType === "one_time") {
    return (
      <div className="mb-6">
        <PayPalCheckoutButton
          plan={plan}
          onSuccess={(data) => {
            const params = new URLSearchParams();
            params.set("provider", "paypal");
            params.set("order_id", data.orderId);
            if (data.pending) {
              params.set("pending", "true");
            }
            router.push(`/payment/success?${params.toString()}`);
          }}
        />
      </div>
    );
  }

  // Disable the purchase button for PayPal plans that are not fully configured
  if (isPayPal && !plan.paymentType) {
    return (
      <Button disabled className="w-full py-5 mb-6">
        Not Available
      </Button>
    );
  }

  return (
    <div>
      <Button
        asChild={!!plan.buttonLink}
        disabled={isLoading}
        className={`w-full flex items-center justify-center gap-2 py-5 font-medium ${
          plan.isHighlighted
            ? ""
            : "bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
        } ${allowManualCoupon ? "mb-2" : "mb-6"}`}
        {...(!plan.buttonLink && {
          onClick: () => handleCheckout(),
        })}
      >
        {plan.buttonLink ? (
          <Link
            href={plan.buttonLink}
            title={localizedPlan.buttonText || plan.buttonText}
            rel="noopener noreferrer nofollow"
            target="_blank"
            prefetch={false}
          >
            {localizedPlan.buttonText || plan.buttonText}
            {plan.isHighlighted && <MousePointerClick className="w-5 h-5" />}
          </Link>
        ) : (
          <>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              localizedPlan.buttonText || plan.buttonText
            )}
            {plan.isHighlighted && !isLoading && (
              <MousePointerClick className="w-5 h-5 ml-2" />
            )}
          </>
        )}
      </Button>
      {allowManualCoupon && (
        <div className="text-center mb-2">
          <button
            onClick={() => handleCheckout(false)}
            disabled={isLoading}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 underline underline-offset-2"
          >
            I have a different coupon code
          </button>
        </div>
      )}
    </div>
  );
}
