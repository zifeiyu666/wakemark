import { createCreemPortalSession } from "@/actions/creem/portal";
import { createStripePortalSession } from "@/actions/stripe";
import CurrentUserBenefitsDisplay from "@/components/layout/CurrentUserBenefitsDisplay";
import { Button } from "@/components/ui/button";
import { Link as I18nLink } from "@/i18n/routing";
import { PaymentProvider } from "@/lib/db/schema";
import { getTranslations } from "next-intl/server";
import { PortalButton } from "./PortalButton";
import SettingsCard from "./SettingsCard";

interface SubscriptionSectionProps {
  isMember: boolean;
  subscriptionProvider: PaymentProvider | null;
}

export default async function SubscriptionSection({
  isMember,
  subscriptionProvider,
}: SubscriptionSectionProps) {
  const t = await getTranslations("Settings");

  const footerHint = !isMember
    ? t("subscription.footerHint")
    : subscriptionProvider === "stripe"
      ? t("subscription.stripePortalHint")
      : subscriptionProvider === "creem"
        ? t("subscription.creemPortalHint")
        : t("subscription.portalUnavailable");

  const footerAction = !isMember ? (
    <Button asChild>
      <I18nLink
        href={process.env.NEXT_PUBLIC_PRICING_PATH!}
        title={t("subscription.upgradePlan")}
      >
        {t("subscription.upgradePlan")}
      </I18nLink>
    </Button>
  ) : subscriptionProvider ? (
    <PortalButton
      provider={subscriptionProvider}
      action={
        subscriptionProvider === "stripe"
          ? createStripePortalSession
          : createCreemPortalSession
      }
    />
  ) : null;

  return (
    <div className="max-w-2xl mx-auto">
      <SettingsCard
        title={t("subscription.title")}
        description={t("subscription.description")}
        footerHint={footerHint}
        action={footerAction}
      >
        {isMember ? (
          <CurrentUserBenefitsDisplay />
        ) : (
          <p>{t("subscription.notSubscribed")}</p>
        )}
      </SettingsCard>
    </div>
  );
}
