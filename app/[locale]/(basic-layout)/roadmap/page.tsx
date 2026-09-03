import { Badge } from "@/components/ui/badge";
import { LOCALES, Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Params = Promise<{ locale: string }>;

type UpcomingItem = {
  status: "in-development" | "planned" | "exploring";
  title: string;
  description: string;
};

type Release = {
  date: string;
  title: string;
  description: string;
};

const statusBadgeVariant: Record<UpcomingItem["status"], "default" | "secondary" | "outline"> = {
  "in-development": "default",
  planned: "secondary",
  exploring: "outline",
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Roadmap" });

  return constructMetadata({
    title: t("meta.title"),
    description: t("meta.description"),
    locale: locale as Locale,
    path: "/roadmap",
  });
}

export default async function RoadmapPage({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Roadmap" });

  const upcoming: UpcomingItem[] = t.raw("upcoming.items");
  const releases: Release[] = t.raw("releases");

  return (
    <div className="w-full py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="max-w-3xl">
          <p className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {t("hero.eyebrow")}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            <span className="title-gradient">{t("hero.title")}</span>
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
            {t("hero.description")}
          </p>
        </div>

        {/* Upcoming */}
        <section className="mt-20 md:mt-24">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("upcoming.title")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("upcoming.description")}
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {upcoming.map((item) => (
              <div
                key={item.title}
                className="flex flex-col gap-3 rounded-xl border bg-card p-6 shadow-xs"
              >
                <Badge variant={statusBadgeVariant[item.status]} className="w-fit">
                  {t(`statuses.${item.status}`)}
                </Badge>
                <h3 className="text-lg font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Shipped */}
        <section className="mt-20 md:mt-24">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("shipped.title")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("shipped.description")}
          </p>

          <ol className="relative mt-10 space-y-12">
            <div
              aria-hidden
              className="absolute bottom-2 left-2 top-2 w-px -translate-x-1/2 bg-border"
            />
            {releases.map((release, index) => (
              <li key={release.title} className="relative pl-10">
                <span
                  className={cn(
                    "absolute left-0 top-1 flex size-4 items-center justify-center rounded-full",
                    index === 0 ? "bg-destructive/20" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      index === 0 ? "bg-destructive" : "bg-muted-foreground"
                    )}
                  />
                </span>
                <time className="font-mono text-xs uppercase tracking-widest text-muted-foreground/80">
                  {release.date}
                </time>
                <h3 className="mt-2 text-lg font-semibold tracking-tight">
                  {release.title}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {release.description}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({
    locale,
  }));
}
