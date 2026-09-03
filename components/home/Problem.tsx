import { useTranslations } from "next-intl";

type ProblemItem = {
  stat: string;
  statLabel: string;
  title: string;
  description: string;
};

const ProblemStat = ({ item }: { item: ProblemItem }) => {
  return (
    <article className="flex min-h-[228px] flex-col justify-between gap-6 px-6 py-8 sm:px-8 md:min-h-[260px] md:px-7 md:py-8 lg:px-10">
      <div>
        <p className="text-3xl font-semibold tracking-[-0.065em] text-foreground sm:text-4xl lg:text-5xl">
          {item.stat}
        </p>
        <p className="mt-3 font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-foreground/70">
          {item.statLabel}
        </p>
      </div>
      <div className="max-w-sm space-y-2">
        <h3 className="text-base font-semibold tracking-[-0.035em] text-foreground sm:text-lg">
          {item.title}
        </h3>
        <p className="text-sm leading-5 text-muted-foreground sm:leading-[1.4]">
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
    <section
      id="problem"
      className="problem-section relative w-full overflow-hidden md:before:pointer-events-none md:before:absolute md:before:inset-x-0 md:before:top-[128px] md:before:z-10 md:before:border-t md:before:border-border"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
          {items.map((item) => (
            <ProblemStat key={item.title} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
