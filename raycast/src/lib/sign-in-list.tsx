import { Action, ActionPanel, Icon, List, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { waitForGrant } from "./api";
import { startBrowserLogin } from "./auth";
import { siteUrl } from "./config";

export function SignInList({
  title,
  onSignedIn,
}: {
  title: string;
  onSignedIn?: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function connect() {
    setBusy(true);
    try {
      await showToast({
        style: Toast.Style.Animated,
        title: "Waiting for browser sign-in…",
      });
      const state = await startBrowserLogin();
      await waitForGrant(state);
      await showToast({
        style: Toast.Style.Success,
        title: "Signed in",
      });
      onSignedIn?.();
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

  return (
    <List isLoading={busy}>
      <List.EmptyView
        icon={Icon.Person}
        title={title}
        description="Opens wakemark.app in your browser. Chrome history import is not available here."
        actions={
          <ActionPanel>
            <Action
              title="Sign In with Browser"
              icon={Icon.Globe}
              onAction={connect}
            />
            <Action.OpenInBrowser title="Open WakeMark" url={siteUrl()} />
          </ActionPanel>
        }
      />
    </List>
  );
}
