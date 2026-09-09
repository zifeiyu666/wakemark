export const X_IMPORT_ORIGINS = [
  "https://x.com/*",
  "https://twitter.com/*",
];

/** Must run from a popup click handler — Chrome requires a user gesture here. */
export async function ensureXImportPermissions(): Promise<void> {
  const has = await chrome.permissions.contains({ origins: X_IMPORT_ORIGINS });
  if (has) return;
  const granted = await chrome.permissions.request({ origins: X_IMPORT_ORIGINS });
  if (!granted) {
    throw new Error(
      "x.com access is required. Allow the permission prompt, then try again."
    );
  }
}
