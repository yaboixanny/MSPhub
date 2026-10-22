import type { DirectoryMsp } from "@/components/CityDirectory";
import type { Msp } from "@/lib/data";

/** The fields the sortable list needs, so pages don't ship whole profiles to the browser. */
export function toDirectory(msps: Msp[]): DirectoryMsp[] {
  return msps.map((msp) => ({
    slug: msp.slug,
    name: msp.name,
    summary: msp.summary,
    services: msp.services,
    industries: msp.industries,
    compliance: msp.compliance,
    rating: msp.rating,
    reviewCount: msp.reviewCount,
    weightedRating: msp.weightedRating,
    town: msp.town,
    foundedYear: msp.foundedYear,
  }));
}
