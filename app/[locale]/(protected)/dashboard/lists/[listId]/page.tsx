import { getList } from "@/actions/bookmarks/lists";
import { BookmarksBoard } from "@/components/bookmarks/BookmarksBoard";
import { notFound } from "next/navigation";

export default async function ListBookmarksPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}) {
  const { listId } = await params;
  const res = await getList(listId);
  if (!res.success || !res.data) notFound();

  return <BookmarksBoard view="all" list={res.data} />;
}
