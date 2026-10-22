import type { SearchEntry } from "@/lib/data";

type MspEntry = Extract<SearchEntry, { kind: "msp" }>;
type PlaceEntry = Extract<SearchEntry, { kind: "place" }>;

// Words that describe every listing ("best managed IT company near me") and would match nothing useful.
const STOP_WORDS = new Set([
  "a", "an", "and", "the", "in", "near", "me", "for", "of", "best", "top", "good", "local", "msp", "msps",
  "it", "managed", "service", "services", "provider", "providers", "company", "companies", "support",
  "firm", "firms", "business", "businesses",
]);

// Everyday words mapped to the terms used in listings.
const SYNONYMS: Record<string, string> = {
  law: "legal", lawyer: "legal", lawyers: "legal", attorney: "legal", attorneys: "legal",
  medical: "healthcare", doctor: "healthcare", doctors: "healthcare", clinic: "healthcare", hospital: "healthcare",
  dentist: "dental", dentists: "dental", cpa: "accounting", cpas: "accounting", accountants: "accounting",
  security: "cyber", cybersecurity: "cyber", phones: "voip", phone: "voip", backups: "backup", m365: "365",
  office365: "365", microsoft: "microsoft", nonprofits: "nonprofit", manufacturers: "manufacturing",
  contractors: "construction", builders: "construction", schools: "education",
};

export function searchTerms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9.]+/)
    .filter((word) => word && !STOP_WORDS.has(word))
    .map((word) => SYNONYMS[word] ?? word);
}

/** Every term must appear somewhere in the entry's keywords. */
function matches(entry: SearchEntry, terms: string[]) {
  return terms.every((term) => entry.keywords.includes(term));
}

export function runSearch(index: SearchEntry[], query: string) {
  const terms = searchTerms(query);
  const raw = query.trim().toLowerCase();
  if (!raw) return { terms, places: [] as PlaceEntry[], msps: [] as MspEntry[] };

  const places = index
    .filter((entry): entry is PlaceEntry => entry.kind === "place")
    .filter((entry) => terms.length > 0 && matches(entry, terms))
    .sort((a, b) => {
      // "winter park" should list Winter Park before the Orlando metro that contains it.
      const nameA = a.name.toLowerCase().includes(raw) ? 1 : 0;
      const nameB = b.name.toLowerCase().includes(raw) ? 1 : 0;
      return nameB - nameA || b.count - a.count;
    });

  // A query of only stop words ("best MSP") shows every MSP, best rated first.
  const msps = index
    .filter((entry): entry is MspEntry => entry.kind === "msp")
    .filter((entry) => terms.length === 0 || matches(entry, terms))
    .sort((a, b) => {
      // MSPs whose name contains the query come first, then best rated.
      const nameA = a.name.toLowerCase().includes(raw) ? 1 : 0;
      const nameB = b.name.toLowerCase().includes(raw) ? 1 : 0;
      return nameB - nameA || (b.weightedRating ?? 0) - (a.weightedRating ?? 0) || b.reviewCount - a.reviewCount;
    });

  return { terms, places, msps };
}
