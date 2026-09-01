import { PublicListView } from "@/components/bookmarks/PublicListView";
import { siteConfig } from "@/config/site";
import { loadPublicList } from "@/lib/bookmarks/public-lists";
import { listUserTags } from "@/lib/bookmarks/tag-counts";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

type PageParams = Promise<{ username: string; slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { username, slug } = await params;
  const data = await loadPublicList(username, slug);
  if (!data) {
    return { title: `List not found · ${siteConfig.name}` };
  }
  return {
    title: `${data.list.name} by @${data.ownerUsername} · ${siteConfig.name}`,
    description: `A public bookmark list curated by @${data.ownerUsername} on ${siteConfig.name}.`,
  };
}

export default async function PublicListPage({
  params,
}: {
  params: PageParams;
}) {
  const { username, slug } = await params;
  const t = await getTranslations("Lists");
  const data = await loadPublicList(username, slug);

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
        <h1 className="text-3xl font-semibold">{t("public.notFoundTitle")}</h1>
        <p className="text-muted-foreground">
          {t("public.notFoundDescription")}
        </p>
      </div>
    );
  }

  const tagRows = await listUserTags(data.ownerUserId, 200);
  const tagColors: Record<string, string | null> = {};
  for (const tag of tagRows) tagColors[tag.name] = tag.color;

  return (
    <PublicListView
      listName={data.list.name}
      ownerUsername={data.ownerUsername}
      bookmarks={data.bookmarks}
      tagColors={tagColors}
    />
  );
}
