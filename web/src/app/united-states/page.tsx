import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ScoreBadge } from "@/components/ScoreBadge";
import { getAllMsps, getCities, getCoveredStates, getStates, placeName } from "@/lib/data";
import { bestDescription, bestTitle, freshness } from "@/lib/seo";

export function generateMetadata(): Metadata {
  const { year } = freshness(getCities());
  const count = getAllMsps().length;
  return {
    // "the US" keeps the title short enough to show in full in search results.
    title: { absolute: bestTitle("the US", count, year) },
    description: bestDescription("the United States", count, year),
    alternates: { canonical: "/united-states" },
  };
}

export default function UnitedStatesPage() {
  const states = getStates();
  const covered = getCoveredStates();
  const msps = getAllMsps();
  const topScored = msps.slice(0, 25);
  const updated = freshness(getCities());

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "United States", href: "/united-states" }]} />
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Best MSPs in the United States</h1>
      <p className="mt-2 text-sm font-medium text-slate-500">
        {msps.length} managed IT service providers, ranked · Updated {updated.label}
      </p>
      <p className="mt-3 max-w-3xl leading-relaxed text-slate-600">
        {msps.length} verified MSPs so far, across {covered.length} {covered.length === 1 ? "state" : "states"}. We
        build MSP Hub one metro at a time and verify every listing against the company&apos;s own website, so coverage
        grows city by city.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Browse by state</h2>
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {states.map((state) => {
            const live = state.count > 0;
            return (
              <li key={state.slug}>
                <Link
                  href={`/${state.slug}`}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
                    live
                      ? "border-brand-600/30 bg-white font-medium text-slate-900 hover:border-brand-600 hover:shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                  }`}
                >
                  <span>{state.name}</span>
                  {live ? (
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                      {state.count}
                    </span>
                  ) : (
                    <span className="text-xs">Soon</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Top 25 MSPs nationwide</h2>
        <p className="mt-1 text-sm text-slate-600">
          Ranked by MSP Hub Score. <Link href="/how-we-rank" className="text-brand-600 hover:underline">How we rank</Link>
        </p>
        <ol className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {topScored.map((msp, index) => {
            return (
              <li key={msp.slug} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5">
                <span className="flex min-w-0 items-baseline gap-3">
                  <span className="w-6 shrink-0 text-right text-sm font-semibold text-slate-400">{index + 1}</span>
                  <Link href={`/msp/${msp.slug}`} className="font-medium hover:text-brand-600 hover:underline">
                    {msp.name}
                  </Link>
                  <span className="truncate text-sm text-slate-500">
                    {placeName(msp)}
                  </span>
                </span>
                <ScoreBadge score={msp.score.total} />
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
