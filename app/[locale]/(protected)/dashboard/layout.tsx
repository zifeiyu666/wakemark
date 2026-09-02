import { AuthGuard } from "@/components/auth/AuthGuard";
import AskAiWidget from "@/components/bookmarks/ask-ai/AskAiWidget";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import EmailPromptDialog from "@/components/shared/EmailPromptDialog";
import SidebarInsetHeader from "@/components/header/SidebarInsetHeader";
import { TimezoneReporter } from "@/components/tracking/TimezoneReporter";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { userPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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
  let storedTimeZone: string | null = null;
  let showOnboardingTour = false;
  if (session?.user?.id) {
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
    // re-opens once completed or dismissed.
    const isNewAccount =
      (session.user.createdAt?.getTime() ?? 0) >=
      ONBOARDING_TOUR_LAUNCH_AT.getTime();
    showOnboardingTour = isNewAccount && !pref?.onboardingCompletedAt;
  }

  return (
    <AuthGuard>
      <TimezoneReporter storedTimeZone={storedTimeZone} />
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset className="min-w-0">
          <SidebarInsetHeader />
          <div className="flex flex-1 flex-col gap-4 px-4 pt-0 pb-2 min-w-0">
            <div className="min-h-screen flex-1 rounded-xl md:min-h-min min-w-0">
              {children}
            </div>
          </div>
        </SidebarInset>
        <AskAiWidget />
        {showOnboardingTour && <OnboardingTour />}
        <EmailPromptDialog email={session?.user.email} />
      </SidebarProvider>
    </AuthGuard>
  );
}
