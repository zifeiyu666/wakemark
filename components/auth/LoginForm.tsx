"use client";

import { GoogleIcon } from "@/components/icons";
import { TwitterX } from "@/components/social-icons/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { authClient } from "@/lib/auth/auth-client";
import { normalizeEmail } from "@/lib/email";
import { sanitizeNextPath } from "@/lib/extension/safe-next";
import { initializeTracking } from "@/lib/tracking/client";
import { Turnstile } from "@marsidev/react-turnstile";
import { Link as LinkIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface LoginFormProps {
  className?: string;
}

type LoginMode = "otp" | "magic-link";

export default function LoginForm({ className = "" }: LoginFormProps) {
  const t = useTranslations("Login");
  const locale = useLocale();

  const [lastMethod, setLastMethod] = useState<string | null>(null);
  const [mode, setMode] = useState<LoginMode>("otp");
  const [email, setEmail] = useState("");
  const [isXLoading, setIsXLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [showTurnstile, setShowTurnstile] = useState(false);
  const turnstileRef = useRef<{ reset?: () => void } | null>(null);

  const [otpCode, setOtpCode] = useState("");
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const socialBusy = isXLoading || isGoogleLoading;
  const emailBusy = isLoading || isOtpLoading;
  const turnstileRequired = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    setLastMethod(authClient.getLastUsedLoginMethod());
  }, []);

  useEffect(() => {
    initializeTracking();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const getCallbackUrl = () => {
    const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
    // Only allow same-origin relative paths (e.g. extension connect).
    const safeNext = sanitizeNextPath(next);
    if (safeNext) {
      return `${window.location.origin}${safeNext}`;
    }
    return `${window.location.origin}${prefix}/dashboard/bookmarks`;
  };

  const LastUsedBadge = ({ method }: { method: string }) =>
    lastMethod === method ? (
      <Badge
        variant="secondary"
        className="absolute right-2 text-[10px] px-1.5 py-0.5 pointer-events-none"
      >
        {t("signInMethods.lastUsed")}
      </Badge>
    ) : null;

  const handleSignInWithX = async () => {
    setIsXLoading(true);
    const { error } = await authClient.signIn.social({
      provider: "twitter",
      callbackURL: getCallbackUrl(),
      errorCallbackURL: "/redirect-error",
    });

    if (error) {
      setIsXLoading(false);
      toast.error(t("Toast.X.errorTitle"), {
        description: error.message || t("Toast.X.errorDescription"),
      });
    }
  };

  const handleSignInWithGoogle = async () => {
    setIsGoogleLoading(true);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: getCallbackUrl(),
      errorCallbackURL: "/redirect-error",
    });

    if (error) {
      setIsGoogleLoading(false);
      toast.error(t("Toast.Google.errorTitle"), {
        description: error.message || t("Toast.Google.errorDescription"),
      });
    }
  };

  const handleEmailLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await authClient.signIn.magicLink({
        email: normalizeEmail(email),
        callbackURL: getCallbackUrl(),
        errorCallbackURL: "/redirect-error",
        fetchOptions: {
          headers: {
            "x-captcha-response": captchaToken || "",
          },
        },
      });

      if (error) {
        if (error.status === 429) {
          toast.error(t("Toast.rateLimitTitle"), {
            description: t("Toast.rateLimitDescription"),
          });
          return;
        }
        toast.error(t("Toast.Email.errorTitle"), {
          description: error.message || t("Toast.Email.errorDescription"),
        });
        return;
      }

      toast.success(t("Toast.Email.successTitle"), {
        description: t("Toast.Email.successDescription"),
      });
    } catch {
      toast.error(t("Toast.Email.errorTitle"), {
        description: t("Toast.Email.errorDescription"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsOtpLoading(true);

    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: normalizeEmail(email),
        type: "sign-in",
        fetchOptions:
          captchaToken && turnstileRequired
            ? {
                headers: {
                  "x-captcha-response": captchaToken,
                },
              }
            : undefined,
      });

      if (error) {
        if (error.status === 429) {
          toast.error(t("Toast.rateLimitTitle"), {
            description: t("Toast.rateLimitDescription"),
          });
          return;
        }
        toast.error(t("Toast.OTP.errorTitle"), {
          description: error.message || t("Toast.OTP.sendErrorDescription"),
        });
        return;
      }

      toast.success(t("Toast.OTP.sendSuccessTitle"), {
        description: t("Toast.OTP.sendSuccessDescription"),
      });
      setCountdown(60);
    } catch {
      toast.error(t("Toast.OTP.errorTitle"), {
        description: t("Toast.OTP.sendErrorDescription"),
      });
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return;

    setIsOtpLoading(true);

    try {
      const { error } = await authClient.signIn.emailOtp({
        email: normalizeEmail(email),
        otp: otpCode,
        fetchOptions:
          captchaToken && turnstileRequired
            ? {
                headers: {
                  "x-captcha-response": captchaToken,
                },
              }
            : undefined,
      });

      if (error) {
        if (error.status === 429) {
          toast.error(t("Toast.rateLimitTitle"), {
            description: t("Toast.rateLimitDescription"),
          });
          return;
        }
        toast.error(t("Toast.OTP.errorTitle"), {
          description: error.message || t("Toast.OTP.verifyErrorDescription"),
        });
        return;
      }

      toast.success(t("Toast.OTP.verifySuccessTitle"), {
        description: t("Toast.OTP.verifySuccessDescription"),
      });

      window.location.assign(getCallbackUrl());
    } catch {
      toast.error(t("Toast.OTP.errorTitle"), {
        description: t("Toast.OTP.verifyErrorDescription"),
      });
    } finally {
      setIsOtpLoading(false);
    }
  };

  return (
    <div className={`grid gap-6 ${className}`}>
      <div className="grid gap-3">
        <Button
          onClick={handleSignInWithX}
          disabled={socialBusy || emailBusy}
          className="relative w-full"
        >
          {isXLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <TwitterX className="h-4 w-4" />
          )}
          {t("signInMethods.signInWithX")}
          <LastUsedBadge method="twitter" />
        </Button>
        <Button
          variant="outline"
          onClick={handleSignInWithGoogle}
          disabled={socialBusy || emailBusy}
          className="relative w-full"
        >
          {isGoogleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon className="h-4 w-4" />
          )}
          {t("signInMethods.signInWithGoogle")}
          <LastUsedBadge method="google" />
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t("signInMethods.or")}
          </span>
        </div>
      </div>

      <div className="grid gap-2 text-left">
        <div className="grid">
          <div className="text-sm font-medium">
            {t("signInMethods.emailLabel")}
          </div>
          <Input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={emailBusy || socialBusy}
            onMouseEnter={() => setShowTurnstile(true)}
            onFocus={() => setShowTurnstile(true)}
          />
        </div>

        {mode === "otp" && (
          <div className="grid">
            <div className="text-sm font-medium">
              {t("signInMethods.otpMethod")}
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                disabled={emailBusy || socialBusy}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                className="min-w-[120px]"
                onClick={handleSendOTP}
                disabled={
                  !email ||
                  emailBusy ||
                  socialBusy ||
                  countdown > 0 ||
                  (turnstileRequired && !captchaToken)
                }
              >
                {isOtpLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : countdown > 0 ? (
                  `${countdown}s`
                ) : (
                  t("signInMethods.sendOTP")
                )}
              </Button>
            </div>
          </div>
        )}

        {turnstileRequired && (showTurnstile || email.length > 0) && (
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={(token: string) => {
              setCaptchaToken(token);
            }}
            onError={() => {
              setCaptchaToken("");
              toast.error(t("Toast.Turnstile.errorTitle"), {
                description: t("Toast.Turnstile.errorDescription"),
              });
            }}
            onExpire={() => {
              setCaptchaToken("");
              turnstileRef.current?.reset?.();
            }}
            options={{
              size: "flexible",
              theme: "auto",
              language: locale,
            }}
          />
        )}

        <Button
          onClick={mode === "otp" ? handleVerifyOTP : handleEmailLogin}
          disabled={
            !email ||
            emailBusy ||
            socialBusy ||
            (mode === "otp" && otpCode.length !== 6) ||
            (turnstileRequired && !captchaToken)
          }
          className="w-full"
        >
          {emailBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : mode === "otp" ? (
            t("Button.signIn")
          ) : (
            <>
              <LinkIcon className="h-4 w-4" />
              {t("signInMethods.magicLinkMethod")}
            </>
          )}
        </Button>

        <div className="text-center">
          <Button
            type="button"
            variant="link"
            className="text-xs font-normal text-muted-foreground hover:text-primary"
            onClick={() => {
              setMode((current) =>
                current === "otp" ? "magic-link" : "otp"
              );
              setOtpCode("");
            }}
          >
            {mode === "otp"
              ? t("signInMethods.switchToMagicLink")
              : t("signInMethods.switchToOtp")}
          </Button>
        </div>
      </div>

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
