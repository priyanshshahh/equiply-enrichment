import type { Kpis } from "../lib/dataEngine";
import { MAX_BUDGET_USD } from "../lib/openaiFallback";

type Card = {
  label: string;
  value: string;
  sub: string;
  accent: string;
};

export default function KpiCards({ kpis }: { kpis: Kpis }) {
  const cards: Card[] = [
    {
      label: "Total Assets Processed",
      value: kpis.totalAssets.toLocaleString(),
      sub: `${kpis.deviceTypeCount} device types`,
      accent: "text-brand-300",
    },
    {
      label: "Immediate Replacement",
      value: kpis.needsReplacement.toLocaleString(),
      sub: "End of life (>10 yrs)",
      accent: "text-rose-300",
    },
    {
      label: "Review Window",
      value: kpis.reviewSoon.toLocaleString(),
      sub: "Aging 7-10 yrs",
      accent: "text-amber-300",
    },
    {
      label: "Data Pipeline Confidence",
      value: `${kpis.confidenceRate.toFixed(1)}%`,
      sub: "Rows with a decoded date",
      accent: "text-emerald-300",
    },
    {
      label: "Token Efficiency",
      value: kpis.tokensUsed > 0 ? kpis.tokensUsed.toLocaleString() : "0",
      sub:
        kpis.tokensUsed > 0
          ? `${kpis.dedupeSavedPct.toFixed(0)}% tokens saved via dedupe · ~$${kpis.estimatedCostUsd.toFixed(4)} / $${MAX_BUDGET_USD}`
          : "Local rules only (0 LLM tokens)",
      accent: "text-violet-300",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-lg shadow-black/20"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{c.label}</p>
          <p className={`mt-2 text-3xl font-bold ${c.accent}`}>{c.value}</p>
          <p className="mt-1 text-xs text-slate-500">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
