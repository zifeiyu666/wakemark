import { getPublicPricingPlans } from "@/actions/prices/public";
import PricingLockInteractive from "@/components/home/PricingLockInteractive";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { pricingPlans as pricingPlansSchema } from "@/lib/db/schema";
import { PricingPlanLangJsonb } from "@/types/pricing";
import { getLocale, getTranslations } from "next-intl/server";

type TierStatus = "soldout" | "active" | "upnext";

type Tier = {
  id: string;
  name: string;
  price: string;
  period: string;
  discount: string;
  discountTone: "tint" | "outline";
  monthly: string;
  status: TierStatus;
  statusLabel: string;
  medal: boolean;
  remaining?: string;
  progress?: number;
  cta?: string;
  plan?: PricingPlan;
  /** Numeric price backing the display strings, sourced from pricing_plans */
  amount: number;
};

type ChartCopy = {
  title: string;
  axisLabel: string;
  lockedLabel: string;
  footnote: string;
};

type PricingPlan = typeof pricingPlansSchema.$inferSelect;

/* The pricing ladder (Founders → Standard) is managed under the "default" plan group */
const LADDER_GROUP_SLUG = "default";

const parseAmount = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const amount = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
};

const formatPrice = (amount: number) =>
  `$${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;

/**
 * Merge DB-stored price info onto the i18n tier scaffolding.
 * Status/period/cta/remaining copy stays in i18n (the ladder is annual by design);
 * name/price/discount/monthly come from pricing_plans.
 */
const buildTiers = (
  fallback: Omit<Tier, "amount">[],
  plans: PricingPlan[],
  locale: string,
  fullPriceLabel: string
): Tier[] => {
  const planAmounts = plans
    .map((plan) => parseAmount(plan.price))
    .filter((amount): amount is number => amount !== null);
  const fullPrice = Math.max(...planAmounts, 0);

  return fallback.map((tier, index) => {
    const plan = plans[index];
    const planAmount = plan ? parseAmount(plan.price) : null;
    const amount = planAmount ?? parseAmount(tier.price) ?? 0;
    if (!plan || planAmount === null) return { ...tier, amount };

    const localized =
      (plan.langJsonb as PricingPlanLangJsonb)?.[locale] ||
      (plan.langJsonb as PricingPlanLangJsonb)?.[DEFAULT_LOCALE];
    const original = parseAmount(localized?.originalPrice || plan.originalPrice);
    const base = original && original > amount ? original : fullPrice;
    const percent = base > 0 ? Math.round((1 - amount / base) * 100) : 0;

    return {
      ...tier,
      name: localized?.cardTitle || plan.cardTitle || tier.name,
      price: formatPrice(amount),
      discount: percent > 0 ? `-${percent}%` : fullPriceLabel,
      discountTone: percent > 0 ? "tint" : "outline",
      monthly: `${formatPrice(Number((amount / 12).toFixed(2)))}/mo`,
      amount,
    };
  });
};

export default async function PricingLock() {
  const t = await getTranslations("Landing.PricingLock");
  const locale = await getLocale();
  const chart = t.raw("chart") as ChartCopy;
  const included = t.raw("included") as string[];

  let ladderPlans: PricingPlan[] = [];
  const result = await getPublicPricingPlans();
  if (result.success) {
    ladderPlans = (result.data || []).filter(
      (plan) => plan.groupSlug === LADDER_GROUP_SLUG
    );
  } else {
    console.error("Failed to fetch pricing plans for PricingLock:", result.error);
  }

  const tiers = buildTiers(
    t.raw("tiers") as Omit<Tier, "amount">[],
    ladderPlans,
    locale,
    t("fullPriceLabel")
  );

  return (
    <section id="pricing" className="w-full">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-16 sm:px-6 md:gap-16 md:py-24 lg:px-8">
        <header className="text-center">
          <div className="max-w-4xl text-left">
            <p className="mb-7 inline-flex rounded-lg bg-[#eaf0ff] px-2 py-1 text-sm font-medium text-[#3467d6]">
              {t("eyebrow")}
            </p>
            <h2 className="text-2xl font-medium leading-[1.1] tracking-tight md:text-4xl">
              <span className="text-foreground">{t("title")}</span>{" "}
              <span className="text-muted-foreground">{t("note")}</span>
            </h2>
          </div>
          <p className="max-w-3xl text-left text-base text-muted-foreground md:text-lg">
            {t("description")}
          </p>
        </header>
        <PricingLockInteractive
          tiers={tiers.map((tier, index) => ({
            ...tier,
            plan: ladderPlans[index],
          }))}
          chart={chart}
          included={included}
          includedLabel={t("includedLabel")}
          trial={t("trial")}
        />
      </div>
    </section>
  );
}
