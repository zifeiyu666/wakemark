import { NextResponse } from "next/server";

// Chrome extension pages fetch from chrome-extension:// origins. Allow the
// fixed production ID (CHROME_EXTENSION_ID) plus any chrome-extension://
// origin in development so unpacked builds keep working before a key is set.

function allowedOrigins(): string[] {
  const ids = new Set<string>();
  const configured = process.env.CHROME_EXTENSION_ID?.trim();
  if (configured) ids.add(configured);
  // Local unpacked ID from extension/key.b64 (dev only).
  ids.add("mlecdjaacmkbddpfddckfjhkchamjfco");
  return [...ids].map((id) => `chrome-extension://${id}`);
}

export function isAllowedExtensionOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (allowedOrigins().includes(origin)) return true;
  if (
    process.env.NODE_ENV === "development" &&
    origin.startsWith("chrome-extension://")
  ) {
    return true;
  }
  return false;
}

export function extensionCorsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("origin");
  if (!isAllowedExtensionOrigin(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin!,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, x-api-key",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function extensionOptionsResponse(req: Request): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: extensionCorsHeaders(req),
  });
}

export function withExtensionCors(
  req: Request,
  response: Response
): Response {
  const cors = extensionCorsHeaders(req);
  if (!Object.keys(cors).length) return response;
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(cors)) {
    headers.set(key, value as string);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
