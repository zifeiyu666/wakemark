import { getSession } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();

  // Admins start in the management area; regular users start with bookmarks.
  redirect(
    session?.user?.role === "admin" ? "/dashboard/overview" : "/dashboard/bookmarks"
  );
}
