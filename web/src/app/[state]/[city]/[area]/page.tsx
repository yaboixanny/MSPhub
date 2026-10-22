import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CityDirectory } from "@/components/CityDirectory";
import { getArea, getAreaMsps, getAreas, getCities, getCity, topValues } from "@/lib/data";
import { toDirectory } from "@/lib/directory";
import { INDUSTRY_LABELS, label } from "@/lib/labels";

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
  return {
    title: `Managed IT Service Providers (MSPs) in ${area.name}, ${city.stateCode}`,
    description: `Compare ${area.count} verified managed service providers based in ${area.name}, ${city.stateCode}, ranked by the MSP Hub Score. Part of the ${city.name} metro.`,
    alternates: { canonical: `/${state}/${citySlug}/${areaSlug}` },
  };
}

export default async function AreaPage({ params }: PageProps<"/[state]/[city]/[area]">) {
  const { state, city: citySlug, area: areaSlug } = await params;
  const city = getCity(state, citySlug);
  const area = getArea(state, citySlug, areaSlug);
  if (!city || !area) notFound();

  const msps = getAreaMsps(state, citySlug, areaSlug);
  const industries = topValues(msps, "industries", 3);
  const others = getAreas(state, citySlug).filter((item) => item.hasPage && item.slug !== areaSlug);

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

      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        Managed IT Service Providers in {area.name}, {city.stateCode}
      </h1>
      <p className="mt-3 max-w-3xl leading-relaxed text-slate-600">
        {msps.length} verified MSPs are based in {area.name}, part of the {city.name} metro.
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
          compare all {city.count} {city.name}-area MSPs
        </Link>
        .
      </p>

      <section className="mt-8">
        <CityDirectory msps={toDirectory(msps)} hideLocation />
      </section>

      {others.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold">Other areas in the {city.name} metro</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {others.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/${state}/${citySlug}/${item.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 hover:border-brand-600 hover:text-brand-700"
                >
                  {item.name}
                  <span className="text-xs text-slate-400">{item.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
