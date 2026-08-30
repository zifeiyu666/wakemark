import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

function getKey(): Buffer {
  const secret =
    process.env.X_TOKEN_ENCRYPTION_KEY || process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "X_TOKEN_ENCRYPTION_KEY (or BETTER_AUTH_SECRET) is not set"
    );
  }
  return createHash("sha256").update(secret).digest();
}

/**
 * AES-256-GCM encryption for X OAuth tokens & PKCE cookie payloads.
 * Format: iv.tag.ciphertext (base64)
 */
export function encryptText(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptText(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid encrypted payload");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
