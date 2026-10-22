import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Rating } from "@/components/Rating";
import { getAllMsps, getState, getStates } from "@/lib/data";

export function generateStaticParams() {
  return getStates().map((state) => ({ state: state.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[state]">): Promise<Metadata> {
  const { state: slug } = await params;
  const state = getState(slug);
  if (!state) return {};
  return {
    title: `Managed IT Service Providers (MSPs) in ${state.name}`,
    description: `Find verified managed service providers across ${state.name}, by city. Compare MSPs by Google reviews, services and industries served.`,
    alternates: { canonical: `/${slug}` },
  };
}

// Read params inside Suspense so navigations to pages outside
// generateStaticParams can still render instantly.
export default function StatePage({ params }: PageProps<"/[state]">) {
  return (
    <Suspense fallback={null}>
      <StateContent params={params} />
    </Suspense>
  );
}

async function StateContent({ params }: Pick<PageProps<"/[state]">, "params">) {
  const { state: slug } = await params;
  const state = getState(slug);
  if (!state) notFound();
  const topRated = getAllMsps().filter((msp) => msp.state === slug).slice(0, 10);
  const total = state.cities.reduce((sum, city) => sum + city.count, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: state.name, href: `/${slug}` }]} />
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        Managed IT Service Providers in {state.name}
      </h1>
      <p className="mt-3 max-w-3xl leading-relaxed text-slate-600">
        {total} verified MSPs across {state.cities.length} {state.cities.length === 1 ? "city" : "cities"} so far.
        Pick a city to compare providers by Google reviews, services and the industries they serve.
      </p>

      <h2 className="mt-10 text-xl font-semibold">Cities</h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {state.cities.map((city) => (
          <li key={city.slug}>
            <Link
              href={`/${slug}/${city.slug}`}
              className="block rounded-xl border border-slate-200 bg-white p-5 hover:border-brand-600/40 hover:shadow-sm"
            >
              <span className="text-lg font-semibold">{city.name}</span>
              <span className="mt-1 block text-sm text-slate-500">
                {city.count} MSPs · includes {city.areas.slice(1, 4).join(", ")} and more
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-12 text-xl font-semibold">Top-rated MSPs in {state.name}</h2>
      <ol className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {topRated.map((msp, index) => (
          <li key={msp.slug} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
            <span className="flex items-baseline gap-3">
              <span className="w-5 text-right text-sm text-slate-400">{index + 1}</span>
              <Link href={`/msp/${msp.slug}`} className="font-medium hover:text-brand-600 hover:underline">
                {msp.name}
              </Link>
              <span className="text-sm text-slate-500">{msp.town}</span>
            </span>
            <Rating rating={msp.rating} reviewCount={msp.reviewCount} size={13} />
          </li>
        ))}
      </ol>
    </div>
  );
}
