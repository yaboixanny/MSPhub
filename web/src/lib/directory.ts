import type { DirectoryMsp } from "@/components/CityDirectory";
import { type Msp, placeName } from "@/lib/data";

/** The fields the sortable list needs, so pages don't ship whole profiles to the browser. */
export function toDirectory(msps: Msp[]): DirectoryMsp[] {
  return msps.map((msp) => ({
    slug: msp.slug,
    name: msp.name,
    summary: msp.summary,
    services: msp.services,
    industries: msp.industries,
    compliance: msp.compliance,
    score: msp.score.total,
    town: msp.town,
    place: placeName(msp),
    foundedYear: msp.foundedYear,
  }));
}
