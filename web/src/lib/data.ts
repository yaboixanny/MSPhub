import mspData from "@/data/msps.json";
import cityData from "@/data/cities.json";
import { INDUSTRY_LABELS, SERVICE_LABELS } from "@/lib/labels";
import { type Score, scoreMsp } from "@/lib/score";
import { US_STATES } from "@/lib/states";

/** An MSP as exported by scripts/export_web.py: website-sourced details plus a Google place ID. */
type MspRecord = {
  slug: string;
  name: string;
  summary: string;
  services: string[];
  industries: string[];
  compliance: string[];
  partners: string[];
  foundedYear: number | null;
  teamSize: string | null;
  serviceArea: string | null;
  pricing: string | null;
  website: string;
  phone: string | null;
  addresses: string[];
  /** Town of the main office from the company's website; null if it lists no address. */
  town: string | null;
  linkedin: string | null;
  /** Profile overview written from the company's website (scripts/writeup.py). */
  writeup: {
    what_they_do: string;
    who_they_serve: string;
    how_they_work: string;
    what_stands_out: string;
  } | null;
  city: string;
  state: string;
};

export type Msp = MspRecord & { score: Score };

export type City = {
  slug: string;
  name: string;
  state: string;
  stateName: string;
  stateCode: string;
  areas: string[];
  count: number;
  updated: string;
};

export type State = {
  slug: string;
  name: string;
  code: string;
  cities: City[];
  count: number;
};

/** A town inside a metro, e.g. Winter Park in the Orlando metro. */
export type Area = {
  slug: string;
  name: string;
  count: number;
  /** Areas with enough MSPs get their own page. */
  hasPage: boolean;
  /** Only pages with enough MSPs are offered to search engines; smaller ones are mostly a copy of the metro page. */
  indexed: boolean;
};

// Towns need at least this many MSPs to get their own page (fewer is thin content)...
export const MIN_AREA_MSPS = 3;
// ...and this many to be indexed by search engines.
export const INDEX_MIN_AREA_MSPS = 5;

const cities = cityData as City[];
// Years in business are counted up to the year the data was last updated.
const asOfYear = Number(cities.map((city) => city.updated).sort().at(-1)?.slice(0, 4)) || 2026;
const msps: Msp[] = (mspData as MspRecord[]).map((msp) => ({ ...msp, score: scoreMsp(msp, asOfYear) }));

export function slugify(text: string) {
  return text.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function byScore(a: Msp, b: Msp) {
  return b.score.total - a.score.total || a.name.localeCompare(b.name);
}

/** Where an MSP is based, e.g. "Winter Park, FL", falling back to the metro name. */
export function placeName(msp: Msp) {
  const city = getCity(msp.state, msp.city);
  return `${msp.town ?? `${city?.name} area`}, ${city?.stateCode ?? ""}`;
}

export function getAllMsps(): Msp[] {
  return [...msps].sort(byScore);
}

export function getMsp(slug: string): Msp | undefined {
  return msps.find((msp) => msp.slug === slug);
}

export function getCityMsps(state: string, city: string): Msp[] {
  return msps.filter((msp) => msp.state === state && msp.city === city).sort(byScore);
}

export function getStateMsps(state: string): Msp[] {
  return msps.filter((msp) => msp.state === state).sort(byScore);
}

/** 1-based rank of an MSP within its city by MSP Hub Score. */
export function getCityRank(msp: Msp): number {
  return getCityMsps(msp.state, msp.city).findIndex((other) => other.slug === msp.slug) + 1;
}

export function getCities(): City[] {
  return cities;
}

export function getCity(state: string, city: string): City | undefined {
  return cities.find((item) => item.state === state && item.slug === city);
}

/** Every US state (plus DC), with the cities covered so far. */
export function getStates(): State[] {
  return US_STATES.map((state) => {
    const stateCities = cities.filter((city) => city.state === state.slug);
    return { ...state, cities: stateCities, count: stateCities.reduce((sum, city) => sum + city.count, 0) };
  });
}

export function getCoveredStates(): State[] {
  return getStates().filter((state) => state.cities.length > 0);
}

export function getState(slug: string): State | undefined {
  return getStates().find((state) => state.slug === slug);
}

/** Towns in a metro with how many MSPs are based there, most first. */
export function getAreas(state: string, city: string): Area[] {
  const metro = getCity(state, city);
  const counts = new Map<string, number>();
  for (const msp of getCityMsps(state, city)) {
    if (msp.town) counts.set(msp.town, (counts.get(msp.town) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({
      slug: slugify(name),
      name,
      count,
      // The metro's own name is already covered by the city page.
      hasPage: count >= MIN_AREA_MSPS && name !== metro?.name,
      indexed: count >= INDEX_MIN_AREA_MSPS && name !== metro?.name,
    }));
}

export function getArea(state: string, city: string, area: string): Area | undefined {
  return getAreas(state, city).find((item) => item.slug === area && item.hasPage);
}

export function getAreaMsps(state: string, city: string, area: string): Msp[] {
  return getCityMsps(state, city).filter((msp) => msp.town && slugify(msp.town) === area);
}

/** Most common values of a list field across MSPs, e.g. top industries in a city. */
export function topValues(items: Msp[], field: "services" | "industries" | "compliance", limit = 5) {
  const counts = new Map<string, number>();
  for (const msp of items) {
    for (const value of msp[field]) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

export type SearchEntry =
  | {
      kind: "msp";
      slug: string;
      name: string;
      place: string;
      summary: string;
      score: number;
      tags: string[];
      keywords: string;
    }
  | { kind: "place"; name: string; detail: string; href: string; count: number; keywords: string };

/** Compact index for client-side search: every MSP plus every state, metro and area. */
export function getSearchIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];
  for (const state of getCoveredStates()) {
    entries.push({
      kind: "place",
      name: state.name,
      detail: `${state.count} MSPs across ${state.cities.length} ${state.cities.length === 1 ? "metro" : "metros"}`,
      href: `/${state.slug}`,
      count: state.count,
      keywords: `${state.name} ${state.code}`.toLowerCase(),
    });
    for (const city of state.cities) {
      entries.push({
        kind: "place",
        name: `${city.name}, ${city.stateCode}`,
        detail: `${city.count} MSPs in the ${city.name} metro`,
        href: `/${state.slug}/${city.slug}`,
        count: city.count,
        keywords: `${city.name} ${city.stateCode} ${state.name} ${city.areas.join(" ")}`.toLowerCase(),
      });
      for (const area of getAreas(state.slug, city.slug).filter((item) => item.hasPage)) {
        entries.push({
          kind: "place",
          name: `${area.name}, ${city.stateCode}`,
          detail: `${area.count} MSPs based in ${area.name} (${city.name} metro)`,
          href: `/${state.slug}/${city.slug}/${area.slug}`,
          count: area.count,
          keywords: `${area.name} ${city.stateCode} ${state.name}`.toLowerCase(),
        });
      }
    }
  }
  for (const msp of getAllMsps()) {
    const city = getCity(msp.state, msp.city);
    const services = msp.services.map((value) => SERVICE_LABELS[value] ?? value);
    const industries = msp.industries.map((value) => INDUSTRY_LABELS[value] ?? value);
    entries.push({
      kind: "msp",
      slug: msp.slug,
      name: msp.name,
      place: placeName(msp),
      summary: msp.summary,
      score: msp.score.total,
      tags: [...msp.compliance.slice(0, 3), ...services.slice(0, 3)],
      keywords: [
        msp.name, msp.town, city?.name, city?.stateName, city?.stateCode, msp.serviceArea,
        ...services, ...industries, ...msp.compliance, ...msp.partners,
      ].filter(Boolean).join(" ").toLowerCase(),
    });
  }
  return entries;
}
