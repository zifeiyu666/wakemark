import { sendEmail } from "@/actions/resend";
import { siteConfig } from "@/config/site";
import EmailVerificationEmail from "@/emails/email-verification";
import MagicLinkEmail from "@/emails/magic-link-email";
import OTPCodeEmail from "@/emails/otp-code-email";
import { UserWelcomeEmail } from "@/emails/user-welcome";
import { db } from "@/lib/db";
import { account, apikey, session, user, verification } from "@/lib/db/schema";
import { isSyntheticEmail, syntheticEmailFor } from "@/lib/email";
import {
  buildUserSourceData,
  parseTrackingCookie,
  saveUserSource,
  TRACKING_COOKIE_NAME,
} from "@/lib/tracking/server";
import { isTrackingEnabled } from "@/lib/tracking/shared";
import { redis } from "@/lib/upstash";
import { upsertXConnectionFromAccount } from "@/lib/x/connection-store";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import {
  admin,
  apiKey,
  captcha,
  emailOTP,
  lastLoginMethod,
  magicLink,
} from "better-auth/plugins";
import { cookies } from "next/headers";

export const auth = betterAuth({
  appName: siteConfig.name,
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
    // Use Cloudflare IP header for accurate IP detection
    ipAddress: {
      ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for", "x-real-ip"],
    },
  },
  // IP-based rate limiting configuration
  rateLimit: {
    enabled: process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_RATE_LIMIT_ENABLED === 'true',
    window: 60, // 60 seconds default window
    max: 100, // 100 requests per window (global default)
    customRules: {
      "/get-session": false,
      "/sign-in/magic-link": {
        window: 60,
        max: 3,
      },
      "/email-otp/send-verification-otp": {
        window: 60,
        max: 3,
      },
      "/sign-in/email-otp": {
        window: 60,
        max: 5,
      },
    },
    // Use Upstash Redis for rate limit storage (works with serverless)
    ...(redis && {
      customStorage: {
        get: async (key: string) => {
          const data = await redis!.get<{ key: string; count: number; lastRequest: number }>(key);
          return data || undefined;
        },
        set: async (key: string, value: { key: string; count: number; lastRequest: number }) => {
          // TTL of 2 minutes (120 seconds) - enough for rate limit windows
          await redis!.set(key, value, { ex: 120 });
        },
      },
    }),
  },
  session: {
    cookieCache: {
      // Cookie cache is signed with BETTER_AUTH_SECRET and does not hit the
      // session table. After switching from Neon to a local empty DB the
      // cached cookie still looks logged-in while the server has no row,
      // which bounces /login ↔ /dashboard. Keep it off in development.
      enabled: process.env.NODE_ENV === "production",
      maxAge: 10 * 60, // Cache duration in seconds
    },
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['twitter', 'google'],
    },
  },
  user: {
    changeEmail: {
      enabled: true,
    },
    deleteUser: {
      enabled: true,
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        email: user.email,
        subject: `Verify your email for ${siteConfig.name}`,
        react: EmailVerificationEmail,
        reactProps: {
          url,
        },
      });
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: user,
      session: session,
      account: account,
      verification: verification,
      apikey: apikey,
    },
  }),
  socialProviders: {
    google: {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    twitter: {
      clientId: process.env.X_CLIENT_ID!,
      clientSecret: process.env.X_CLIENT_SECRET!,
      // Stacked on top of the provider defaults
      // (users.read tweet.read offline.access users.email).
      scope: ["bookmark.read"],
      // X may not hand back a verified email; better-auth requires one to
      // register the user, so fall back to a detectable synthetic address
      // that the email-prompt flow replaces later.
      getUserInfo: async (token) => {
        const res = await fetch(
          "https://api.x.com/2/users/me?user.fields=profile_image_url,confirmed_email",
          {
            headers: { Authorization: `Bearer ${token.accessToken}` },
          }
        );
        if (!res.ok) return null;
        const json = (await res.json()) as {
          data?: {
            id: string;
            username: string;
            name?: string;
            profile_image_url?: string;
            confirmed_email?: string;
          };
        };
        if (!json.data) return null;
        const profile = json.data;
        const email = profile.confirmed_email?.toLowerCase();
        return {
          user: {
            id: profile.id,
            name: profile.name || profile.username,
            email: email || syntheticEmailFor(profile.username),
            image: profile.profile_image_url,
            emailVerified: !!email,
          },
          data: profile,
        };
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          const cookieStore = await cookies();

          // Only track user source if enabled via environment variable
          const isTrackingEnabledValue = await isTrackingEnabled()
          if (isTrackingEnabledValue) {
            try {
              const trackingCookie = cookieStore.get(TRACKING_COOKIE_NAME);
              const clientData = parseTrackingCookie(trackingCookie?.value);

              const sourceData = await buildUserSourceData(createdUser.id, clientData || undefined);
              await saveUserSource(sourceData);

              cookieStore.delete(TRACKING_COOKIE_NAME);
            } catch (error) {
              console.error('Failed to save user source data:', error);
            }
          }

          // Send welcome email (skip synthetic X-login placeholders).
          // Detached fire-and-forget: signup must not wait on the mail
          // provider, and a send failure must never break registration.
          if (createdUser.email && !isSyntheticEmail(createdUser.email)) {
            const unsubscribeToken = Buffer.from(createdUser.email).toString('base64');
            const unsubscribeLink = `${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe/newsletter?token=${unsubscribeToken}`;

            void sendEmail({
              email: createdUser.email,
              subject: `Welcome to ${siteConfig.name}!`,
              react: UserWelcomeEmail,
              reactProps: {
                name: createdUser.name,
                email: createdUser.email,
                unsubscribeLink: unsubscribeLink,
              },
              isAddContacts: true
            })
              .then(() => console.log(`Welcome email sent to ${createdUser.email}`))
              .catch((error) => console.error('Failed to send welcome email:', error));
          }
        },
      },
    },
    account: {
      create: {
        // First X sign-in or linkSocial connect: mirror the fresh tokens
        // into x_connections so the sync engine works immediately.
        after: async (createdAccount) => {
          if (createdAccount.providerId !== "twitter" || !createdAccount.accessToken) return;
          try {
            await upsertXConnectionFromAccount({
              userId: createdAccount.userId,
              accountId: createdAccount.accountId,
              accessToken: createdAccount.accessToken,
              refreshToken: createdAccount.refreshToken,
              accessTokenExpiresAt: createdAccount.accessTokenExpiresAt,
              scope: createdAccount.scope,
            });
          } catch (error) {
            console.error("Failed to upsert X connection from account:", error);
          }
        },
      },
      update: {
        // Repeated X sign-ins rotate in fresh tokens; keep x_connections in
        // sync so the sync engine never holds a stale refresh token.
        after: async (updatedAccount) => {
          if (updatedAccount.providerId !== "twitter" || !updatedAccount.accessToken) return;
          try {
            await upsertXConnectionFromAccount({
              userId: updatedAccount.userId,
              accountId: updatedAccount.accountId,
              accessToken: updatedAccount.accessToken,
              refreshToken: updatedAccount.refreshToken,
              accessTokenExpiresAt: updatedAccount.accessTokenExpiresAt,
              scope: updatedAccount.scope,
            });
          } catch (error) {
            console.error("Failed to upsert X connection from account:", error);
          }
        },
      },
    },
  },
  trustedOrigins: process.env.NODE_ENV === 'development' ? [process.env.NEXT_PUBLIC_SITE_URL!, 'http://localhost:3000'] : [process.env.NEXT_PUBLIC_SITE_URL!],
  plugins: [
    ...(process.env.TURNSTILE_SECRET_KEY &&
    process.env.NODE_ENV === "production"
      ? [
          captcha({
            provider: "cloudflare-turnstile",
            secretKey: process.env.TURNSTILE_SECRET_KEY,
          }),
        ]
      : []),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendEmail({
          email,
          subject: `Sign in to ${siteConfig.name}`,
          react: MagicLinkEmail,
          reactProps: {
            url,
          },
        });
      },
      expiresIn: 60 * 5,
    }),
    emailOTP({
      otpLength: 6,
      expiresIn: 60 * 10,
      sendVerificationOTP: async ({ email, otp, type }) => {
        await sendEmail({
          email,
          subject: `Your ${siteConfig.name} verification code: ${otp}`,
          react: OTPCodeEmail,
          reactProps: {
            otp,
            type,
          },
        });
      },
    }),
    lastLoginMethod(),
    admin(),
    // User-scoped API keys for the WakeMark MCP endpoint (/api/mcp). Agents
    // send "Authorization: Bearer wkm_..."; verifyApiKey resolves the owner.
    apiKey({
      apiKeyHeaders: ["authorization", "x-api-key"],
      defaultPrefix: "wkm_",
      defaultKeyLength: 48,
      requireName: true,
      maximumNameLength: 60,
      enableMetadata: true,
      startingCharactersConfig: { shouldStore: true, charactersLength: 9 },
      keyExpiration: { defaultExpiresIn: null, maxExpiresIn: 365 },
      rateLimit: {
        enabled: true,
        timeWindow: 60 * 1000, // per-minute window
        maxRequests: 120,
      },
    }),
    nextCookies() // make sure this is the last plugin in the array
  ]
});
