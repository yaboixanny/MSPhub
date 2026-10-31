import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HowWePicked, LocationFaq, TopList } from "@/components/BestList";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CityDirectory } from "@/components/CityDirectory";
import { MarketNotes, marketNote } from "@/components/Insights";
import { JsonLd } from "@/components/JsonLd";
import { getAllMsps, getAreas, getCities, getCity, getCityMsps, topValues } from "@/lib/data";
import { toDirectory } from "@/lib/directory";
import { metroDifferences } from "@/lib/insights";
import { INDUSTRY_LABELS, label } from "@/lib/labels";
import { bestDescription, bestTitle, freshness, locationFaqs, topCount } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

// Static export: only the pages listed below exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getCities().map((city) => ({ state: city.state, city: city.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[state]/[city]">): Promise<Metadata> {
  const { state, city: citySlug } = await params;
  const city = getCity(state, citySlug);
  if (!city) return {};
  const place = `${city.name}, ${city.stateCode}`;
  const { year } = freshness(getCities());
  return {
    // Absolute: the "| MSP Hub" suffix would push the keyword title past what search results show.
    title: { absolute: bestTitle(place, city.count, year) },
    description: bestDescription(place, city.count, year),
    alternates: { canonical: `/${state}/${citySlug}` },
  };
}

export default async function CityPage({ params }: PageProps<"/[state]/[city]">) {
  const { state, city: citySlug } = await params;
  const city = getCity(state, citySlug);
  if (!city) notFound();
  const msps = getCityMsps(state, citySlug);
  const place = `${city.name}, ${city.stateCode}`;
  const updated = freshness(getCities());

  const founded = msps.filter((msp) => msp.foundedYear).map((msp) => msp.foundedYear!).sort((a, b) => a - b);
  const medianFounded = founded.length ? founded[Math.floor(founded.length / 2)] : null;
  const pricing = msps.filter((msp) => msp.pricing).length;
  const industries = topValues(msps, "industries", 4);
  const hipaa = msps.filter((msp) => msp.compliance.includes("HIPAA")).length;
  const cmmc = msps.filter((msp) => msp.compliance.includes("CMMC")).length;
  const nearby = city.areas.filter((area) => area !== city.name);
  const areas = getAreas(state, citySlug);
  const top = topCount(msps.length);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "United States", href: "/united-states" },
          { name: city.stateName, href: `/${state}` },
          { name: city.name, href: `/${state}/${citySlug}` },
        ]}
      />

      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Best MSPs in {place}</h1>
      <p className="mt-2 text-sm font-medium text-slate-500">
        {msps.length} managed IT service providers, ranked · Updated {updated.label}
      </p>
      <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">
        These are the best managed service providers (MSPs) in {city.name} and nearby{" "}
        {nearby.slice(0, -1).join(", ")} and {nearby.at(-1)}, ranked by the MSP Hub Score. We read each
        company&apos;s website to confirm it offers ongoing managed IT for businesses, not just computer repair or
        one-off projects. The most common specialties are{" "}
        {industries.map(([value, count], index) => (
          <span key={value}>
            {index > 0 && (index === industries.length - 1 ? " and " : ", ")}
            {label(INDUSTRY_LABELS, value).toLowerCase()} ({count})
          </span>
        ))}
        , and {hipaa} list HIPAA compliance support.
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Verified MSPs", msps.length.toString()],
          ["Typical founding year", medianFounded ? medianFounded.toString() : "n/a"],
          ["Publish their pricing", pricing.toString()],
          ["Support HIPAA / CMMC", `${hipaa} / ${cmmc}`],
        ].map(([term, value]) => (
          <div key={term} className="rounded-xl border border-slate-200 bg-white p-4">
            <dt className="text-xs font-medium text-slate-500">{term}</dt>
            <dd className="mt-1 text-2xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      {top > 0 && (
        <div className="mt-10">
          <TopList title={`Top ${top} MSPs in ${place}`} msps={msps.slice(0, top)} asOfYear={updated.year} />
          <HowWePicked updated={updated.label} />
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Best MSPs by area</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {areas.map((area) =>
            area.hasPage ? (
              <li key={area.slug}>
                <Link
                  href={`/${state}/${citySlug}/${area.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 hover:border-brand-600 hover:text-brand-700"
                >
                  Best MSPs in {area.name}
                  <span className="text-xs text-slate-400">{area.count}</span>
                </Link>
              </li>
            ) : (
              <li
                key={area.slug}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 px-3 py-1 text-sm text-slate-500"
              >
                {area.name}
                <span className="text-xs text-slate-400">{area.count}</span>
              </li>
            ),
          )}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-bold tracking-tight">All {msps.length} MSPs in {place}</h2>
        <CityDirectory msps={toDirectory(msps)} />
      </section>

      <MarketNotes
        place={place}
        differences={metroDifferences(place, msps, getAllMsps())}
        note={marketNote(state, citySlug, msps.length)}
      />

      <div className="mt-12">
        <LocationFaq place={place} faqs={locationFaqs(place, msps, areas)} />
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Best MSPs in ${place}`,
          numberOfItems: msps.length,
          itemListElement: msps.map((msp, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${SITE_URL}/msp/${msp.slug}`,
            name: msp.name,
          })),
        }}
      />
    </div>
  );
}
