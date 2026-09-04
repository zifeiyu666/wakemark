import { getFeedbacks } from "@/actions/feedback/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import dayjs from "dayjs";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

type Params = Promise<{ locale: string }>;
type SearchParams = Promise<{ page?: string }>;

type MetadataProps = {
  params: Params;
};

const PAGE_SIZE = 20;

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "Feedback",
  });

  return constructMetadata({
    title: t("inbox.title"),
    description: t("inbox.description"),
    locale: locale as Locale,
    path: `/dashboard/feedbacks`,
  });
}

export default async function AdminFeedbacksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = await getTranslations("Feedback");
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const result = await getFeedbacks({
    pageIndex: page - 1,
    pageSize: PAGE_SIZE,
  });

  if (!result.success) {
    return <p className="text-destructive">{result.error}</p>;
  }

  const items = result.data?.items ?? [];
  const totalCount = result.data?.totalCount ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("inbox.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("inbox.description")}
        </p>
      </header>

      {items.length === 0 ? (
        <p className="text-muted-foreground">{t("inbox.empty")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("inbox.columns.createdAt")}</TableHead>
              <TableHead>{t("category")}</TableHead>
              <TableHead>{t("inbox.columns.from")}</TableHead>
              <TableHead>{t("fieldTitle")}</TableHead>
              <TableHead>{t("message")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {dayjs(item.createdAt).format("YYYY-MM-DD HH:mm")}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {t(`categories.${item.category}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {item.user?.name || t("inbox.unknownUser")}
                    </span>
                    <span className="text-muted-foreground">
                      {item.user?.email || "—"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="max-w-[220px] font-medium">
                  {item.title}
                </TableCell>
                <TableCell className="max-w-[420px] whitespace-pre-wrap text-muted-foreground">
                  {item.message}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("inbox.page", { page, pageCount, totalCount })}
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Button asChild variant="outline">
                <Link
                  href={`/dashboard/feedbacks?page=${page - 1}`}
                  prefetch={false}
                >
                  {t("inbox.previous")}
                </Link>
              </Button>
            ) : (
              <Button variant="outline" disabled>
                {t("inbox.previous")}
              </Button>
            )}
            {page < pageCount ? (
              <Button asChild variant="outline">
                <Link
                  href={`/dashboard/feedbacks?page=${page + 1}`}
                  prefetch={false}
                >
                  {t("inbox.next")}
                </Link>
              </Button>
            ) : (
              <Button variant="outline" disabled>
                {t("inbox.next")}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
