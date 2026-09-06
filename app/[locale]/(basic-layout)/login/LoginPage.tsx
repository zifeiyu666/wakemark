"use client";

import LoginForm from "@/components/auth/LoginForm";
import { useRouter } from "@/i18n/routing";
import { authClient } from "@/lib/auth/auth-client";
import { sanitizeNextPath } from "@/lib/extension/safe-next";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = authClient.useSession();
  const t = useTranslations("Login");
  const next = sanitizeNextPath(searchParams.get("next"));

  useEffect(() => {
    if (!session?.user) return;
    // Preserve query string (e.g. extension connect state) via full navigation.
    if (next) {
      window.location.assign(next);
      return;
    }
    router.replace("/dashboard/bookmarks");
  }, [session?.user, next, router]);

  if (isPending || session?.user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center flex-1 py-12 px-4">
      <div className="flex w-full max-w-xl flex-col items-center space-y-8 text-center">
        <div className="flex flex-col space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-base text-muted-foreground">{t("description")}</p>
        </div>

        <Suspense fallback={<Loader2 className="w-4 h-4 animate-spin" />}>
          <LoginForm className="w-full max-w-md" />
        </Suspense>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
