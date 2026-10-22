import mspData from "@/data/msps.json";
import cityData from "@/data/cities.json";

export type Msp = {
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
  rating: number | null;
  reviewCount: number;
  weightedRating: number | null;
  website: string;
  phone: string | null;
  addresses: string[];
  town: string;
  lat: number | null;
  lng: number | null;
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
};

const msps = mspData as Msp[];
const cities = cityData as City[];

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

export function getCities(): City[] {
  return cities;
}

export function getCity(state: string, city: string): City | undefined {
  return cities.find((item) => item.state === state && item.slug === city);
}

export function getStates(): State[] {
  const states = new Map<string, State>();
  for (const city of cities) {
    const state = states.get(city.state) ?? {
      slug: city.state,
      name: city.stateName,
      code: city.stateCode,
      cities: [],
    };
    state.cities.push(city);
    states.set(city.state, state);
  }
  return [...states.values()];
}

export function getState(slug: string): State | undefined {
  return getStates().find((state) => state.slug === slug);
}

/** Most common values of a list field across MSPs, e.g. top industries in a city. */
export function topValues(items: Msp[], field: "services" | "industries" | "compliance", limit = 5) {
  const counts = new Map<string, number>();
  for (const msp of items) {
    for (const value of msp[field]) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}
