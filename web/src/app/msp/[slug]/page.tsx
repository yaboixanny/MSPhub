import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { Rating } from "@/components/Rating";
import { getAllMsps, getArea, getCity, getCityMsps, getCityRank, getMsp, slugify } from "@/lib/data";
import { INDUSTRY_LABELS, SERVICE_LABELS, label } from "@/lib/labels";

// Static export: only the pages listed below exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllMsps().map((msp) => ({ slug: msp.slug }));
}

export async function generateMetadata({ params }: PageProps<"/msp/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const msp = getMsp(slug);
  if (!msp) return {};
  const city = getCity(msp.state, msp.city);
  return {
    title: `${msp.name}: Managed IT Services in ${msp.town}, ${city?.stateCode ?? ""}`,
    description: msp.summary.length > 155 ? `${msp.summary.slice(0, 152).trimEnd()}...` : msp.summary,
    alternates: { canonical: `/msp/${slug}` },
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Chips({ items, tone = "slate" }: { items: string[]; tone?: "slate" | "brand" }) {
  const style = tone === "brand" ? "bg-brand-50 text-brand-700 font-medium" : "bg-slate-100 text-slate-700";
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item} className={`rounded-full px-3 py-1 text-sm ${style}`}>{item}</li>
      ))}
    </ul>
  );
}

function hostname(url: string) {
  return new URL(url).hostname.replace(/^www\./, "");
}

export default async function MspPage({ params }: PageProps<"/msp/[slug]">) {
  const { slug } = await params;
  const msp = getMsp(slug);
  if (!msp) notFound();
  const city = getCity(msp.state, msp.city)!;
  const rank = getCityRank(msp);
  const area = getArea(msp.state, msp.city, slugify(msp.town));
  const cityHref = `/${city.state}/${city.slug}`;

  // Other MSPs in the city that share the most industries, best rated first.
  const similar = getCityMsps(msp.state, msp.city)
    .filter((other) => other.slug !== msp.slug)
    .map((other) => ({ other, shared: other.industries.filter((value) => msp.industries.includes(value)).length }))
    .sort((a, b) => b.shared - a.shared)
    .slice(0, 3)
    .map(({ other }) => other);

  const details: [string, React.ReactNode][] = [];
  if (msp.foundedYear) details.push(["Founded", msp.foundedYear]);
  if (msp.teamSize) details.push(["Team size", msp.teamSize]);
  if (msp.pricing) details.push(["Pricing", msp.pricing]);
  if (msp.serviceArea) details.push(["Service area", msp.serviceArea]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "United States", href: "/united-states" },
          { name: city.stateName, href: `/${city.state}` },
          { name: `${city.name} metro`, href: cityHref },
          ...(area ? [{ name: area.name, href: `${cityHref}/${area.slug}` }] : []),
          { name: msp.name, href: `/msp/${msp.slug}` },
        ]}
      />

      <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{msp.name}</h1>
          <p className="mt-1 text-slate-600">
            Managed IT services ·{" "}
            {area ? (
              <Link href={`${cityHref}/${area.slug}`} className="hover:text-brand-600 hover:underline">
                {msp.town}, {city.stateCode}
              </Link>
            ) : (
              <>{msp.town}, {city.stateCode}</>
            )}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link
              href={cityHref}
              className="rounded-full bg-amber-50 px-2.5 py-0.5 text-sm font-semibold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
            >
              #{rank} of {city.count} in the {city.name} metro
            </Link>
            <Rating rating={msp.rating} reviewCount={msp.reviewCount} size={18} />
            <a
              href={msp.googleMapsUrl}
              target="_blank"
              rel="noopener nofollow"
              className="text-sm text-brand-600 hover:underline"
            >
              Read reviews on Google
            </a>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={msp.website}
            target="_blank"
            rel="noopener nofollow"
            className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Visit website
          </a>
          {msp.phone && (
            <a
              href={`tel:${msp.phone.replace(/[^\d+]/g, "")}`}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
            >
              {msp.phone}
            </a>
          )}
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title={`About ${msp.name}`}>
            <p className="leading-relaxed text-slate-700">{msp.summary}</p>
          </Section>
          <Section title="Services">
            <Chips items={msp.services.map((value) => label(SERVICE_LABELS, value))} />
          </Section>
          {msp.industries.length > 0 && (
            <Section title="Industries served">
              <Chips items={msp.industries.map((value) => label(INDUSTRY_LABELS, value))} />
            </Section>
          )}
          {msp.compliance.length > 0 && (
            <Section title="Compliance support">
              <Chips items={msp.compliance} tone="brand" />
            </Section>
          )}
          {msp.partners.length > 0 && (
            <Section title="Partners & certifications">
              <Chips items={msp.partners} />
            </Section>
          )}
        </div>

        <aside className="space-y-6">
          {details.length > 0 && (
            <Section title="Details">
              <dl className="space-y-3 text-sm">
                {details.map(([term, value]) => (
                  <div key={term}>
                    <dt className="text-slate-500">{term}</dt>
                    <dd className="mt-0.5 text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}
          <Section title={msp.addresses.length > 1 ? `Locations (${msp.addresses.length})` : "Location"}>
            <ul className="space-y-2 text-sm text-slate-700">
              {msp.addresses.map((address) => <li key={address}>{address}</li>)}
            </ul>
            <div className="mt-4 space-y-1 text-sm">
              <a href={msp.website} target="_blank" rel="noopener nofollow" className="block text-brand-600 hover:underline">
                {hostname(msp.website)}
              </a>
              {msp.linkedin && (
                <a href={msp.linkedin} target="_blank" rel="noopener nofollow" className="block text-brand-600 hover:underline">
                  LinkedIn
                </a>
              )}
            </div>
          </Section>
          <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Own this business?</p>
            <p className="mt-1">
              Details are summarized from {hostname(msp.website)} and Google. Listing claims, so you can update your
              profile, are coming soon.
            </p>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold">Similar MSPs in {city.name}</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-3">
            {similar.map((other) => (
              <li key={other.slug} className="rounded-xl border border-slate-200 bg-white p-5">
                <Link href={`/msp/${other.slug}`} className="font-semibold hover:text-brand-600 hover:underline">
                  {other.name}
                </Link>
                <p className="mt-0.5 text-sm text-slate-500">{other.town}</p>
                <div className="mt-2"><Rating rating={other.rating} reviewCount={other.reviewCount} size={13} /></div>
              </li>
            ))}
          </ul>
          <Link href={`/${city.state}/${city.slug}`} className="mt-4 inline-block text-sm text-brand-600 hover:underline">
            See all {city.count} MSPs in {city.name}
          </Link>
        </section>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ProfessionalService",
          name: msp.name,
          description: msp.summary,
          url: msp.website,
          ...(msp.phone ? { telephone: msp.phone } : {}),
          ...(msp.foundedYear ? { foundingDate: String(msp.foundedYear) } : {}),
          address: msp.addresses.map((address) => ({ "@type": "PostalAddress", streetAddress: address })),
          areaServed: msp.serviceArea ?? `${city.name}, ${city.stateCode}`,
          ...(msp.linkedin ? { sameAs: [msp.linkedin] } : {}),
        }}
      />
    </div>
  );
}
