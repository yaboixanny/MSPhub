import Link from "next/link";
import { ScoreBadge } from "@/components/ScoreBadge";
import { SearchBox } from "@/components/SearchBox";
import { getAllMsps, getAreas, getCoveredStates, getSearchIndex, placeName } from "@/lib/data";
import { SERVICE_LABELS, label } from "@/lib/labels";

// Shown after the covered metros in the "Popular" row under the search box.
const POPULAR_SEARCHES = [
  ["HIPAA compliance", "HIPAA"],
  ["Cybersecurity", "cybersecurity"],
  ["Law firms", "law firms"],
  ["CMMC", "CMMC"],
  ["Co-managed IT", "co-managed"],
];

const NEEDS = [
  ["Healthcare & medical", "healthcare"],
  ["Law firms", "legal"],
  ["Accounting & CPAs", "accounting"],
  ["Manufacturing", "manufacturing"],
  ["Construction", "construction"],
  ["Nonprofits", "nonprofit"],
  ["HIPAA", "HIPAA"],
  ["CMMC / defense", "CMMC"],
  ["PCI DSS", "PCI"],
  ["SOC 2", "SOC 2"],
  ["Co-managed IT", "co-managed"],
  ["Microsoft 365", "365"],
];

const FAQS = [
  [
    "What is an MSP?",
    "A managed service provider (MSP) runs a business's IT on an ongoing basis, usually for a flat monthly fee: help desk, monitoring, security, backups, Microsoft 365 and planning. It's the alternative to hiring an in-house IT team or calling a repair shop when something breaks.",
  ],
  [
    "How does MSP Hub choose which companies to list?",
    "We start with every IT business Google lists in an area, then read each company's website. Only companies that offer ongoing managed IT for businesses make the cut. Computer repair shops, web agencies and one-off contractors are left out.",
  ],
  [
    "How are MSPs ranked?",
    "By the MSP Hub Score: a 0-100 score based on what each provider documents publicly, such as years in business, managed services offered, compliance support and pricing transparency. Every profile also links to the provider's reviews on Google. Rankings are never for sale.",
  ],
  [
    "Is MSP Hub free?",
    "Yes. Searching and comparing MSPs is free, and you contact providers directly. We don't sit between you and them.",
  ],
];

export default function Home() {
  const msps = getAllMsps();
  const covered = getCoveredStates();
  const pricing = msps.filter((msp) => msp.pricing).length;
  const metros = covered.flatMap((state) => state.cities).sort((a, b) => b.count - a.count);
  const topScored = msps.slice(0, 6);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-brand-50 via-white to-white">
        <div className="mx-auto max-w-4xl px-4 pb-16 pt-14 text-center sm:pt-20">
          <p className="inline-block rounded-full bg-white px-3 py-1 text-sm font-medium text-brand-700 shadow-sm ring-1 ring-brand-100">
            The database of the best managed IT providers
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl">
            Find the right MSP for your business
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
            MSP Hub is a searchable database of verified managed service providers across the United States. Compare
            who they serve, what they offer and which compliance standards they support, ranked by the transparent MSP
            Hub Score.
          </p>
          <div className="mx-auto mt-8 max-w-2xl">
            <SearchBox index={getSearchIndex()} />
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
            <span className="text-slate-500">Popular:</span>
            {[...metros.map((city) => [city.name, city.name]), ...POPULAR_SEARCHES].slice(0, 7).map(([text, query]) => (
              <Link
                key={query}
                href={`/search?q=${encodeURIComponent(query)}`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700 hover:border-brand-600 hover:text-brand-700"
              >
                {text}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            [msps.length.toString(), "verified MSPs"],
            [pricing.toString(), "publish how they price their services"],
            [metros.length.toString(), metros.length === 1 ? "metro area covered" : "metro areas covered"],
            [`${covered.length} of 50`, "states live, more added city by city"],
          ].map(([value, text]) => (
            <div key={text} className="rounded-xl border border-slate-200 bg-white p-5">
              <dt className="text-3xl font-bold text-slate-900">{value}</dt>
              <dd className="mt-1 text-sm text-slate-600">{text}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* What is MSP Hub */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">What is MSP Hub?</h2>
            <p className="mt-4 leading-relaxed text-slate-600">
              Choosing an IT provider usually means scrolling through map listings that mix real MSPs with repair shops,
              web designers and staffing agencies. MSP Hub fixes that. We check every company and keep only true managed
              service providers, then rank them fairly and organize them by state, metro and town.
            </p>
            <Link href="/how-we-rank" className="mt-4 inline-block font-medium text-brand-600 hover:underline">
              How we verify and rank MSPs
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:col-span-3">
            {[
              ["1", "Verified, not scraped", "Every listing is checked against the company's own website. If managed IT isn't a core service, it's not listed."],
              ["2", "Ranked transparently", "The MSP Hub Score rewards experience, service coverage, compliance support and pricing transparency, and you can see how every score adds up."],
              ["3", "Filter by what matters", "Narrow providers by industry, service and compliance needs like HIPAA, CMMC or SOC 2."],
            ].map(([step, title, text]) => (
              <div key={step} className="rounded-xl border border-slate-200 bg-white p-5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
                  {step}
                </span>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top scored */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Best MSPs right now</h2>
            <p className="mt-1 text-slate-600">The highest MSP Hub Scores in our database.</p>
          </div>
          <Link href="/united-states" className="font-medium text-brand-600 hover:underline">
            See the national rankings
          </Link>
        </div>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topScored.map((msp, index) => (
            <li key={msp.slug} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 hover:border-brand-600/40 hover:shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/msp/${msp.slug}`} className="font-semibold leading-snug hover:text-brand-600 hover:underline">
                  {msp.name}
                </Link>
                <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  #{index + 1}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-500">{placeName(msp)}</p>
              <div className="mt-2"><ScoreBadge score={msp.score.total} /></div>
              <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">{msp.summary}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {msp.services.slice(0, 3).map((value) => (
                  <span key={value} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                    {label(SERVICE_LABELS, value)}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Areas */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Areas we cover</h2>
        <p className="mt-1 text-slate-600">
          Browse by metro or by town. We&apos;re adding cities one at a time so every listing is checked.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {metros.map((city) => {
            const areas = getAreas(city.state, city.slug);
            const href = `/${city.state}/${city.slug}`;
            return (
              <div key={`${city.state}/${city.slug}`} className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-semibold">
                    <Link href={href} className="hover:text-brand-600 hover:underline">
                      Best MSPs in {city.name}, {city.stateCode}
                    </Link>
                  </h3>
                  <Link href={href} className="text-sm font-medium text-brand-600 hover:underline">
                    See all {city.count}
                  </Link>
                </div>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {areas.slice(0, 6).map((area) => (
                    <li key={area.slug}>
                      <Link
                        href={area.hasPage ? `${href}/${area.slug}` : href}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:border-brand-600 hover:text-brand-700"
                      >
                        {area.name}
                        <span className="text-xs text-slate-400">{area.count}</span>
                      </Link>
                    </li>
                  ))}
                  {areas.length > 6 && (
                    <li>
                      <Link href={href} className="inline-block px-2 py-1 text-sm text-slate-500 hover:text-brand-700">
                        +{areas.length - 6} more
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="mt-4">
          <Link
            href="/united-states"
            className="flex items-center justify-between rounded-xl border border-dashed border-slate-300 p-5 text-slate-700 hover:border-brand-600 hover:text-brand-700"
          >
            <span>
              <span className="font-semibold">Browse all 50 states</span>
              <span className="block text-sm text-slate-500">See where we&apos;re live and what&apos;s coming next.</span>
            </span>
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* Browse by need */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Find an MSP by industry or need</h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {NEEDS.map(([text, query]) => (
            <li key={query}>
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                className="block rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 hover:border-brand-600 hover:text-brand-700"
              >
                {text}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-10">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Frequently asked questions</h2>
        <div className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {FAQS.map(([question, answer]) => (
            <details key={question} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {question}
                <span className="text-slate-400 transition group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-3 leading-relaxed text-slate-600">{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
