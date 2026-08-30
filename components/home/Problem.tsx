import { useTranslations } from "next-intl";

type ProblemItem = {
  stat: string;
  statLabel: string;
  title: string;
  description: string;
};

const ProblemStat = ({ item }: { item: ProblemItem }) => {
  return (
    <article className="flex flex-col gap-8 py-12 md:py-16 md:px-10 md:first:pl-0 md:last:pr-0">
      <div>
        <p className="font-serif text-5xl md:text-6xl font-bold tracking-tight text-foreground">
          {item.stat}
        </p>
        <p className="mt-4 text-xs md:text-sm font-medium uppercase tracking-widest text-muted-foreground">
          {item.statLabel}
        </p>
      </div>
      <div className="space-y-3">
        <h3 className="font-serif text-xl md:text-2xl font-bold tracking-tight text-foreground">
          {item.title}
        </h3>
        <p className="text-sm leading-4.5 md:text-base md:leading-5.5 text-muted-foreground">
          {item.description}
        </p>
      </div>
    </article>
  );
};

export default function Problem() {
  const t = useTranslations("Landing.Problem");

  const items: ProblemItem[] = t.raw("items").map((item: ProblemItem) => ({
    stat: item.stat,
    statLabel: item.statLabel,
    title: item.title,
    description: item.description,
  }));

  return (
    <section id="problem" className="w-full bg-muted">
      <div className="container mx-auto">
        <p className="pt-16 md:pt-24 pb-6 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {t("label")}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border border-y border-border">
          {items.map((item) => (
            <ProblemStat key={item.title} item={item} />
          ))}
        </div>
        <div className="pb-16 md:pb-24" />
      </div>
    </section>
  );
}
