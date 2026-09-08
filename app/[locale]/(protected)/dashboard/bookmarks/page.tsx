import { BookmarksBoard } from "@/components/bookmarks/BookmarksBoard";
import { readXHandoffUsername } from "@/lib/auth/x-handoff";

type Params = Record<string, string | string[] | undefined>;

function pickOauthError(raw: string | string[] | undefined): string | null {
  const codes = (Array.isArray(raw) ? raw : raw ? [raw] : []).filter(Boolean);
  return codes.find((code) => code !== "link-failed") ?? codes[0] ?? null;
}

export default async function AllBookmarksPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const oauthError = pickOauthError(params.error);
  const linkedXUsername =
    oauthError === "account_already_linked_to_different_user"
      ? await readXHandoffUsername()
      : null;
  return (
    <BookmarksBoard
      view="all"
      oauthError={oauthError}
      linkedXUsername={linkedXUsername}
    />
  );
}
