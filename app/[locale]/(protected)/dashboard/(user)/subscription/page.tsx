import { redirect } from "next/navigation";

export default function SubscriptionPage() {
  // Subscription management has been merged into the Settings page.
  redirect("/dashboard/settings");
}
