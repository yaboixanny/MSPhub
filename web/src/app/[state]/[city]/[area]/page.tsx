import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HowWePicked, LocationFaq, TopList } from "@/components/BestList";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CityDirectory } from "@/components/CityDirectory";
import { JsonLd } from "@/components/JsonLd";
import { getArea, getAreaMsps, getAreas, getCities, getCity, topValues } from "@/lib/data";
import { toDirectory } from "@/lib/directory";
import { INDUSTRY_LABELS, label } from "@/lib/labels";
import { bestDescription, bestTitle, freshness, locationFaqs, topCount } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

// Static export: only the pages listed below exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getCities().flatMap((city) =>
    getAreas(city.state, city.slug)
      .filter((area) => area.hasPage)
      .map((area) => ({ state: city.state, city: city.slug, area: area.slug })),
  );
}

export async function generateMetadata({ params }: PageProps<"/[state]/[city]/[area]">): Promise<Metadata> {
  const { state, city: citySlug, area: areaSlug } = await params;
  const city = getCity(state, citySlug);
  const area = getArea(state, citySlug, areaSlug);
  if (!city || !area) return {};
  const place = `${area.name}, ${city.stateCode}`;
  const { year } = freshness(getCities());
  return {
    title: { absolute: bestTitle(place, area.count, year) },
    description: bestDescription(place, area.count, year),
    alternates: { canonical: `/${state}/${citySlug}/${areaSlug}` },
  };
}

export default async function AreaPage({ params }: PageProps<"/[state]/[city]/[area]">) {
  const { state, city: citySlug, area: areaSlug } = await params;
  const city = getCity(state, citySlug);
  const area = getArea(state, citySlug, areaSlug);
  if (!city || !area) notFound();

  const msps = getAreaMsps(state, citySlug, areaSlug);
  const place = `${area.name}, ${city.stateCode}`;
  const updated = freshness(getCities());
  const industries = topValues(msps, "industries", 3);
  const others = getAreas(state, citySlug).filter((item) => item.hasPage && item.slug !== areaSlug);
  const top = topCount(msps.length);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "United States", href: "/united-states" },
          { name: city.stateName, href: `/${state}` },
          { name: `${city.name} metro`, href: `/${state}/${citySlug}` },
          { name: area.name, href: `/${state}/${citySlug}/${areaSlug}` },
        ]}
      />

      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Best MSPs in {place}</h1>
      <p className="mt-2 text-sm font-medium text-slate-500">
        {msps.length} managed IT service providers, ranked · Updated {updated.label}
      </p>
      <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">
        The best managed service providers based in {area.name}, part of the {city.name} metro, ranked by the MSP Hub
        Score.
        {industries.length > 0 && (
          <>
            {" "}Common specialties here include{" "}
            {industries.map(([value], index) => (
              <span key={value}>
                {index > 0 && (index === industries.length - 1 ? " and " : ", ")}
                {label(INDUSTRY_LABELS, value).toLowerCase()}
              </span>
            ))}
            .
          </>
        )}{" "}
        Most MSPs serve the whole metro, so you can also{" "}
        <Link href={`/${state}/${citySlug}`} className="text-brand-600 hover:underline">
          see the best MSPs in {city.name}
        </Link>
        .
      </p>

      {top > 0 && (
        <div className="mt-10">
          <TopList title={`Top ${top} MSPs in ${place}`} msps={msps.slice(0, top)} asOfYear={updated.year} />
          <HowWePicked updated={updated.label} />
        </div>
      )}

      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-bold tracking-tight">All {msps.length} MSPs in {place}</h2>
        <CityDirectory msps={toDirectory(msps)} hideLocation />
        {top === 0 && <HowWePicked updated={updated.label} />}
      </section>

      <div className="mt-12">
        <LocationFaq place={place} faqs={locationFaqs(place, msps)} />
      </div>

      {others.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold">Best MSPs in other {city.name}-area towns</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {others.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/${state}/${citySlug}/${item.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 hover:border-brand-600 hover:text-brand-700"
                >
                  Best MSPs in {item.name}
                  <span className="text-xs text-slate-400">{item.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

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
