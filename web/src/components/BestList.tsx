import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { ScoreBadge } from "@/components/ScoreBadge";
import { type Msp, placeName } from "@/lib/data";
import { type Faq, rankReasons } from "@/lib/seo";

/** The ranked "Top N" list at the top of every location page, with a reason line per MSP. */
export function TopList({ title, msps, asOfYear }: { title: string; msps: Msp[]; asOfYear: number }) {
  return (
    <section>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <ol className="mt-4 space-y-3">
        {msps.map((msp, index) => (
          <li key={msp.slug} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-50 text-sm font-bold text-amber-800 ring-1 ring-amber-200">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-lg font-semibold">
                  <Link href={`/msp/${msp.slug}`} className="hover:text-brand-600 hover:underline">
                    {msp.name}
                  </Link>
                </h3>
                <ScoreBadge score={msp.score.total} />
              </div>
              <p className="mt-0.5 text-sm text-slate-500">{placeName(msp)}</p>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
                {rankReasons(msp, asOfYear).map((reason) => (
                  <li key={reason} className="flex items-center gap-1.5">
                    <span className="text-emerald-600" aria-hidden>✓</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Short methodology note shown under every Top list. */
export function HowWePicked({ updated }: { updated: string }) {
  return (
    <aside className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-600">
      <p className="font-semibold text-slate-900">How we picked</p>
      <p className="mt-1">
        We checked every listed company&apos;s website to confirm it offers ongoing managed IT for businesses, then ranked
        them by the MSP Hub Score: years in business, managed services coverage, compliance support, industries served
        and pricing transparency. Rankings are never paid for. Each profile also shows live Google reviews.{" "}
        <Link href="/how-we-rank" className="font-medium text-brand-600 hover:underline">
          Read the full method
        </Link>
        . Updated {updated}.
      </p>
    </aside>
  );
}

/** Location FAQs, rendered for readers and as FAQPage structured data. */
export function LocationFaq({ place, faqs }: { place: string; faqs: Faq[] }) {
  return <FaqSection title={`Frequently asked questions about MSPs in ${place}`} faqs={faqs} />;
}

/** FAQs rendered for readers and as FAQPage structured data. */
export function FaqSection({ title, faqs }: { title: string; faqs: Faq[] }) {
  if (faqs.length === 0) return null;
  return (
    <section className="max-w-3xl">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {faqs.map((faq) => (
          <details key={faq.question} className="group p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
              {faq.question}
              <span className="text-slate-400 transition group-open:rotate-45" aria-hidden>+</span>
            </summary>
            <p className="mt-3 leading-relaxed text-slate-600">{faq.answer}</p>
          </details>
        ))}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        }}
      />
    </section>
  );
}
