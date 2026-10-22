"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import type { SearchEntry } from "@/lib/data";
import { runSearch } from "@/lib/search";

type Suggestion = { key: string; href: string; title: string; detail: string; kind: string };

export function SearchBox({
  index,
  size = "large",
  placeholder = "Search by city, company, industry or need (e.g. HIPAA)",
}: {
  index: SearchEntry[];
  size?: "large" | "small";
  placeholder?: string;
}) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const suggestions = useMemo<Suggestion[]>(() => {
    if (query.trim().length < 2) return [];
    const { places, msps } = runSearch(index, query);
    return [
      ...places.slice(0, 3).map((place) => ({
        key: place.href, href: place.href, title: place.name, detail: place.detail, kind: "Location",
      })),
      ...msps.slice(0, 5).map((msp) => ({
        key: msp.slug,
        href: `/msp/${msp.slug}`,
        title: msp.name,
        detail: msp.rating ? `${msp.place} · ${msp.rating.toFixed(1)}★ (${msp.reviewCount})` : msp.place,
        kind: "MSP",
      })),
    ];
  }, [index, query]);

  function submit(target?: string) {
    setOpen(false);
    const href = target ?? (query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search");
    router.push(href);
  }

  const large = size === "large";
  return (
    <form
      role="search"
      className="relative w-full"
      onSubmit={(event) => {
        event.preventDefault();
        submit(active >= 0 ? suggestions[active]?.href : undefined);
      }}
    >
      <div className={`flex items-center gap-2 rounded-xl border border-slate-300 bg-white shadow-sm focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100 ${large ? "p-2" : "p-1"}`}>
        <svg className={`ml-2 shrink-0 text-slate-400 ${large ? "h-5 w-5" : "h-4 w-4"}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.45 4.39l3.08 3.08a.75.75 0 11-1.06 1.06l-3.08-3.08A7 7 0 012 9z" clipRule="evenodd" />
        </svg>
        <input
          type="search"
          value={query}
          placeholder={placeholder}
          aria-label="Search MSPs"
          role="combobox"
          aria-expanded={open && suggestions.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          onChange={(event) => { setQuery(event.target.value); setOpen(true); setActive(-1); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") { event.preventDefault(); setActive((i) => Math.min(i + 1, suggestions.length - 1)); }
            if (event.key === "ArrowUp") { event.preventDefault(); setActive((i) => Math.max(i - 1, -1)); }
            if (event.key === "Escape") setOpen(false);
          }}
          className={`min-w-0 flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none ${large ? "py-2 text-base sm:text-lg" : "py-1 text-sm"}`}
        />
        <button
          type="submit"
          className={`shrink-0 rounded-lg bg-brand-600 font-medium text-white hover:bg-brand-700 ${large ? "px-5 py-2.5" : "px-3 py-1.5 text-sm"}`}
        >
          Search
        </button>
      </div>

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-lg"
        >
          {suggestions.map((item, index) => (
            <li key={item.key} role="option" aria-selected={index === active}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => submit(item.href)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left ${index === active ? "bg-brand-50" : "hover:bg-slate-50"}`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-900">{item.title}</span>
                  <span className="block truncate text-sm text-slate-500">{item.detail}</span>
                </span>
                <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{item.kind}</span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => submit()}
              className="w-full border-t border-slate-100 px-4 py-2.5 text-left text-sm font-medium text-brand-600 hover:bg-slate-50"
            >
              See all results for &ldquo;{query.trim()}&rdquo;
            </button>
          </li>
        </ul>
      )}
    </form>
  );
}
