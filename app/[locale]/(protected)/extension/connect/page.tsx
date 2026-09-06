import { ExtensionConnectClient } from "@/components/extension/ExtensionConnectClient";
import { getSession } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

type PageProps = {
  searchParams: Promise<{ state?: string }>;
};

export default async function ExtensionConnectPage({ searchParams }: PageProps) {
  const session = await getSession();
  const { state } = await searchParams;

  if (!session?.user) {
    const next = state
      ? `/extension/connect?state=${encodeURIComponent(state)}`
      : "/extension/connect";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
          Connecting…
        </div>
      }
    >
      <ExtensionConnectClient />
    </Suspense>
  );
}
