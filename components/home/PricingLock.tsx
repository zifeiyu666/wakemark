import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import FeatureBadge from "@/components/shared/FeatureBadge";
import { Link as I18nLink } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Check, Medal, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

type TierStatus = "soldout" | "active" | "upnext";

type Tier = {
  id: string;
  name: string;
  price: string;
  period: string;
  discount: string;
  discountTone: "tint" | "outline";
  monthly: string;
  status: TierStatus;
  statusLabel: string;
  medal: boolean;
  remaining?: string;
  progress?: number;
  cta?: string;
};

type ChartCopy = {
  title: string;
  axisLabel: string;
  lockedLabel: string;
  footnote: string;
  yTicks: number[];
};

/* Chart plot geometry (viewBox 760x310) */
const PLOT = { left: 80, right: 740, top: 20, bottom: 260, min: 40, max: 100 };

const TimelineTrack = ({ status }: { status: TierStatus }) => {
  if (status === "soldout") {
    return (
      <div className="hidden items-center gap-2 md:flex">
        <span className="size-2.5 rounded-full bg-foreground/60" />
        <span className="h-px flex-1 bg-foreground/60" />
      </div>
    );
  }
  if (status === "active") {
    return (
      <div className="hidden items-center gap-2 md:flex">
        <span className="h-px flex-1 bg-foreground/60" />
        <span className="size-3.5 rounded-full bg-highlight" />
      </div>
    );
  }
  return (
    <div className="hidden items-center gap-2 md:flex">
      <span className="flex-1 border-t border-dashed border-border" />
      <span className="size-2.5 rounded-full border border-border bg-background" />
    </div>
  );
};

const DiscountBadge = ({ tier }: { tier: Tier }) => (
  <Badge
    className={cn(
      "rounded-sm",
      tier.discountTone === "tint"
        ? "border-transparent bg-highlight/15 text-highlight"
        : "border-border bg-transparent text-muted-foreground"
    )}
  >
    {tier.discount}
  </Badge>
);

const InactiveTier = ({ tier }: { tier: Tier }) => (
  <div className="flex flex-col gap-3 opacity-50">
    <div className="flex items-center justify-between gap-2">
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {tier.medal && <Medal className="size-3.5" />}
        {tier.name}
      </p>
      <Badge variant="outline" className="text-muted-foreground">
        {tier.statusLabel}
      </Badge>
    </div>
    <div className="flex items-center gap-3">
      <p className="font-serif text-3xl font-bold tracking-tight text-foreground">
        {tier.price}
        <span className="ml-1 font-sans text-sm font-normal text-muted-foreground">
          {tier.period}
        </span>
      </p>
      <DiscountBadge tier={tier} />
    </div>
    <p className="text-sm text-muted-foreground">{tier.monthly}</p>
  </div>
);

const ActiveTierCard = ({ tier }: { tier: Tier }) => (
  <div className="flex flex-col gap-6 rounded-xl bg-foreground p-6 text-background shadow-md">
    <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-background/70">
      {tier.medal && <Medal className="size-3.5" />}
      {tier.name}
    </p>
    <div>
      <div className="flex items-center gap-3">
        <p className="font-serif text-5xl font-bold tracking-tight">
          {tier.price}
          <span className="ml-1 font-sans text-sm font-normal text-background/60">
            {tier.period}
          </span>
        </p>
        <Badge className="rounded-sm border-transparent bg-highlight-inverse/20 text-highlight-inverse">
          {tier.discount}
        </Badge>
      </div>
      <p className="mt-2 text-sm text-background/60">{tier.monthly}</p>
    </div>
    <div className="flex flex-col gap-2">
      <div className="h-1 overflow-hidden rounded-full bg-background/20">
        <div
          className="h-full rounded-full bg-highlight-inverse"
          style={{ width: `${tier.progress ?? 0}%` }}
        />
      </div>
      <p className="text-sm font-medium text-highlight-inverse">{tier.remaining}</p>
    </div>
    <Button
      asChild
      size="lg"
      className="w-full bg-highlight-inverse text-background hover:bg-highlight-inverse/90"
    >
      <I18nLink href="/#pricing">{tier.cta}</I18nLink>
    </Button>
  </div>
);

const PriceChart = ({ tiers, chart }: { tiers: Tier[]; chart: ChartCopy }) => {
  const prices = tiers.map((tier) => Number(tier.price.replace(/[^0-9.]/g, "")));
  const count = prices.length;
  const xAt = (i: number) => PLOT.left + (i * (PLOT.right - PLOT.left)) / (count - 1);
  const yAt = (price: number) =>
    PLOT.bottom -
    ((price - PLOT.min) / (PLOT.max - PLOT.min)) * (PLOT.bottom - PLOT.top);

  // Locked-price marker anchors at the first tier (Founders)
  const lockedIndex = 0;
  const activeX = xAt(lockedIndex);
  const activeY = yAt(prices[lockedIndex]);
  // Keep the 166-wide label pill inside the viewBox when anchored at the left edge
  const labelX = Math.min(Math.max(activeX, 83), 760 - 83);
  const linePath = prices
    .map((price, i) => `${i === 0 ? "M" : "L"}${xAt(i)},${yAt(price)}`)
    .join(" ");
  const areaPath = `${linePath} L${xAt(count - 1)},${PLOT.bottom} L${xAt(0)},${PLOT.bottom} Z`;
  const axisMidY = (PLOT.top + PLOT.bottom) / 2;

  return (
    <svg viewBox="0 0 760 310" className="h-auto w-full" role="img" aria-label={chart.title}>
      <defs>
        <linearGradient id="pricing-lock-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {chart.yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={PLOT.left}
            x2={PLOT.right}
            y1={yAt(tick)}
            y2={yAt(tick)}
            className="stroke-current"
            strokeOpacity="0.14"
            strokeDasharray="2 6"
          />
          <text
            x={PLOT.left - 12}
            y={yAt(tick)}
            textAnchor="end"
            dominantBaseline="central"
            fontSize="12"
            className="fill-current"
            fillOpacity="0.55"
          >
            {`$${tick}`}
          </text>
        </g>
      ))}

      <text
        x={24}
        y={axisMidY}
        fontSize="11"
        letterSpacing="0.2em"
        textAnchor="middle"
        className="fill-current uppercase"
        fillOpacity="0.55"
        transform={`rotate(-90 24 ${axisMidY})`}
      >
        {chart.axisLabel}
      </text>

      <line
        x1={activeX}
        x2={activeX}
        y1={PLOT.top}
        y2={PLOT.bottom}
        className="stroke-current"
        strokeOpacity="0.3"
        strokeDasharray="3 6"
      />

      <path d={areaPath} fill="url(#pricing-lock-area)" />
      <path
        d={linePath}
        fill="none"
        className="stroke-current"
        strokeOpacity="0.8"
        strokeWidth="1.5"
      />

      {prices.map((price, i) => {
        if (i === lockedIndex) return null;
        return tiers[i].status === "upnext" ? (
          <circle
            key={tiers[i].id}
            cx={xAt(i)}
            cy={yAt(price)}
            r="4"
            fill="none"
            className="stroke-current"
            strokeOpacity="0.5"
            strokeWidth="1.5"
          />
        ) : (
          <circle
            key={tiers[i].id}
            cx={xAt(i)}
            cy={yAt(price)}
            r="4"
            className="fill-current"
            fillOpacity="0.5"
          />
        );
      })}

      <circle cx={activeX} cy={activeY} r="15" className="fill-highlight-inverse" fillOpacity="0.35" />
      <circle cx={activeX} cy={activeY} r="7" className="fill-highlight-inverse" />

      <g>
        <rect
          x={labelX - 83}
          y={activeY - 58}
          width="166"
          height="32"
          rx="16"
          className="fill-background"
        />
        <text
          x={labelX}
          y={activeY - 42}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="12"
          fontWeight="600"
          className="fill-foreground"
        >
          {chart.lockedLabel}
        </text>
      </g>

      {tiers.map((tier, i) => (
        <text
          key={tier.id}
          x={xAt(i)}
          y={292}
          fontSize="13"
          className="fill-current"
          fillOpacity="0.6"
          textAnchor={i === 0 ? "start" : i === count - 1 ? "end" : "middle"}
        >
          {tier.name}
        </text>
      ))}
    </svg>
  );
};

export default function PricingLock() {
  const t = useTranslations("Landing.PricingLock");
  const tiers = t.raw("tiers") as Tier[];
  const chart = t.raw("chart") as ChartCopy;
  const included = t.raw("included") as string[];

  return (
    <section id="pricing" className="w-full">
      <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-16 sm:px-6 md:gap-20 md:py-24 lg:px-8">
        <header className="text-center">
          <FeatureBadge
            label={t("eyebrow")}
            text={t("note")}
            className="mb-8"
          />
          <h2 className="text-center z-10 text-lg md:text-5xl font-sans font-semibold mb-4">
            <span className="title-gradient">{t("title")}</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {t("description")}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-8">
          {tiers.map((tier) => (
            <div key={tier.id} className="flex flex-col gap-6">
              <TimelineTrack status={tier.status} />
              {tier.status === "active" ? (
                <ActiveTierCard tier={tier} />
              ) : (
                <InactiveTier tier={tier} />
              )}
            </div>
          ))}
        </div>

        <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 rounded-xl bg-foreground p-6 text-background shadow-md md:gap-12 md:p-12">
          <h3 className="text-center font-serif text-xl text-background/80 md:text-2xl">
            {chart.title}
          </h3>
          <PriceChart tiers={tiers} chart={chart} />
          <p className="text-center text-sm text-background/70 md:text-base">
            {chart.footnote}
          </p>
        </div>

        <div className="flex flex-col gap-8">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {t("includedLabel")}
          </p>
          <ul className="mx-auto grid max-w-3xl grid-cols-1 gap-x-12 gap-y-4 md:grid-cols-2">
            {included.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 text-sm text-foreground md:text-base"
              >
                <Check className="size-4 shrink-0 text-muted-foreground" />
                {item}
              </li>
            ))}
          </ul>
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4" />
            {t("trial")}
          </p>
        </div>
      </div>
    </section>
  );
}
