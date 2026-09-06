import {
  emailOTPClient,
  lastLoginMethodClient,
  magicLinkClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL,
  plugins: [magicLinkClient(), emailOTPClient(), lastLoginMethodClient()],
});
