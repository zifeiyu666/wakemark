import { AuthGuard } from "@/components/auth/AuthGuard";
import AskAiWidget from "@/components/bookmarks/ask-ai/AskAiWidget";
import { ImportProgressProvider } from "@/components/bookmarks/ImportProgressProvider";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { ProductAccessProvider } from "@/components/payments/ProductAccessProvider";
import EmailPromptDialog from "@/components/shared/EmailPromptDialog";
import SidebarInsetHeader from "@/components/header/SidebarInsetHeader";
import { TimezoneReporter } from "@/components/tracking/TimezoneReporter";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { userPreferences, xConnections } from "@/lib/db/schema";
import { hasActiveSubscription, hasBookmarkServiceAccess } from "@/lib/payments/subscription";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import React from "react";
import { DashboardSidebar } from "./DashboardSidebar";

// Accounts registered before the welcome tour shipped keep their existing
// experience; the tour only auto-opens for users created on/after this date.
const ONBOARDING_TOUR_LAUNCH_AT = new Date("2026-09-01T00:00:00Z");

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Keep authentication in this server layout so no dashboard child can
  // render before the decision is made. Expired trials still reach the
  // dashboard to view already-synced bookmarks; sync/email stay gated.
  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "admin";
  const hasPaidSubscription = await hasActiveSubscription(session.user.id);
  const hasServiceAccess = await hasBookmarkServiceAccess(session.user.id);

  let storedTimeZone: string | null = null;
  let showOnboardingTour = false;
  if (session.user.id) {
    const [[pref], [xConnection]] = await Promise.all([
      db
        .select({
          timeZone: userPreferences.timeZone,
          onboardingCompletedAt: userPreferences.onboardingCompletedAt,
        })
        .from(userPreferences)
        .where(eq(userPreferences.userId, session.user.id))
        .limit(1),
      db
        .select({ userId: xConnections.userId })
        .from(xConnections)
        .where(eq(xConnections.userId, session.user.id))
        .limit(1),
    ]);
    storedTimeZone = pref?.timeZone ?? null;
    // The welcome tour targets newly registered users only: accounts created
    // before the feature shipped keep their existing experience, and it never
    // re-opens once completed or dismissed. Admins skip it even after
    // subscribing, since they already know the ops dashboard.
    // Wait until X is linked: email/password signups must connect first,
    // otherwise step 1 claims bookmarks are already syncing.
    if (!isAdmin && hasServiceAccess && xConnection) {
      const isNewAccount =
        (session.user.createdAt?.getTime() ?? 0) >=
        ONBOARDING_TOUR_LAUNCH_AT.getTime();
      showOnboardingTour = isNewAccount && !pref?.onboardingCompletedAt;
    }
  }

  return (
    <AuthGuard>
      <ProductAccessProvider
        hasServiceAccess={hasServiceAccess}
        hasPaidSubscription={hasPaidSubscription}
      >
        <TimezoneReporter storedTimeZone={storedTimeZone} />
        <SidebarProvider className="dashboard-sharp">
          <DashboardSidebar hasProductAccess={hasServiceAccess} />
          <SidebarInset className="min-w-0">
            <SidebarInsetHeader />
            <div className="flex min-w-0 flex-1 flex-col gap-4 px-4 pt-0 pb-2">
              {/* Resumable first-import banner: shows while a history backfill
                  checkpoint or an untagged backlog exists, and drives both. */}
              <ImportProgressProvider enabled={hasServiceAccess}>
                <div className="min-h-screen min-w-0 flex-1 md:min-h-min">
                  {children}
                </div>
              </ImportProgressProvider>
            </div>
          </SidebarInset>
          {hasServiceAccess && <AskAiWidget />}
          {hasServiceAccess && showOnboardingTour && <OnboardingTour />}
          {hasServiceAccess && <EmailPromptDialog email={session.user.email} />}
        </SidebarProvider>
      </ProductAccessProvider>
    </AuthGuard>
  );
}
