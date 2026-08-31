import { redirect } from "next/navigation";

export default function DashboardPage() {
  // The default dashboard landing is the bookmarks board.
  redirect("/dashboard/bookmarks");
}
