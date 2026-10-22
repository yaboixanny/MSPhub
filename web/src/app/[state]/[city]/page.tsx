import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CityDirectory, type DirectoryMsp } from "@/components/CityDirectory";
import { JsonLd } from "@/components/JsonLd";
import { getCities, getCity, getCityMsps, topValues } from "@/lib/data";
import { INDUSTRY_LABELS, label } from "@/lib/labels";

export function generateStaticParams() {
  return getCities().map((city) => ({ state: city.state, city: city.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[state]/[city]">): Promise<Metadata> {
  const { state, city: citySlug } = await params;
  const city = getCity(state, citySlug);
  if (!city) return {};
  return {
    title: `Best Managed IT Service Providers (MSPs) in ${city.name}, ${city.stateCode}`,
    description: `Compare ${city.count} verified managed service providers in ${city.name}, ${city.stateCode}. Ranked by Google reviews, with services, industries and compliance support for each MSP.`,
    alternates: { canonical: `/${state}/${citySlug}` },
  };
}

// Read params inside Suspense so navigations to pages outside
// generateStaticParams can still render instantly.
export default function CityPage({ params }: PageProps<"/[state]/[city]">) {
  return (
    <Suspense fallback={null}>
      <CityContent params={params} />
    </Suspense>
  );
}

async function CityContent({ params }: Pick<PageProps<"/[state]/[city]">, "params">) {
  const { state, city: citySlug } = await params;
  const city = getCity(state, citySlug);
  if (!city) notFound();
  const msps = getCityMsps(state, citySlug);

  const rated = msps.filter((msp) => msp.rating !== null && msp.reviewCount > 0);
  const totalReviews = rated.reduce((sum, msp) => sum + msp.reviewCount, 0);
  const averageRating = rated.reduce((sum, msp) => sum + msp.rating! * msp.reviewCount, 0) / (totalReviews || 1);
  const industries = topValues(msps, "industries", 4);
  const hipaa = msps.filter((msp) => msp.compliance.includes("HIPAA")).length;
  const cmmc = msps.filter((msp) => msp.compliance.includes("CMMC")).length;
  const nearby = city.areas.filter((area) => area !== city.name);

  const directory: DirectoryMsp[] = msps.map((msp) => ({
    slug: msp.slug,
    name: msp.name,
    summary: msp.summary,
    services: msp.services,
    industries: msp.industries,
    compliance: msp.compliance,
    rating: msp.rating,
    reviewCount: msp.reviewCount,
    weightedRating: msp.weightedRating,
    town: msp.town,
    foundedYear: msp.foundedYear,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
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
          ["Average Google rating", averageRating.toFixed(1)],
          ["Google reviews", totalReviews.toLocaleString()],
          ["Support HIPAA / CMMC", `${hipaa} / ${cmmc}`],
        ].map(([term, value]) => (
          <div key={term} className="rounded-xl border border-slate-200 bg-white p-4">
            <dt className="text-xs font-medium text-slate-500">{term}</dt>
            <dd className="mt-1 text-2xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-8">
        <CityDirectory msps={directory} />
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="text-xl font-semibold">How this list is ranked</h2>
        <p className="mt-2 leading-relaxed text-slate-600">
          &quot;Best rated&quot; blends each MSP&apos;s Google rating with its number of reviews, so a 4.9 from 200
          clients ranks above a 5.0 from three. You can also sort by review count or raw stars.{" "}
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
            url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/msp/${msp.slug}`,
            name: msp.name,
          })),
        }}
      />
    </div>
  );
}
