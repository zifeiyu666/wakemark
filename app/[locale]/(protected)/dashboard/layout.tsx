import { AuthGuard } from "@/components/auth/AuthGuard";
import AskAiWidget from "@/components/bookmarks/ask-ai/AskAiWidget";
import { ImportProgressProvider } from "@/components/bookmarks/ImportProgressProvider";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import EmailPromptDialog from "@/components/shared/EmailPromptDialog";
import SidebarInsetHeader from "@/components/header/SidebarInsetHeader";
import { TimezoneReporter } from "@/components/tracking/TimezoneReporter";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { userPreferences } from "@/lib/db/schema";
import { hasActiveSubscription } from "@/lib/payments/subscription";
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

  // Keep authentication and entitlement checks in this server layout so no
  // dashboard child can render before the decision is made.
  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "admin";
  const hasProductAccess = await hasActiveSubscription(session.user.id);

  // Administrators can open the dashboard to manage the service without a
  // customer plan. Regular users need an active or trialing subscription.
  // Product menus (bookmarks, lists, digests) follow hasProductAccess, not role.
  if (!isAdmin && !hasProductAccess) {
    redirect("/subscribe");
  }

  let storedTimeZone: string | null = null;
  let showOnboardingTour = false;
  if (session.user.id && hasProductAccess) {
    const [pref] = await db
      .select({
        timeZone: userPreferences.timeZone,
        onboardingCompletedAt: userPreferences.onboardingCompletedAt,
      })
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1);
    storedTimeZone = pref?.timeZone ?? null;
    // The welcome tour targets newly registered users only: accounts created
    // before the feature shipped keep their existing experience, and it never
    // re-opens once completed or dismissed. Admins skip it even after
    // subscribing, since they already know the ops dashboard.
    if (!isAdmin) {
      const isNewAccount =
        (session.user.createdAt?.getTime() ?? 0) >=
        ONBOARDING_TOUR_LAUNCH_AT.getTime();
      showOnboardingTour = isNewAccount && !pref?.onboardingCompletedAt;
    }
  }

  return (
    <AuthGuard>
      <TimezoneReporter storedTimeZone={storedTimeZone} />
      <SidebarProvider className="dashboard-sharp">
        <DashboardSidebar hasProductAccess={hasProductAccess} />
        <SidebarInset className="min-w-0">
          <SidebarInsetHeader />
          <div className="flex min-w-0 flex-1 flex-col gap-4 px-4 pt-0 pb-2">
            {/* Resumable first-import banner: shows while a history backfill
                checkpoint or an untagged backlog exists, and drives both. */}
            {hasProductAccess ? (
              <ImportProgressProvider>
                <div className="min-h-screen min-w-0 flex-1 md:min-h-min">
                  {children}
                </div>
              </ImportProgressProvider>
            ) : (
              <div className="min-h-screen min-w-0 flex-1 md:min-h-min">
                {children}
              </div>
            )}
          </div>
        </SidebarInset>
        {hasProductAccess && <AskAiWidget />}
        {hasProductAccess && showOnboardingTour && <OnboardingTour />}
        {hasProductAccess && <EmailPromptDialog email={session.user.email} />}
      </SidebarProvider>
    </AuthGuard>
  );
}
