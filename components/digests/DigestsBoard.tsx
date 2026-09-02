"use client";

import {
  getDigest,
  getDigests,
  type DigestListItem,
} from "@/actions/digests";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { DigestViewer } from "./DigestViewer";
import { formatWeekKeyShort } from "./format";

export function DigestsBoard() {
  const t = useTranslations("Digests");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: listData } = useSWR("digests-list", getDigests);
  const list: DigestListItem[] =
    listData?.success ? (listData.data ?? []) : [];

  // Default to the most recent digest.
  useEffect(() => {
    if (!selectedId && list.length > 0) {
      setSelectedId(list[0].id);
    }
  }, [list, selectedId]);

  const { data: detailData } = useSWR(
    selectedId ? ["digest", selectedId] : null,
    () => getDigest(selectedId as string)
  );
  const detail = detailData?.success ? detailData.data : null;

  return (
    <div className="flex h-full min-h-[70vh] flex-col">
      <div className="flex items-baseline gap-3 px-1 pb-4">
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          {t("title")}
        </h1>
        {list.length > 0 && (
          <span className="text-sm text-muted-foreground">{list.length}</span>
        )}
      </div>

      {list.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border bg-muted/40 px-6 py-24 text-center">
          <h2 className="font-serif text-xl font-bold">{t("emptyTitle")}</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {t("emptyDescription")}
          </p>
        </div>
      ) : (
        <div className="flex h-[calc(100vh-108px)] min-h-[420px] overflow-hidden rounded-xl border bg-background">
          {/* Digest list */}
          <div className="w-72 shrink-0 overflow-y-auto border-r">
            {list.map((item, index) => {
              const isSelected = item.id === selectedId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`block w-full border-l-2 px-5 py-4 text-left transition-colors ${
                    isSelected
                      ? "border-foreground bg-muted"
                      : "border-transparent hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-serif text-base font-bold">
                      {formatWeekKeyShort(item.weekKey)}
                    </span>
                    {index === 0 && (
                      <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                        {t("latest")}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("bookmarksCount", { count: item.bookmarkCount })}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Digest detail */}
          {detail ? (
            <DigestViewer digest={detail} />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              {t("loading")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
