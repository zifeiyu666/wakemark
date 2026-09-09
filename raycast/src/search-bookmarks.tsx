import {
  Action,
  ActionPanel,
  Color,
  Icon,
  List,
  showToast,
  Toast,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useState } from "react";
import { searchBookmarks, type SearchBookmark } from "./lib/api";
import { AuthError, getStoredApiKey } from "./lib/auth";
import { siteUrl } from "./lib/config";
import { SignInList } from "./lib/sign-in-list";

function bookmarkDetailMarkdown(b: SearchBookmark): string {
  const author = b.authorName || b.authorUsername || "Unknown";
  const handle = b.authorUsername ? `@${b.authorUsername}` : "";
  const body = (b.summary || b.text || "").trim() || "_No preview_";
  return `## ${author} ${handle}\n\n${body}\n\n[Open on X](${b.tweetUrl})`;
}

export default function SearchBookmarks() {
  const [searchText, setSearchText] = useState("");
  const { isLoading: authLoading, data: apiKey, revalidate } = usePromise(
    getStoredApiKey
  );

  if (!authLoading && !apiKey) {
    return (
      <SignInList
        title="Sign in to search bookmarks"
        onSignedIn={() => revalidate()}
      />
    );
  }

  return (
    <SearchList
      enabled={!!apiKey}
      isAuthLoading={authLoading}
      searchText={searchText}
      onSearchTextChange={setSearchText}
    />
  );
}

function SearchList({
  enabled,
  isAuthLoading,
  searchText,
  onSearchTextChange,
}: {
  enabled: boolean;
  isAuthLoading: boolean;
  searchText: string;
  onSearchTextChange: (value: string) => void;
}) {
  const { isLoading, data, pagination, error } = usePromise(
    (q: string) => async (options: { page: number }) => {
      const page = await searchBookmarks({
        q,
        page: options.page,
        limit: 20,
      });
      return { data: page.bookmarks, hasMore: page.hasMore };
    },
    [searchText],
    {
      execute: enabled,
      onError: async (err) => {
        await showToast({
          style: Toast.Style.Failure,
          title: "Search failed",
          message: err instanceof Error ? err.message : String(err),
        });
      },
    }
  );

  const empty =
    error instanceof AuthError
      ? "Session expired. Sign in again."
      : error
        ? error.message
        : searchText.trim()
          ? `No bookmarks matched “${searchText.trim()}”.`
          : "No bookmarks yet. Sync from the dashboard first.";

  return (
    <List
      isLoading={isAuthLoading || isLoading}
      isShowingDetail={(data?.length ?? 0) > 0}
      searchBarPlaceholder="Search bookmarks…"
      filtering={false}
      throttle
      onSearchTextChange={onSearchTextChange}
      pagination={pagination}
    >
      <List.EmptyView
        icon={Icon.MagnifyingGlass}
        title="No results"
        description={empty}
      />
      {data?.map((b) => (
        <List.Item
          key={b.id}
          icon={
            b.authorProfileImageUrl
              ? { source: b.authorProfileImageUrl }
              : Icon.Person
          }
          title={b.authorName || b.authorUsername || "Unknown"}
          subtitle={b.summary || b.text}
          accessories={[
            ...(b.authorUsername
              ? [{ tag: `@${b.authorUsername}` }]
              : []),
            ...(b.primaryCategory
              ? [{ tag: { value: b.primaryCategory, color: Color.Blue } }]
              : []),
          ]}
          detail={
            <List.Item.Detail
              markdown={bookmarkDetailMarkdown(b)}
              metadata={
                <List.Item.Detail.Metadata>
                  {b.authorUsername ? (
                    <List.Item.Detail.Metadata.Label
                      title="Author"
                      text={`@${b.authorUsername}`}
                    />
                  ) : null}
                  {b.primaryCategory ? (
                    <List.Item.Detail.Metadata.Label
                      title="Category"
                      text={b.primaryCategory}
                    />
                  ) : null}
                  <List.Item.Detail.Metadata.Label
                    title="Read"
                    text={b.isRead ? "Yes" : "No"}
                  />
                  <List.Item.Detail.Metadata.Link
                    title="Tweet"
                    text="Open on X"
                    target={b.tweetUrl}
                  />
                </List.Item.Detail.Metadata>
              }
            />
          }
          actions={
            <ActionPanel>
              <Action.OpenInBrowser title="Open Tweet" url={b.tweetUrl} />
              <Action.CopyToClipboard
                title="Copy Tweet Text"
                content={b.summary || b.text}
              />
              <Action.CopyToClipboard title="Copy Tweet URL" content={b.tweetUrl} />
              <Action.OpenInBrowser
                title="Open WakeMark"
                url={siteUrl()}
                shortcut={{ modifiers: ["cmd"], key: "o" }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
