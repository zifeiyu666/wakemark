import { createCreemPortalSession } from "@/actions/creem/portal";
import { createStripePortalSession } from "@/actions/stripe";
import CurrentUserBenefitsDisplay from "@/components/layout/CurrentUserBenefitsDisplay";
import { Button } from "@/components/ui/button";
import { Link as I18nLink } from "@/i18n/routing";
import { PaymentProvider } from "@/lib/db/schema";
import { getTranslations } from "next-intl/server";
import { PortalButton } from "./PortalButton";

interface SubscriptionSectionProps {
  isMember: boolean;
  subscriptionProvider: PaymentProvider | null;
}

export default async function SubscriptionSection({
  isMember,
  subscriptionProvider,
}: SubscriptionSectionProps) {
  const t = await getTranslations("Settings");

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">
        {t("subscription.title")}
      </h2>
      <div className="rounded-lg border p-6 space-y-4">
        {isMember ? (
          <>
            <CurrentUserBenefitsDisplay />
            {subscriptionProvider === "stripe" && (
              <>
                <PortalButton
                  provider="stripe"
                  action={createStripePortalSession}
                />
                <p className="text-xs text-muted-foreground">
                  {t("subscription.stripePortalHint")}
                </p>
              </>
            )}
            {subscriptionProvider === "creem" && (
              <>
                <PortalButton
                  provider="creem"
                  action={createCreemPortalSession}
                />
                <p className="text-xs text-muted-foreground">
                  {t("subscription.creemPortalHint")}
                </p>
              </>
            )}
            {!subscriptionProvider && (
              <p className="text-sm text-muted-foreground">
                {t("subscription.portalUnavailable")}
              </p>
            )}
          </>
        ) : (
          <>
            <p>{t("subscription.notSubscribed")}</p>
            <Button asChild>
              <I18nLink
                href={process.env.NEXT_PUBLIC_PRICING_PATH!}
                title={t("subscription.upgradePlan")}
              >
                {t("subscription.upgradePlan")}
              </I18nLink>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
