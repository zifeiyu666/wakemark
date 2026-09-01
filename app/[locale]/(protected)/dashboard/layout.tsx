import { AuthGuard } from "@/components/auth/AuthGuard";
import AskAiWidget from "@/components/bookmarks/ask-ai/AskAiWidget";
import SidebarInsetHeader from "@/components/header/SidebarInsetHeader";
import { TimezoneReporter } from "@/components/tracking/TimezoneReporter";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { userPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import React from "react";
import { DashboardSidebar } from "./DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  let storedTimeZone: string | null = null;
  if (session?.user?.id) {
    const [pref] = await db
      .select({ timeZone: userPreferences.timeZone })
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1);
    storedTimeZone = pref?.timeZone ?? null;
  }

  return (
    <AuthGuard>
      <TimezoneReporter storedTimeZone={storedTimeZone} />
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset className="min-w-0">
          <SidebarInsetHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0 min-w-0">
            <div className="min-h-screen flex-1 rounded-xl md:min-h-min min-w-0">
              {children}
            </div>
          </div>
        </SidebarInset>
        <AskAiWidget />
      </SidebarProvider>
    </AuthGuard>
  );
}
