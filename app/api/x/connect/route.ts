import { getSession } from "@/lib/auth/server";
import { encryptText } from "@/lib/x/crypto";
import { buildAuthorizeUrl, generatePkce } from "@/lib/x/oauth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { state, codeVerifier, codeChallenge } = generatePkce();
  const redirectUri = new URL("/api/x/callback", request.url).toString();

  const response = NextResponse.redirect(
    buildAuthorizeUrl({ state, codeChallenge, redirectUri })
  );
  // PKCE verifier + state travel in a short-lived httpOnly cookie.
  response.cookies.set(
    "x_pkce",
    encryptText(JSON.stringify({ state, codeVerifier })),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 600,
      path: "/",
    }
  );
  return response;
}
