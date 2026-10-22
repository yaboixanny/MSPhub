/**
 * The site's public address, used for canonical URLs, the sitemap and structured data.
 * Set NEXT_PUBLIC_SITE_URL once there's a custom domain; until then, fall back to the
 * address the host provides at build time (Netlify sets URL, Vercel sets
 * VERCEL_PROJECT_PRODUCTION_URL without the scheme).
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ??
  "http://localhost:3000"
).replace(/\/$/, "");
