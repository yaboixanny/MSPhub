import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Rating } from "@/components/Rating";
import { getAreas, getCoveredStates, getState, getStateMsps, getStates } from "@/lib/data";

// Static export: only the pages listed below exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getStates().map((state) => ({ state: state.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[state]">): Promise<Metadata> {
  const { state: slug } = await params;
  const state = getState(slug);
  if (!state) return {};
  return {
    title: `Managed IT Service Providers (MSPs) in ${state.name}`,
    description: state.count
      ? `Compare ${state.count} verified managed service providers across ${state.name}, by metro and town. Ranked by Google reviews.`
      : `MSP Hub is coming to ${state.name}. See which states and cities we cover today.`,
    alternates: { canonical: `/${slug}` },
    // States without listings yet are thin pages; keep them out of search results until they have data.
    ...(state.count ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function StatePage({ params }: PageProps<"/[state]">) {
  const { state: slug } = await params;
  const state = getState(slug);
  if (!state) notFound();

  const crumbs = [
    { name: "Home", href: "/" },
    { name: "United States", href: "/united-states" },
    { name: state.name, href: `/${slug}` },
  ];

  if (state.count === 0) {
    const live = getCoveredStates();
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Breadcrumbs items={crumbs} />
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">MSPs in {state.name}</h1>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8">
          <p className="text-lg font-semibold">{state.name} is coming soon</p>
          <p className="mt-2 leading-relaxed text-slate-600">
            We add one metro at a time and verify every MSP before it&apos;s listed, so we haven&apos;t reached{" "}
            {state.name} yet. In the meantime, here&apos;s where MSP Hub is live:
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {live.flatMap((item) =>
              item.cities.map((city) => (
                <li key={`${item.slug}/${city.slug}`}>
                  <Link
                    href={`/${item.slug}/${city.slug}`}
                    className="inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                  >
                    {city.name}, {city.stateCode} ({city.count} MSPs)
                  </Link>
                </li>
              )),
            )}
          </ul>
          <Link href="/united-states" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:underline">
            See all states
          </Link>
        </div>
      </div>
    );
  }

  const topRated = getStateMsps(slug).slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={crumbs} />
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        Managed IT Service Providers in {state.name}
      </h1>
      <p className="mt-3 max-w-3xl leading-relaxed text-slate-600">
        {state.count} verified MSPs across {state.cities.length}{" "}
        {state.cities.length === 1 ? "metro area" : "metro areas"} so far. Pick a metro or town to compare providers by
        Google reviews, services and the industries they serve.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Metro areas and towns</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {state.cities.map((city) => (
            <div key={city.slug} className="rounded-xl border border-slate-200 bg-white p-6">
              <Link href={`/${slug}/${city.slug}`} className="text-lg font-semibold hover:text-brand-600 hover:underline">
                {city.name} metro
              </Link>
              <p className="text-sm text-slate-500">{city.count} MSPs</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {getAreas(slug, city.slug).map((area) => (
                  <li key={area.slug}>
                    <Link
                      href={area.hasPage ? `/${slug}/${city.slug}/${area.slug}` : `/${slug}/${city.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:border-brand-600 hover:text-brand-700"
                    >
                      {area.name}
                      <span className="text-xs text-slate-400">{area.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Top-rated MSPs in {state.name}</h2>
        <ol className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {topRated.map((msp, index) => (
            <li key={msp.slug} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
              <span className="flex items-baseline gap-3">
                <span className="w-5 text-right text-sm font-semibold text-slate-400">{index + 1}</span>
                <Link href={`/msp/${msp.slug}`} className="font-medium hover:text-brand-600 hover:underline">
                  {msp.name}
                </Link>
                <span className="text-sm text-slate-500">{msp.town}</span>
              </span>
              <Rating rating={msp.rating} reviewCount={msp.reviewCount} size={13} />
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
