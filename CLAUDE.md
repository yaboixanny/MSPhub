# MSP Hub

A directory of managed service providers, built metro by metro. `README.md` covers
setup, the data pipeline and deployment; this file holds the rules to keep.

## SEO: every location page targets "best MSPs in <place>"

The site competes for searches like "best MSP Orlando" and "best MSPs in Madison".
Every location page (state, metro, town, and any new kind) follows this pattern,
built from the shared helpers in `web/src/lib/seo.ts` and
`web/src/components/BestList.tsx`. Don't hand-write per-city copy; new cities
should only need a config file.

1. **Title:** `bestTitle()`, e.g. "Best MSPs in Orlando, FL (2026): 111 Managed IT
   Providers Ranked", set with `title: { absolute }` so the brand suffix doesn't
   truncate it. Description from `bestDescription()`. The year comes from the
   data's last update (`freshness()`), never hardcoded.
2. **H1:** "Best MSPs in <place>", followed by "<n> managed IT service providers,
   ranked · Updated <Month Year>".
3. **Top list:** `TopList` with `topCount()` entries (10 for 15+ MSPs, 5 for 6-14,
   none below that), each with data-backed reasons from `rankReasons()`.
4. **"How we picked":** `HowWePicked` directly under the Top list, linking to
   `/how-we-rank`.
5. **FAQs:** `LocationFaq` with `locationFaqs()`; answers come from the listings,
   so every place gets its own.
6. **Internal links say "Best MSPs in <place>":** homepage metro cards, state
   pages, area chips, footer and profile links.

Also keep:
- **One page per place.** Retarget the existing page instead of adding separate
  "best" pages, which would compete with each other.
- **Keep "best" honest.** Rankings are by the MSP Hub Score (what providers
  document publicly), and the method stays one click away.
- **No thin pages.** Town pages need 3+ MSPs (`MIN_AREA_MSPS`) and are only
  indexed with 5+ (`INDEX_MIN_AREA_MSPS`); smaller ones are noindex and out of the
  sitemap. States without listings stay noindex and out of the sitemap. Future industry or compliance
  pages per city (e.g. "Best MSPs for law firms in Orlando") need 5+ matching MSPs.
- **Stable URLs.** Never rename a published URL; the export reuses slugs and
  writes redirects to `web/public/_redirects` when profiles merge.

## Profiles need content of their own

The list summary (classify.py) appears on city pages, so profiles show the longer
write-up from `scripts/writeup.py` (what they do, who they work with, how they
work, what stands out) plus `profileFaqs()`. Every new city runs writeup.py before
export. Write-ups state only what the company's site says, attribute claims to the
company, and avoid marketing language.

## Trust pages

`/about` (mission, how listings are built, editorial independence, corrections)
and `/how-we-rank` stay linked from the header and footer. Keep their claims
accurate: if a process (human review, refresh schedule) changes, update them.

## No Google data or APIs

Google's Maps Platform terms forbid using the Places API (a "Core Service") in a
listings or directory service, and Google's terms forbid scraping Google Search.
So the site and pipeline must not call Google Places or the Maps JavaScript API,
scrape Google results, store or publish Google content (ratings, names,
addresses, phones, Maps URLs), or publish place IDs. Older cities' local files
still use bare place IDs as file names, which Google's terms allow. Reviews are linked, not shown: profiles
use `GoogleReviewsLink`, a plain Maps search hyperlink. Discovery for new cities
must come from a source whose terms allow building a directory; everything
published comes from each company's own website.

## Conventions

- Pipeline Claude calls use `--model claude-haiku-5-5` (the owner's choice for cost).
- New cities get `max_candidates` (default 50) so crawling and review stay small.
- The site is a static export (`output: "export"`) deployed on Netlify from `main`;
  read `web/node_modules/next/dist/docs/` before using Next.js APIs (see
  `web/AGENTS.md`).
- Never commit `.env`, API keys or the `data/` folder.
