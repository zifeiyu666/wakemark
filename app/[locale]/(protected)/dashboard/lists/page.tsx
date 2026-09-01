import { getLists } from "@/actions/bookmarks/lists";
import { Globe, Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function ListsIndexPage() {
  const t = await getTranslations("Lists");
  const res = await getLists();
  const lists = res.success ? (res.data ?? []) : [];

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{t("index.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("index.description")}</p>
      </div>

      {lists.length === 0 ? (
        <div className="rounded-lg border border-border bg-background px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">{t("index.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("index.empty")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lists.map((list) => (
            <Link
              key={list.id}
              href={`/dashboard/lists/${list.id}`}
              className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4 transition-colors hover:border-foreground"
            >
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold">
                  {list.name}
                </span>
                <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                  {list.isPublic ? (
                    <Globe className="h-3.5 w-3.5" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                  {list.count}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {list.isPublic ? t("board.public") : t("board.private")}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
