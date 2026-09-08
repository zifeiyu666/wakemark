import { getUserBenefits } from "@/actions/usage/benefits";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import {
  pricingPlans as pricingPlansSchema,
  subscriptions as subscriptionsSchema,
  user as userSchema,
} from "@/lib/db/schema";
import { constructMetadata } from "@/lib/metadata";
import { getComplimentaryTrialEnd } from "@/lib/payments/trial";
import { PricingPlanLangJsonb } from "@/types/pricing";
import { desc, eq } from "drizzle-orm";
import { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Settings from "./Setting";
import SubscriptionSection, {
  SubscriptionPlanDisplay,
} from "./SubscriptionSection";

type User = typeof userSchema.$inferSelect;

type Params = Promise<{ locale: string }>;

type MetadataProps = {
  params: Params;
};

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "Settings",
  });

  return constructMetadata({
    page: "Settings",
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/dashboard/settings`,
  });
}

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const user = session.user as User;

  const [benefits, subscriptionResults, complimentaryTrialEnd] = await Promise.all([
    getUserBenefits(user.id),
    db
      .select({
        provider: subscriptionsSchema.provider,
        status: subscriptionsSchema.status,
        trialEnd: subscriptionsSchema.trialEnd,
        currentPeriodEnd: subscriptionsSchema.currentPeriodEnd,
        planId: subscriptionsSchema.planId,
      })
      .from(subscriptionsSchema)
      .where(eq(subscriptionsSchema.userId, user.id))
      .orderBy(desc(subscriptionsSchema.createdAt))
      .limit(1),
    getComplimentaryTrialEnd(user.id),
  ]);

  const subscription = subscriptionResults[0] ?? null;
  const isMember =
    benefits.subscriptionStatus === "active" ||
    benefits.subscriptionStatus === "trialing";

  let plan: SubscriptionPlanDisplay | null = null;
  if (subscription?.planId) {
    const planResults = await db
      .select({
        cardTitle: pricingPlansSchema.cardTitle,
        langJsonb: pricingPlansSchema.langJsonb,
        price: pricingPlansSchema.price,
        displayPrice: pricingPlansSchema.displayPrice,
        recurringInterval: pricingPlansSchema.recurringInterval,
      })
      .from(pricingPlansSchema)
      .where(eq(pricingPlansSchema.id, subscription.planId))
      .limit(1);
    const planRow = planResults[0];
    plan = planRow
      ? {
          ...planRow,
          recurringInterval: planRow.recurringInterval ?? null,
          langJsonb: (planRow.langJsonb ?? {}) as PricingPlanLangJsonb,
        }
      : null;
  }

  return (
    <div className="space-y-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight">
          {(await getTranslations("Settings"))("title")}
        </h1>
      </div>
      <SubscriptionSection
        isMember={isMember}
        subscription={subscription}
        plan={plan}
        complimentaryTrialEnd={complimentaryTrialEnd}
      />
      <Settings user={user} />
    </div>
  );
}
