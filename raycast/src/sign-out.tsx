import { showHUD } from "@raycast/api";
import { revokeAuth } from "./lib/api";
import { getStoredApiKey } from "./lib/auth";

export default async function SignOut() {
  const key = await getStoredApiKey();
  if (!key) {
    await showHUD("Already signed out");
    return;
  }
  await revokeAuth();
  await showHUD("Signed out of WakeMark");
}
