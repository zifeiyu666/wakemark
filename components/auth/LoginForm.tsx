"use client";

import { TwitterX } from "@/components/social-icons/icons";
import { Button } from "@/components/ui/button";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { authClient } from "@/lib/auth/auth-client";
import { initializeTracking } from "@/lib/tracking/client";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface LoginFormProps {
  className?: string;
}

// X is the only sign-in method: the product needs X API access anyway, so a
// single OAuth authorization covers both login and bookmark sync.
export default function LoginForm({ className = "" }: LoginFormProps) {
  const t = useTranslations("Login");
  const locale = useLocale();

  const [isLoading, setIsLoading] = useState(false);

  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  // Initialize user tracking on component mount
  useEffect(() => {
    initializeTracking();
  }, []);

  const handleSignInWithX = async () => {
    setIsLoading(true);
    const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
    // Land users on the bookmarks board right after authorization unless a
    // specific ?next= destination was requested.
    const callbackURL = next
      ? new URL(next, window.location.origin).toString()
      : `${prefix}/dashboard/bookmarks`;

    const { error } = await authClient.signIn.social({
      provider: "twitter",
      callbackURL,
      errorCallbackURL: "/redirect-error",
    });

    if (error) {
      setIsLoading(false);
      toast.error(t("Toast.X.errorTitle"), {
        description: error.message || t("Toast.X.errorDescription"),
      });
    }
    // On success the browser is redirected to the X authorization page.
  };

  return (
    <div className={`grid gap-6 ${className}`}>
      <Button
        onClick={handleSignInWithX}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <TwitterX className="h-4 w-4" />
        )}
        {t("signInMethods.signInWithX")}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {t.rich("signInMethods.consent", {
          terms: (chunks) => (
            <Link
              href="/terms-of-service"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {chunks}
            </Link>
          ),
          privacy: (chunks) => (
            <Link
              href="/privacy-policy"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
    </div>
  );
}
