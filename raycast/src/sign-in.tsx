import { Action, ActionPanel, Icon, List, showToast, Toast } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useState } from "react";
import { waitForGrant } from "./lib/api";
import { getStoredApiKey, getStoredUser, startBrowserLogin } from "./lib/auth";
import { siteUrl } from "./lib/config";

export default function SignIn() {
  const [busy, setBusy] = useState(false);
  const { isLoading, data, revalidate } = useCachedPromise(async () => {
    const apiKey = await getStoredApiKey();
    if (!apiKey) return null;
    return (await getStoredUser()) ?? { id: "unknown", name: "WakeMark", image: null };
  }, []);

  async function connect() {
    setBusy(true);
    try {
      await showToast({
        style: Toast.Style.Animated,
        title: "Waiting for browser sign-in…",
      });
      const state = await startBrowserLogin();
      await waitForGrant(state);
      await showToast({ style: Toast.Style.Success, title: "Signed in" });
      revalidate();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Sign-in failed",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setBusy(false);
    }
  }

  if (data) {
    return (
      <List isLoading={isLoading || busy}>
        <List.EmptyView
          icon={Icon.CheckCircle}
          title={`Signed in${data.name ? ` as ${data.name}` : ""}`}
          description="Search Bookmarks and Ask AI use this account. Sign out from the Sign Out command if you need to switch."
          actions={
            <ActionPanel>
              <Action.OpenInBrowser title="Open WakeMark" url={siteUrl()} />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List isLoading={isLoading || busy}>
      <List.EmptyView
        icon={Icon.Person}
        title="Connect WakeMark"
        description="Sign in on wakemark.app. This does not import X history — use the Chrome extension for that."
        actions={
          <ActionPanel>
            <Action title="Sign In with Browser" icon={Icon.Globe} onAction={connect} />
            <Action.OpenInBrowser title="Open WakeMark" url={siteUrl()} />
          </ActionPanel>
        }
      />
    </List>
  );
}
