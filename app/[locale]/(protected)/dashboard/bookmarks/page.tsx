import { BookmarksBoard } from "@/components/bookmarks/BookmarksBoard";

export default async function AllBookmarksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawError = params.error;
  const oauthError = Array.isArray(rawError) ? rawError[0] : rawError;
  return <BookmarksBoard view="all" oauthError={oauthError ?? null} />;
}
