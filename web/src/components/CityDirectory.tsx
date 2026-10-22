"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ScoreBadge } from "@/components/ScoreBadge";
import { INDUSTRY_LABELS, SERVICE_LABELS, label } from "@/lib/labels";

export type DirectoryMsp = {
  slug: string;
  name: string;
  summary: string;
  services: string[];
  industries: string[];
  compliance: string[];
  score: number;
  /** Town of the main office, if the company lists one. */
  town: string | null;
  /** Display location, e.g. "Winter Park, FL" or "Orlando area, FL". */
  place: string;
  foundedYear: number | null;
};

const SORTS = {
  best: { label: "MSP Hub Score", compare: (a: DirectoryMsp, b: DirectoryMsp) =>
    b.score - a.score || a.name.localeCompare(b.name) },
  experience: { label: "Years in business", compare: (a: DirectoryMsp, b: DirectoryMsp) =>
    (a.foundedYear ?? 9999) - (b.foundedYear ?? 9999) || b.score - a.score },
  name: { label: "Name (A–Z)", compare: (a: DirectoryMsp, b: DirectoryMsp) => a.name.localeCompare(b.name) },
};
type SortKey = keyof typeof SORTS;

function options(items: DirectoryMsp[], pick: (msp: DirectoryMsp) => string[]) {
  const counts = new Map<string, number>();
  for (const msp of items) for (const value of pick(msp)) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function Select({
  label: text,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
      {text}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 focus:border-brand-600 focus:outline-none"
      >
        {children}
      </select>
    </label>
  );
}

export function CityDirectory({ msps, hideLocation = false }: { msps: DirectoryMsp[]; hideLocation?: boolean }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("best");
  const [service, setService] = useState("");
  const [industry, setIndustry] = useState("");
  const [compliance, setCompliance] = useState("");
  const [town, setTown] = useState("");

  const serviceOptions = useMemo(() => options(msps, (msp) => msp.services), [msps]);
  const industryOptions = useMemo(() => options(msps, (msp) => msp.industries), [msps]);
  const complianceOptions = useMemo(() => options(msps, (msp) => msp.compliance), [msps]);
  const townOptions = useMemo(() => options(msps, (msp) => (msp.town ? [msp.town] : [])), [msps]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return msps
      .filter((msp) =>
        (!needle || `${msp.name} ${msp.summary}`.toLowerCase().includes(needle)) &&
        (!service || msp.services.includes(service)) &&
        (!industry || msp.industries.includes(industry)) &&
        (!compliance || msp.compliance.includes(compliance)) &&
        (!town || msp.town === town))
      .sort(SORTS[sort].compare);
  }, [msps, query, sort, service, industry, compliance, town]);

  const filtered = Boolean(query || service || industry || compliance || town);

  return (
    <div>
      <div className={`grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 ${hideLocation ? "lg:grid-cols-5" : "lg:grid-cols-6"}`}>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 sm:col-span-2 lg:col-span-1">
          Search
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name or keyword"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900 focus:border-brand-600 focus:outline-none"
          />
        </label>
        <Select label="Sort by" value={sort} onChange={(value) => setSort(value as SortKey)}>
          {Object.entries(SORTS).map(([key, item]) => (
            <option key={key} value={key}>{item.label}</option>
          ))}
        </Select>
        <Select label="Service" value={service} onChange={setService}>
          <option value="">All services</option>
          {serviceOptions.map(([value, count]) => (
            <option key={value} value={value}>{label(SERVICE_LABELS, value)} ({count})</option>
          ))}
        </Select>
        <Select label="Industry" value={industry} onChange={setIndustry}>
          <option value="">All industries</option>
          {industryOptions.map(([value, count]) => (
            <option key={value} value={value}>{label(INDUSTRY_LABELS, value)} ({count})</option>
          ))}
        </Select>
        <Select label="Compliance" value={compliance} onChange={setCompliance}>
          <option value="">Any</option>
          {complianceOptions.map(([value, count]) => (
            <option key={value} value={value}>{value} ({count})</option>
          ))}
        </Select>
        {!hideLocation && (
          <Select label="Location" value={town} onChange={setTown}>
            <option value="">All areas</option>
            {townOptions.map(([value, count]) => (
              <option key={value} value={value}>{value} ({count})</option>
            ))}
          </Select>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <p>
          Showing <strong className="text-slate-900">{results.length}</strong> of {msps.length} MSPs
        </p>
        {filtered && (
          <button
            type="button"
            onClick={() => { setQuery(""); setService(""); setIndustry(""); setCompliance(""); setTown(""); }}
            className="text-brand-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <ol className="mt-3 space-y-3">
        {results.map((msp, index) => (
          <li key={msp.slug} className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-brand-600/40 hover:shadow-sm">
            <div className="flex gap-4">
              {sort === "best" && !filtered && (
                <span className="hidden w-8 shrink-0 text-right text-lg font-semibold text-slate-300 sm:block">
                  {index + 1}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-lg font-semibold">
                    <Link href={`/msp/${msp.slug}`} className="hover:text-brand-600 hover:underline">
                      {msp.name}
                    </Link>
                  </h3>
                  <ScoreBadge score={msp.score} />
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  {msp.place}
                  {msp.foundedYear ? ` · Since ${msp.foundedYear}` : ""}
                </p>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-700">{msp.summary}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {msp.services.slice(0, 4).map((value) => (
                    <span key={value} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700">
                      {label(SERVICE_LABELS, value)}
                    </span>
                  ))}
                  {msp.compliance.slice(0, 3).map((value) => (
                    <span key={value} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                      {value}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
      {results.length === 0 && (
        <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          No MSPs match these filters.
        </p>
      )}
    </div>
  );
}
