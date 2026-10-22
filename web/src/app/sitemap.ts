import type { MetadataRoute } from "next";
import { getAllMsps, getAreas, getCities, getCoveredStates } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

// Static export: generate this file once at build time.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const cities = getCities();
  const updated = cities.map((city) => city.updated).sort().at(-1);
  return [
    { url: SITE_URL, lastModified: updated },
    { url: `${SITE_URL}/united-states`, lastModified: updated },
    { url: `${SITE_URL}/how-we-rank` },
    // States without listings are noindex, so only covered states go in the sitemap.
    ...getCoveredStates().map((state) => ({ url: `${SITE_URL}/${state.slug}`, lastModified: updated })),
    ...cities.flatMap((city) => [
      { url: `${SITE_URL}/${city.state}/${city.slug}`, lastModified: city.updated },
      ...getAreas(city.state, city.slug)
        .filter((area) => area.hasPage)
        .map((area) => ({ url: `${SITE_URL}/${city.state}/${city.slug}/${area.slug}`, lastModified: city.updated })),
    ]),
    ...getAllMsps().map((msp) => ({ url: `${SITE_URL}/msp/${msp.slug}`, lastModified: updated })),
  ];
}
