import { getUserBenefits } from "@/actions/usage/benefits";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import {
  subscriptions as subscriptionsSchema,
  user as userSchema,
} from "@/lib/db/schema";
import { constructMetadata } from "@/lib/metadata";
import { desc, eq } from "drizzle-orm";
import { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Settings from "./Setting";
import SubscriptionSection from "./SubscriptionSection";

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

  const [benefits, subscriptionResults] = await Promise.all([
    getUserBenefits(user.id),
    db
      .select({ provider: subscriptionsSchema.provider })
      .from(subscriptionsSchema)
      .where(eq(subscriptionsSchema.userId, user.id))
      .orderBy(desc(subscriptionsSchema.createdAt))
      .limit(1),
  ]);

  const subscriptionProvider = subscriptionResults[0]?.provider || null;
  const isMember =
    benefits.subscriptionStatus === "active" ||
    benefits.subscriptionStatus === "trialing";

  return (
    <div className="space-y-10">
      <Settings user={user} />
      <SubscriptionSection
        isMember={isMember}
        subscriptionProvider={subscriptionProvider}
      />
    </div>
  );
}
