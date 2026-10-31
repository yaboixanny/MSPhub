import type { Metadata } from "next";
import { SCORE_PARTS } from "@/lib/score";

export const metadata: Metadata = {
  title: "How We Rank MSPs",
  description: "How MSP Hub verifies managed service providers and calculates the MSP Hub Score.",
  alternates: { canonical: "/how-we-rank" },
};

export default function HowWeRank() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 leading-relaxed text-slate-700">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">How we rank MSPs</h1>

      <h2 className="mt-10 text-xl font-semibold text-slate-900">1. Who gets listed</h2>
      <p className="mt-2">
        We start with IT businesses in and around each city, then read each company&apos;s website. A business is
        listed only if ongoing managed IT for businesses is a core offering: monitoring, help desk, security and support
        on a monthly agreement. Computer repair shops, web agencies, staffing firms and one-off project contractors are
        left out. Listings that are unclear get a manual review.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-slate-900">2. The MSP Hub Score</h2>
      <p className="mt-2">
        Lists are ordered by the MSP Hub Score, a number from 0 to 100 built only from what each provider documents on
        its own website. It rewards providers that are clear about their experience, what they offer, which compliance
        standards they support and how they price. Every profile shows how its score adds up.
      </p>
      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-2.5 font-medium">Part</th>
              <th className="px-4 py-2.5 font-medium">Points</th>
              <th className="px-4 py-2.5 font-medium">How it&apos;s scored</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {SCORE_PARTS.map((part) => (
              <tr key={part.key} className="align-top">
                <td className="px-4 py-3 font-medium text-slate-900">{part.label}</td>
                <td className="px-4 py-3">{part.max}</td>
                <td className="px-4 py-3 text-slate-600">{part.explain}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4">
        The score measures what a provider shows publicly, not how good its service is. A great MSP with a sparse
        website can score lower than it deserves, which is one reason providers can claim and correct
        their listings. Reviews from verified clients are shown on profiles but do not change the score.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-slate-900">3. Reviews</h2>
      <p className="mt-2">
        The MSP Hub Score doesn&apos;t use reviews. For a sense of service quality, each profile links to the
        provider&apos;s reviews on Google so you can read them first-hand. We don&apos;t copy, store or display review
        ratings, and they don&apos;t affect the order of the lists.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-slate-900">4. Where the details come from</h2>
      <p className="mt-2">
        Company names, phone numbers, addresses, services, industries, compliance support, founding year and pricing all
        come from each provider&apos;s own website and are summarized in our words. If something is out of date, providers
        can claim and correct their listing on its profile page.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-slate-900">5. No paid rankings</h2>
      <p className="mt-2">The order of the list is never for sale.</p>
    </article>
  );
}
