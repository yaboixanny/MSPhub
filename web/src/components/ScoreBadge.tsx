import Link from "next/link";

/** Compact MSP Hub Score, e.g. "82 /100 MSP Hub Score". Links to the method when linked. */
export function ScoreBadge({ score, linked = false }: { score: number; linked?: boolean }) {
  const tone =
    score >= 75 ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
    : score >= 50 ? "bg-brand-50 text-brand-700 ring-brand-100"
    : "bg-slate-100 text-slate-700 ring-slate-200";
  const badge = (
    <span className={`inline-flex items-baseline gap-1 rounded-full px-2.5 py-0.5 text-sm ring-1 ${tone}`}>
      <span className="font-semibold">{score}</span>
      <span className="text-xs opacity-70">/100</span>
      <span className="text-xs">MSP Hub Score</span>
    </span>
  );
  return linked ? (
    <Link href="/how-we-rank" className="hover:opacity-80" title="How the MSP Hub Score works">
      {badge}
    </Link>
  ) : (
    badge
  );
}
