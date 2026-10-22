import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchResults } from "@/components/SearchResults";
import { getSearchIndex } from "@/lib/data";

export const metadata: Metadata = {
  title: "Search MSPs",
  description: "Search verified managed service providers by city, company name, industry, service or compliance need.",
  // Search result pages shouldn't be indexed; the city and MSP pages are.
  robots: { index: false, follow: true },
};

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Search MSPs</h1>
      <p className="mt-2 text-slate-600">
        Search by city, company, industry (&ldquo;law firms&rdquo;), service (&ldquo;cybersecurity&rdquo;) or compliance
        need (&ldquo;HIPAA&rdquo;). Results are ranked by the MSP Hub Score.
      </p>
      <div className="mt-6">
        {/* useSearchParams needs a Suspense boundary so the page shell can prerender. */}
        <Suspense fallback={<div className="h-12 rounded-lg bg-slate-100" />}>
          <SearchResults index={getSearchIndex()} />
        </Suspense>
      </div>
    </div>
  );
}
