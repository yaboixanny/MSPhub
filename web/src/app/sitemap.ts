import type { MetadataRoute } from "next";
import { getAllMsps, getCities, getStates } from "@/lib/data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const cities = getCities();
  const updated = cities.map((city) => city.updated).sort().at(-1);
  return [
    { url: SITE_URL, lastModified: updated },
    { url: `${SITE_URL}/how-we-rank` },
    ...getStates().map((state) => ({ url: `${SITE_URL}/${state.slug}`, lastModified: updated })),
    ...cities.map((city) => ({ url: `${SITE_URL}/${city.state}/${city.slug}`, lastModified: city.updated })),
    ...getAllMsps().map((msp) => ({ url: `${SITE_URL}/msp/${msp.slug}`, lastModified: updated })),
  ];
}
