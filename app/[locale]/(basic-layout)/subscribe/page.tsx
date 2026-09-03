import { getPublicPricingPlans } from "@/actions/prices/public";
import SubscribeCTA from "@/components/pricing/SubscribeCTA";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { getSession } from "@/lib/auth/server";
import { pricingPlans as pricingPlansSchema } from "@/lib/db/schema";
import { constructMetadata } from "@/lib/metadata";
import { isYearlyInterval } from "@/lib/payments/provider-utils";
import { hasActiveSubscription } from "@/lib/payments/subscription";
import { PricingPlanLangJsonb } from "@/types/pricing";
import { Check, Medal, ShieldCheck } from "lucide-react";
import { Metadata } from "next";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

type PricingPlan = typeof pricingPlansSchema.$inferSelect;

/* The pricing ladder (Early Bird → Standard) lives under the "default" group */
const LADDER_GROUP_SLUG = "default";
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const parseAmount = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const amount = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
};

const formatPrice = (amount: number) =>
  `$${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pricing");
  return constructMetadata({
    title: t("Subscribe.title"),
    description: t("Subscribe.subtitle"),
    path: "/subscribe",
  });
}

export default async function SubscribePage() {
  // Already-subscribed users have nothing to do here.
  const session = await getSession();
  if (session?.user && (await hasActiveSubscription(session.user.id))) {
    redirect("/dashboard");
  }

  const t = await getTranslations("Pricing.Subscribe");
  const tLanding = await getTranslations("Landing.PricingLock");
  const locale = await getLocale();
  const formatter = await getFormatter({ locale });
  const included = [
    ...(tLanding.raw("included") as string[]),
    t("mcpSupport"),
  ];

  // The offered plan comes from pricing_plans (highlighted ladder plan first).
  let plan: PricingPlan | null = null;
  const result = await getPublicPricingPlans();
  if (result.success) {
    const ladder = (result.data || []).filter(
      (p) => p.groupSlug === LADDER_GROUP_SLUG
    );
    plan = ladder.find((p) => p.isHighlighted) ?? ladder[0] ?? null;
  }

  const localized = plan
    ? (plan.langJsonb as PricingPlanLangJsonb)?.[locale] ||
      (plan.langJsonb as PricingPlanLangJsonb)?.[DEFAULT_LOCALE]
    : undefined;
  const amount = plan ? parseAmount(plan.price) : null;
  const original = plan
    ? parseAmount(localized?.originalPrice || plan.originalPrice)
    : null;
  const percent =
    amount !== null && original !== null && original > amount
      ? Math.round((1 - amount / original) * 100)
      : null;

  const name = localized?.cardTitle || plan?.cardTitle || t("fallbackName");
  const price = amount !== null ? formatPrice(amount) : t("fallbackPrice");
  const discount =
    percent !== null && percent > 0 ? `-${percent}%` : t("fallbackDiscount");
  const monthlyAmount =
    amount !== null
      ? formatPrice(Number((amount / 12).toFixed(2)))
      : t("fallbackMonthlyAmount");
  const period = isYearlyInterval(plan?.recurringInterval ?? null)
    ? t("periodYear")
    : t("periodMonth");
  const progress = Number(t.raw("progress")) || 0;

  // First charge lands when the trial ends (today + trial period).
  const trialDays = plan?.trialPeriodDays ?? 7;
  const firstChargeLabel = formatter.dateTime(
    new Date(Date.now() + trialDays * DAY_IN_MS),
    { month: "long", day: "numeric" }
  );

  return (
    <div className="w-full flex-1 bg-muted">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-16 md:gap-10 md:py-20">
        <header className="text-center">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground md:text-lg">
            {t("subtitle")}
          </p>
        </header>

        <section className="flex flex-col gap-5 bg-foreground p-6 text-background shadow-md md:p-8">
          <p className="flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-widest text-background/70">
            <Medal className="size-3.5" />
            {name}
            <Badge className="rounded-sm border-transparent bg-highlight-inverse/20 text-highlight-inverse">
              {discount}
            </Badge>
          </p>
          <div className="text-center">
            <p className="font-serif text-5xl font-bold tracking-tight">
              {price}
              <span className="ml-1 font-sans text-base font-normal text-background/60">
                {period}
              </span>
            </p>
            <p className="mt-2 text-sm text-background/60">
              {t("monthlyNote", { amount: monthlyAmount })}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-1 overflow-hidden rounded-full bg-background/20">
              <div
                className="h-full rounded-full bg-highlight-inverse"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-sm font-medium text-highlight-inverse">
              {t("spotsRemaining")}
            </p>
          </div>
        </section>

        <ul className="flex flex-col gap-3">
          {included.map((item) => (
            <li
              key={item}
              className="flex items-center gap-3 text-sm text-muted-foreground md:text-base"
            >
              <Check className="size-4 shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-5">
          {plan ? <SubscribeCTA plan={plan} label={t("cta")} /> : null}
          <p className="flex items-start justify-center gap-2 text-center text-sm text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0" />
            <span>{t("noCharge", { date: firstChargeLabel })}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
