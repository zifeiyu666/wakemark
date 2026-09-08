import { createCreemPortalSession } from "@/actions/creem/portal";
import { createStripePortalSession } from "@/actions/stripe";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link as I18nLink } from "@/i18n/routing";
import { PaymentProvider } from "@/lib/db/schema";
import {
  isMonthlyInterval,
  isYearlyInterval,
} from "@/lib/payments/provider-utils";
import { PricingPlanLangJsonb } from "@/types/pricing";
import { CreditCard } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { PortalButton } from "./PortalButton";
import SettingsCard from "./SettingsCard";

export interface SubscriptionDisplay {
  provider: PaymentProvider;
  status: string;
  trialEnd: Date | null;
  currentPeriodEnd: Date | null;
}

export interface SubscriptionPlanDisplay {
  cardTitle: string;
  langJsonb: PricingPlanLangJsonb;
  price: string | null;
  displayPrice: string | null;
  recurringInterval: string | null;
}

interface SubscriptionSectionProps {
  isMember: boolean;
  subscription: SubscriptionDisplay | null;
  plan: SubscriptionPlanDisplay | null;
  complimentaryTrialEnd: Date | null;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

export default async function SubscriptionSection({
  isMember,
  subscription,
  plan,
  complimentaryTrialEnd,
}: SubscriptionSectionProps) {
  const t = await getTranslations("Settings");
  const locale = await getLocale();
  const formatter = await getFormatter({ locale });

  if (!isMember || !subscription) {
    const trialActive =
      !!complimentaryTrialEnd &&
      new Date(complimentaryTrialEnd).getTime() > Date.now();
    const trialLabel = complimentaryTrialEnd
      ? formatter.dateTime(new Date(complimentaryTrialEnd), {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : null;

    return (
      <div className="max-w-2xl mx-auto">
        <SettingsCard
          title={t("subscription.title")}
          description={t("subscription.description")}
          footerHint={t("subscription.footerHint")}
          action={
            <Button asChild>
              <I18nLink
                href="/subscribe"
                title={t("subscription.upgradePlan")}
              >
                {t("subscription.upgradePlan")}
              </I18nLink>
            </Button>
          }
        >
          <p>
            {trialActive && trialLabel
              ? t("subscription.complimentaryTrial", { date: trialLabel })
              : complimentaryTrialEnd
                ? t("subscription.trialEnded")
                : t("subscription.notSubscribed")}
          </p>
        </SettingsCard>
      </div>
    );
  }

  const isTrialing = subscription.status === "trialing";

  const planName =
    plan?.langJsonb?.[locale]?.cardTitle ?? plan?.cardTitle ?? null;

  const priceSuffix = isYearlyInterval(plan?.recurringInterval)
    ? t("subscription.perYear")
    : isMonthlyInterval(plan?.recurringInterval)
      ? t("subscription.perMonth")
      : null;

  const monthlyEquivalent =
    isYearlyInterval(plan?.recurringInterval) && plan?.price
      ? t("subscription.monthlyEquivalent", {
          amount: `$${(Number(plan.price) / 12).toFixed(2)}`,
        })
      : null;

  const trialDaysRemaining =
    isTrialing && subscription.trialEnd
      ? Math.max(
          0,
          Math.ceil(
            (new Date(subscription.trialEnd).getTime() - Date.now()) /
              DAY_IN_MS
          )
        )
      : null;

  const endDate = isTrialing
    ? subscription.trialEnd
    : subscription.currentPeriodEnd;

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="gap-0 overflow-hidden py-0 shadow-none">
        <CardHeader className="pt-6">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="size-5" />
            {t("subscription.title")}
          </CardTitle>
          <CardDescription>{t("subscription.description")}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 pb-6">
          <div className="divide-y divide-border">
            <Row label={t("subscription.planLabel")}>
              <span className="flex items-center justify-end gap-2 font-medium">
                {planName}
                {isTrialing ? (
                  <span className="rounded-md bg-muted px-2 py-0.5 font-normal">
                    {t("subscription.trialBadge")}
                  </span>
                ) : null}
              </span>
            </Row>
            {plan ? (
              <Row label={t("subscription.priceLabel")}>
                <span className="font-medium">
                  {plan.displayPrice}
                  {priceSuffix}
                </span>
                {monthlyEquivalent ? (
                  <span className="ml-1 text-muted-foreground">
                    {monthlyEquivalent}
                  </span>
                ) : null}
              </Row>
            ) : null}
            {trialDaysRemaining !== null ? (
              <Row label={t("subscription.trialLabel")}>
                <span className="font-medium text-amber-600">
                  {t("subscription.trialDaysRemaining", {
                    days: trialDaysRemaining,
                  })}
                </span>
              </Row>
            ) : null}
            {endDate ? (
              <Row
                label={
                  isTrialing
                    ? t("subscription.endsOnLabel")
                    : t("subscription.renewsOnLabel")
                }
              >
                <span className="font-medium">
                  {formatter.dateTime(new Date(endDate), { dateStyle: "long" })}
                </span>
              </Row>
            ) : null}
          </div>
          <div className="mt-6">
            <PortalButton
              action={
                subscription.provider === "stripe"
                  ? createStripePortalSession
                  : createCreemPortalSession
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
