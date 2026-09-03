"use client";

import PricingLockCTA from "@/components/home/PricingLockCTA";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, ChevronRight, Medal } from "lucide-react";
import { useState } from "react";

export type InteractiveTier = {
  id: string;
  name: string;
  price: string;
  period: string;
  discount: string;
  discountTone: "tint" | "outline";
  monthly: string;
  status: "soldout" | "active" | "upnext";
  statusLabel: string;
  medal: boolean;
  remaining?: string;
  progress?: number;
  cta?: string;
  amount: number;
  plan?: unknown;
};

type ChartCopy = {
  title: string;
  axisLabel: string;
  lockedLabel: string;
  footnote: string;
};

type Props = {
  tiers: InteractiveTier[];
  chart: ChartCopy;
  included: string[];
  includedLabel: string;
  trial: string;
};

const PLOT = { left: 72, right: 928, top: 72, bottom: 246 };

const DiscountBadge = ({ tier }: { tier: InteractiveTier }) => (
  <Badge
    className={cn(
      "rounded-md border px-2 py-0.5 text-xs font-semibold",
      tier.discountTone === "tint"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-neutral-200 bg-neutral-50 text-neutral-400"
    )}
  >
    {tier.discount}
  </Badge>
);

const PricingCard = ({
  tier,
  selected,
  onSelect,
}: {
  tier: InteractiveTier;
  selected: boolean;
  onSelect: () => void;
}) => {
  const plan = tier.plan as Parameters<typeof PricingLockCTA>[0]["plan"] | undefined;
  const isAvailable = tier.status === "active";

  return (
    <div
      className={cn(
        "relative flex min-h-[306px] cursor-pointer flex-col justify-between border-r border-neutral-100 px-5 py-7 transition-all duration-300 last:border-r-0 md:px-7",
        selected
          ? "z-10 -my-3 rounded-xl border border-neutral-200 bg-white py-10 opacity-100 ring-1 ring-neutral-900/10 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_20px_rgba(0,0,0,0.05)]"
          : "opacity-65 hover:opacity-100"
      )}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect();
      }}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <p
            className={cn(
              "flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]",
              selected ? "text-neutral-900" : "text-neutral-500"
            )}
          >
            {tier.medal && <Medal className="size-3.5" />}
            {tier.name}
          </p>
          <DiscountBadge tier={tier} />
        </div>

        <div className="mt-7 flex items-baseline gap-2">
          <p
            className={cn(
              "font-serif text-5xl font-bold tracking-tight",
              selected ? "text-neutral-900" : "text-neutral-600"
            )}
          >
            {tier.price}
          </p>
          <span className="text-sm text-neutral-400">{tier.period}</span>
        </div>
        <p className="mt-1 text-sm text-neutral-400">{tier.monthly}</p>
      </div>

      <div className="mt-8">
        {selected && isAvailable ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">{tier.remaining}</span>
              <span className="font-semibold text-neutral-900">{tier.progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-neutral-900 transition-[width] duration-500"
                style={{ width: `${tier.progress ?? 0}%` }}
              />
            </div>
            {plan ? (
              <PricingLockCTA plan={plan} label={tier.cta ?? "Get started"} />
            ) : (
              <Button
                size="lg"
                className="h-12 w-full rounded-lg bg-neutral-900 text-white hover:bg-neutral-800"
              >
                {tier.cta ?? "Get started"}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between text-sm text-neutral-400">
            <span>{tier.statusLabel}</span>
            <ChevronRight className="size-4" />
          </div>
        )}
      </div>
    </div>
  );
};

const PriceChart = ({
  tiers,
  chart,
  selectedIndex,
  onSelect,
}: {
  tiers: InteractiveTier[];
  chart: ChartCopy;
  selectedIndex: number;
  onSelect: (index: number) => void;
}) => {
  const prices = tiers.map((tier) => tier.amount);
  if (prices.length < 2) return null;

  const lo = Math.max(0, Math.floor((Math.min(...prices) - 15) / 5) * 5);
  const hi = Math.max(lo + 5, Math.ceil((Math.max(...prices) + 1) / 5) * 5);
  const xAt = (index: number) =>
    PLOT.left + (index * (PLOT.right - PLOT.left)) / (prices.length - 1);
  const yAt = (price: number) =>
    PLOT.bottom - ((price - lo) / (hi - lo)) * (PLOT.bottom - PLOT.top);
  const selectedX = xAt(selectedIndex);
  const selectedY = yAt(prices[selectedIndex]);
  const linePath = prices
    .map((price, index) => `${index === 0 ? "M" : "L"}${xAt(index)},${yAt(price)}`)
    .join(" ");
  const areaPath = `${linePath} L${xAt(prices.length - 1)},${PLOT.bottom} L${xAt(0)},${PLOT.bottom} Z`;
  const ticks = Array.from({ length: 4 }, (_, index) =>
    Math.round(lo + ((hi - lo) / 3) * index)
  );

  return (
    <div className="border-t border-neutral-100 bg-neutral-50/50 px-5 py-6 md:px-8 md:py-7">
      <div className="mb-3 flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.14em]">
        <span className="text-neutral-700">{chart.title}</span>
        <span className="normal-case tracking-normal text-neutral-400">
          Guaranteed grandfathered rate
        </span>
      </div>
      <svg
        viewBox="0 0 1000 330"
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={chart.title}
      >
        <defs>
          <linearGradient id="pricing-lock-area-light" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#17181b" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#17181b" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PLOT.left}
              x2={PLOT.right}
              y1={yAt(tick)}
              y2={yAt(tick)}
              stroke="#d4d4d8"
              strokeDasharray="5 8"
            />
            <text x={PLOT.left - 12} y={yAt(tick)} textAnchor="end" dominantBaseline="central" fontSize="12" fill="#a1a1aa">
              ${tick}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#pricing-lock-area-light)" />
        <path d={linePath} fill="none" stroke="#17181b" strokeWidth="2.5" />

        {tiers.map((tier, index) => {
          const x = xAt(index);
          const y = yAt(tier.amount);
          const isSelected = index === selectedIndex;
          return (
            <g
              key={tier.id}
              className="cursor-pointer"
              onClick={() => onSelect(index)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onSelect(index);
              }}
              role="button"
              tabIndex={0}
            >
              {isSelected && <circle cx={x} cy={y} r="12" fill="#17181b" fillOpacity="0.08" />}
              <circle cx={x} cy={y} r={isSelected ? 6 : 5} fill={isSelected ? "#17181b" : "white"} stroke="#17181b" strokeWidth="2" />
              <text x={x} y="292" textAnchor="middle" fontSize="13" fontWeight={isSelected ? "600" : "500"} fill={isSelected ? "#17181b" : "#a1a1aa"}>
                {tier.name}
              </text>
            </g>
          );
        })}

        <g transform={`translate(${Math.min(Math.max(selectedX - 105, 8), 784)},${Math.max(selectedY - 57, 8)})`}>
          <rect width="210" height="34" rx="9" fill="white" stroke="#e4e4e7" />
          <circle cx="16" cy="17" r="4" fill="#10b981" />
          <text x="28" y="21" fontSize="12" fontWeight="600" fill="#17181b">
            {`Your price (${tiers[selectedIndex].price}/yr locked)`}
          </text>
        </g>
      </svg>
      <p className="mt-1 text-center text-xs text-neutral-400">{chart.footnote}</p>
    </div>
  );
};

export default function PricingLockInteractive({
  tiers,
  chart,
  included,
  includedLabel,
  trial,
}: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02),0_10px_32px_rgba(0,0,0,0.04)]">
      <div className="grid grid-cols-1 md:grid-cols-4">
        {tiers.map((tier, index) => (
          <PricingCard
            key={tier.id}
            tier={tier}
            selected={selectedIndex === index}
            onSelect={() => setSelectedIndex(index)}
          />
        ))}
      </div>
      <PriceChart
        tiers={tiers}
        chart={chart}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
      />
      <div className="border-t border-neutral-100 px-5 py-7 md:px-8">
        <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
          {includedLabel}
        </p>
        <ul className="mx-auto grid max-w-5xl grid-cols-1 gap-x-10 gap-y-3 md:grid-cols-2">
          {included.map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-neutral-600 md:text-base">
              <Check className="size-4 shrink-0 text-neutral-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-7 text-center text-sm text-neutral-400">{trial}</p>
      </div>
    </div>
  );
}
