import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

type Release = {
  date: string;
  title: string;
  description: string;
};

export default function Changelog() {
  const t = useTranslations("Roadmap");

  const releases: Release[] = t.raw("releases");
  const latest = releases.slice(0, 4);

  return (
    <section className="changelog-section overflow-hidden pt-15 md:pt-20">
      <div className="px-5 sm:px-10 lg:px-20">
        <div className="max-w-4xl">
          <p className="inline-flex rounded-lg bg-[#eaf0ff] px-2 py-1 text-sm font-medium text-[#3467d6]">
            {t("home.eyebrow")}
          </p>
          <h2 className="mt-7 text-2xl font-medium leading-[1.1] tracking-tight md:text-4xl">
            <span className="text-foreground">{t("home.title")}</span>{" "}
            <span className="text-muted-foreground">{t("home.subtitle")}</span>
          </h2>

          <Link
            href="/roadmap"
            className="mt-8 inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm  text-foreground transition-colors hover:border-foreground/30 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-px"
          >
            {t("home.viewAll")}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="changelog-timeline mt-10 md:mt-16">
          <span aria-hidden className="changelog-ticks changelog-ticks-edge" />
          <div className="changelog-release-grid grid grid-cols-1 border-b border-border/80 md:grid-cols-2 lg:grid-cols-4">
            {latest.map((release) => (
              <Link
                key={release.title}
                href="/roadmap"
                className="group relative flex min-h-72 flex-col overflow-hidden border-b border-border/80 px-8 pb-20 pt-8 outline-none transition-colors last:border-b-0 hover:bg-muted/30 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset md:min-h-80 md:border-b-0 md:border-l lg:min-h-[21.5rem]"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 hidden w-px bg-slate-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 md:block"
                />
                <time className="text-sm font-medium text-muted-foreground">
                  {release.date}
                </time>
                <div className="mt-5 max-w-72">
                  <h3 className="text-xl  leading-tight tracking-tight text-foreground md:text-[1.35rem]">
                    {release.title}
                  </h3>
                  <p className="mt-2 text-base leading-snug text-muted-foreground md:text-[1.05rem]">
                    {release.description}
                  </p>
                </div>
                <span aria-hidden className="changelog-ticks" />
              </Link>
            ))}
          </div>
          <span aria-hidden className="changelog-ticks changelog-ticks-edge" />
        </div>
      </div>
    </section>
  );
}
