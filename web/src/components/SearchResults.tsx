"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Rating } from "@/components/Rating";
import type { SearchEntry } from "@/lib/data";
import { runSearch } from "@/lib/search";

const PAGE_SIZE = 25;

export function SearchResults({ index }: { index: SearchEntry[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const [draft, setDraft] = useState(query);
  const [sort, setSort] = useState<"relevance" | "reviews">("relevance");
  const [shown, setShown] = useState(PAGE_SIZE);

  const { places, msps } = useMemo(() => runSearch(index, query || "best"), [index, query]);
  const sorted = useMemo(
    () => (sort === "reviews" ? [...msps].sort((a, b) => b.reviewCount - a.reviewCount) : msps),
    [msps, sort],
  );

  return (
    <div>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          setShown(PAGE_SIZE);
          router.replace(draft.trim() ? `/search?q=${encodeURIComponent(draft.trim())}` : "/search");
        }}
        className="flex gap-2"
      >
        <input
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Search by city, company, industry or need"
          aria-label="Search MSPs"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <button type="submit" className="rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700">
          Search
        </button>
      </form>

      {places.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Locations</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {places.slice(0, 6).map((place) => (
              <li key={place.href}>
                <Link href={place.href} className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-600/40 hover:shadow-sm">
                  <span className="font-semibold">{place.name}</span>
                  <span className="mt-0.5 block text-sm text-slate-500">{place.detail}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {msps.length} {msps.length === 1 ? "MSP" : "MSPs"}
            {query && <> matching &ldquo;{query}&rdquo;</>}
          </h2>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Sort
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as "relevance" | "reviews")}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
            >
              <option value="relevance">Best match, then best rated</option>
              <option value="reviews">Most reviews</option>
            </select>
          </label>
        </div>

        {msps.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-600">
            <p>No MSPs match &ldquo;{query}&rdquo; yet.</p>
            <p className="mt-1 text-sm">
              Try a city, a service like &ldquo;cybersecurity&rdquo;, or an industry like &ldquo;healthcare&rdquo;. We&apos;re
              adding new cities regularly, so <Link href="/united-states" className="text-brand-600 hover:underline">check which areas we cover</Link>.
            </p>
          </div>
        ) : (
          <ol className="mt-4 space-y-3">
            {sorted.slice(0, shown).map((msp) => (
              <li key={msp.slug} className="rounded-xl border border-slate-200 bg-white p-5 hover:border-brand-600/40 hover:shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <Link href={`/msp/${msp.slug}`} className="text-lg font-semibold hover:text-brand-600 hover:underline">
                    {msp.name}
                  </Link>
                  <Rating rating={msp.rating} reviewCount={msp.reviewCount} size={14} />
                </div>
                <p className="mt-0.5 text-sm text-slate-500">{msp.place}</p>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-700">{msp.summary}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {msp.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700">{tag}</span>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        )}
        {sorted.length > shown && (
          <button
            type="button"
            onClick={() => setShown((count) => count + PAGE_SIZE)}
            className="mt-4 w-full rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-medium hover:bg-slate-50"
          >
            Show more ({sorted.length - shown} left)
          </button>
        )}
      </section>
    </div>
  );
}
