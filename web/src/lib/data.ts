import mspData from "@/data/msps.json";
import cityData from "@/data/cities.json";
import { INDUSTRY_LABELS, SERVICE_LABELS } from "@/lib/labels";
import { US_STATES } from "@/lib/states";

export type Msp = {
  slug: string;
  placeId: string;
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
  rating: number | null;
  reviewCount: number;
  weightedRating: number | null;
  website: string;
  phone: string | null;
  addresses: string[];
  town: string;
  linkedin: string | null;
  googleMapsUrl: string;
  city: string;
  state: string;
};

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
};

// Towns need at least this many MSPs to get their own page (fewer is thin content).
export const MIN_AREA_MSPS = 3;

const msps = mspData as Msp[];
const cities = cityData as City[];

export function slugify(text: string) {
  return text.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function byWeightedRating(a: Msp, b: Msp) {
  return (b.weightedRating ?? 0) - (a.weightedRating ?? 0) || b.reviewCount - a.reviewCount;
}

export function getAllMsps(): Msp[] {
  return [...msps].sort(byWeightedRating);
}

export function getMsp(slug: string): Msp | undefined {
  return msps.find((msp) => msp.slug === slug);
}

export function getCityMsps(state: string, city: string): Msp[] {
  return msps.filter((msp) => msp.state === state && msp.city === city).sort(byWeightedRating);
}

export function getStateMsps(state: string): Msp[] {
  return msps.filter((msp) => msp.state === state).sort(byWeightedRating);
}

/** 1-based rank of an MSP within its city by weighted rating. */
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
    }));
}

export function getArea(state: string, city: string, area: string): Area | undefined {
  return getAreas(state, city).find((item) => item.slug === area && item.hasPage);
}

export function getAreaMsps(state: string, city: string, area: string): Msp[] {
  return getCityMsps(state, city).filter((msp) => slugify(msp.town) === area);
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
      town: string;
      place: string;
      summary: string;
      rating: number | null;
      reviewCount: number;
      weightedRating: number | null;
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
      town: msp.town,
      place: `${msp.town}, ${city?.stateCode ?? ""}`,
      summary: msp.summary,
      rating: msp.rating,
      reviewCount: msp.reviewCount,
      weightedRating: msp.weightedRating,
      tags: [...msp.compliance.slice(0, 3), ...services.slice(0, 3)],
      keywords: [
        msp.name, msp.town, city?.name, city?.stateName, city?.stateCode, msp.serviceArea,
        ...services, ...industries, ...msp.compliance, ...msp.partners,
      ].filter(Boolean).join(" ").toLowerCase(),
    });
  }
  return entries;
}
