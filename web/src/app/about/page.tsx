import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { getAllMsps, getCities, getCoveredStates } from "@/lib/data";
import { freshness } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

// Public contact address for corrections and listing questions; set in Netlify.
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export const metadata: Metadata = {
  title: "About MSP Hub",
  description:
    "MSP Hub is an independent directory of verified managed service providers. How we build listings, how we rank them, and why rankings are never for sale.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const msps = getAllMsps();
  const metros = getCities();
  const states = getCoveredStates();
  const updated = freshness(metros);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 leading-relaxed text-slate-700">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">About MSP Hub</h1>
      <p className="mt-4 text-lg">
        MSP Hub is an independent directory that helps businesses find a managed IT service provider. It lists{" "}
        {msps.length} verified MSPs across {metros.length} metro areas in {states.length}{" "}
        {states.length === 1 ? "state" : "states"}, and grows one metro at a time.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-slate-900">Why it exists</h2>
      <p className="mt-2">
        Searching for an IT provider usually means scrolling through map listings that mix real managed service
        providers with computer repair shops, web designers, staffing agencies and one-off contractors. MSP Hub keeps
        only companies that offer ongoing managed IT for businesses, and organizes them by state, metro and town so
        you can compare the providers near you side by side.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-slate-900">How listings are built</h2>
      <ul className="mt-2 list-disc space-y-2 pl-5">
        <li>We find IT businesses in each area, then read each company&apos;s own website.</li>
        <li>
          A company is listed only if ongoing managed IT, such as help desk, monitoring, security and support on a
          monthly agreement, is a core offering. Unclear cases are reviewed by hand before they&apos;re published.
        </li>
        <li>
          Company names, contact details, services, industries, compliance support, founding year and pricing come
          from each provider&apos;s website and are summarized in our own words with AI assistance.
        </li>
        <li>We don&apos;t copy, store or display review ratings from Google or other sites; each profile links to the provider&apos;s reviews on Google instead.</li>
      </ul>

      <h2 className="mt-10 text-xl font-semibold text-slate-900">How rankings work</h2>
      <p className="mt-2">
        Lists are ordered by the MSP Hub Score, a 0-100 score based on what each provider documents publicly: years in
        business, managed services coverage, compliance support, industries served and pricing transparency. It
        measures how clearly a provider shows what it offers, not service quality, which is why every profile also
        links to that provider&apos;s reviews on Google.{" "}
        <Link href="/how-we-rank" className="text-brand-600 hover:underline">
          Read the full method
        </Link>
        .
      </p>

      <h2 className="mt-10 text-xl font-semibold text-slate-900">Editorial independence</h2>
      <p className="mt-2">
        Rankings are never for sale. No provider can pay to be listed, to rank higher or to have its score changed.
        If MSP Hub ever offers paid features, such as enhanced profiles, they will be clearly labeled and will not
        affect the order of any list.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-slate-900">Keeping listings current</h2>
      <p className="mt-2">
        Listings were last updated in {updated.label}. Metros are refreshed from providers&apos; websites over time,
        and a company that closes or stops offering managed IT is removed when we learn of it or at the next
        refresh.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-slate-900">Corrections and listing questions</h2>
      <p className="mt-2">
        If you run an MSP and something on your profile is wrong or out of date, or you&apos;d like your company
        considered for a metro we cover,{" "}
        {CONTACT_EMAIL ? (
          <>
            email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-600 hover:underline">
              {CONTACT_EMAIL}
            </a>{" "}
            with your company name and website.
          </>
        ) : (
          <>contact us. Listing claims, so you can update your own profile, are coming soon.</>
        )}{" "}
        We check every change against your website before publishing it.
      </p>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "MSP Hub",
          url: SITE_URL,
          description: "An independent directory of verified managed IT service providers in the United States.",
          ...(CONTACT_EMAIL ? { email: CONTACT_EMAIL } : {}),
        }}
      />
    </article>
  );
}
