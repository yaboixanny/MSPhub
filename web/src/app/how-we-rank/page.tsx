import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How We Rank MSPs",
  description: "How MSP Hub verifies managed service providers and ranks them using Google ratings weighted by review count.",
  alternates: { canonical: "/how-we-rank" },
};

export default function HowWeRank() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 leading-relaxed text-slate-700">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">How we rank MSPs</h1>

      <h2 className="mt-10 text-xl font-semibold text-slate-900">1. Who gets listed</h2>
      <p className="mt-2">
        We start with every IT business Google lists in and around each city, then read each company&apos;s website.
        A business is listed only if ongoing managed IT for businesses is a core offering: monitoring, help desk,
        security and support on a monthly agreement. Computer repair shops, web agencies, staffing firms and one-off
        project contractors are left out. Listings that are unclear get a manual review.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-slate-900">2. How &quot;Best rated&quot; works</h2>
      <p className="mt-2">
        Sorting by stars alone rewards companies with only a few reviews: a 5.0 from three reviews would beat a 4.9
        from three hundred. Instead, we use a weighted rating that treats every MSP as if it started with ten
        reviews at the city&apos;s average rating, then adds its real Google reviews on top.
      </p>
      <p className="mt-3">
        The more reviews an MSP has, the closer its weighted score gets to its actual rating. A new company with a
        perfect score still ranks well, just not above an established provider with a long, consistent record.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-slate-900">3. Where the details come from</h2>
      <p className="mt-2">
        Ratings and review counts come from Google. Services, industries, compliance support, founding year and
        pricing come from each provider&apos;s own website and are summarized in our words. If something is out of
        date, providers will soon be able to claim and update their listing.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-slate-900">4. No paid rankings</h2>
      <p className="mt-2">The order of the list is never for sale.</p>
    </article>
  );
}
