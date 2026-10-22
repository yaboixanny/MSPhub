import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CityDirectory } from "@/components/CityDirectory";
import { JsonLd } from "@/components/JsonLd";
import { getAreas, getCities, getCity, getCityMsps, topValues } from "@/lib/data";
import { toDirectory } from "@/lib/directory";
import { SITE_URL } from "@/lib/site";
import { INDUSTRY_LABELS, label } from "@/lib/labels";

// Static export: only the pages listed below exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getCities().map((city) => ({ state: city.state, city: city.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[state]/[city]">): Promise<Metadata> {
  const { state, city: citySlug } = await params;
  const city = getCity(state, citySlug);
  if (!city) return {};
  return {
    title: `Best Managed IT Service Providers (MSPs) in ${city.name}, ${city.stateCode}`,
    description: `Compare ${city.count} verified managed service providers in ${city.name}, ${city.stateCode}, ranked by the MSP Hub Score, with services, industries, compliance support and live Google reviews for each MSP.`,
    alternates: { canonical: `/${state}/${citySlug}` },
  };
}

export default async function CityPage({ params }: PageProps<"/[state]/[city]">) {
  const { state, city: citySlug } = await params;
  const city = getCity(state, citySlug);
  if (!city) notFound();
  const msps = getCityMsps(state, citySlug);

  const founded = msps.filter((msp) => msp.foundedYear).map((msp) => msp.foundedYear!).sort((a, b) => a - b);
  const medianFounded = founded.length ? founded[Math.floor(founded.length / 2)] : null;
  const pricing = msps.filter((msp) => msp.pricing).length;
  const industries = topValues(msps, "industries", 4);
  const hipaa = msps.filter((msp) => msp.compliance.includes("HIPAA")).length;
  const cmmc = msps.filter((msp) => msp.compliance.includes("CMMC")).length;
  const nearby = city.areas.filter((area) => area !== city.name);

  const areas = getAreas(state, citySlug);

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

      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        Managed IT Service Providers in {city.name}, {city.stateCode}
      </h1>
      <p className="mt-3 max-w-3xl leading-relaxed text-slate-600">
        We found {msps.length} managed service providers (MSPs) in {city.name} and nearby{" "}
        {nearby.slice(0, -1).join(", ")} and {nearby.at(-1)}. We read each company&apos;s website to confirm it
        offers ongoing managed IT for businesses, not just computer repair or one-off projects. The most common
        specialties are{" "}
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

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Browse by area</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {areas.map((area) =>
            area.hasPage ? (
              <li key={area.slug}>
                <Link
                  href={`/${state}/${citySlug}/${area.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 hover:border-brand-600 hover:text-brand-700"
                >
                  {area.name}
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

      <section className="mt-8">
        <CityDirectory msps={toDirectory(msps)} />
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="text-xl font-semibold">How this list is ranked</h2>
        <p className="mt-2 leading-relaxed text-slate-600">
          The list is sorted by the MSP Hub Score, a 0-100 score based on what each provider documents publicly: years
          in business, managed services offered, compliance support, industries served and pricing transparency. It
          isn&apos;t a quality rating, so open a profile to see that provider&apos;s live Google reviews.{" "}
          <Link href="/how-we-rank" className="text-brand-600 hover:underline">
            Read how we rank MSPs
          </Link>
          .
        </p>
        <p className="mt-3 text-sm text-slate-500">Last updated {city.updated}.</p>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Managed IT service providers in ${city.name}, ${city.stateCode}`,
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
