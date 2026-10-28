# MSP Hub

A directory of managed service providers, built city by city.

## Setup

```bash
uv python install 3.12          # or any Python 3.10+
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env            # then add your keys
```

`.env` needs `ANTHROPIC_API_KEY`.

## Data pipeline (per city)

Each city has a config in `config/cities/` with its search areas, search phrases,
center point, radius and `max_candidates`. Working files land in `data/<state>/<city>/`.

| Step | Command | Output |
|---|---|---|
| 1. Discover | `scripts/discover.py <config>` | `places.csv`: company websites found by Claude web search, with `hits` = how many searches found each |
| 2. Crawl | `scripts/crawl.py <config>` | `sites/*.json`: text from up to 5 pages per website |
| 3. Classify | `scripts/classify.py <config>` | `classified/*.json`, `msps.csv`, `review.csv` |
| 4. Contact details | `scripts/contact.py <config>` | `contact/*.json`: name, phone, addresses from each company's website |
| 5. Profile write-ups | `scripts/writeup.py <config>` | `writeup/*.json`: 150-250 word overview per MSP for its profile page (only MSPs that pass the local check) |
| 5b. Review | open `review.csv` | set `is_msp` to `yes`/`no` in `msps.csv` for unclear rows |
| 6. Export | `scripts/export_web.py` | `web/src/data/msps.json`, `cities.json`, and redirects in `web/public/_redirects` |
| 7. Purge | `scripts/purge.py <config>` | deletes discovery data (`places.csv`) once the city's review is done |

Run each with `.venv/bin/python` and the city config, e.g.
`.venv/bin/python scripts/crawl.py config/cities/orlando-fl.json`. Steps 2-4 skip
work already done, so they can be stopped and rerun; `--limit 10` tests on a few
sites, and `classify.py --report-only` rebuilds `msps.csv` without calling Claude. The Claude steps use Haiku
(`claude-haiku-5-5`) unless you pass `--model`.

**Keeping costs down.** Classify, contact details and write-ups send their Claude
requests as one Message Batch per run (50% off tokens; usually done within minutes,
up to an hour). Add `--no-batch` for quick tests, which sends requests one by one
at full price. Requests that error in a batch aren't saved, so a rerun retries them.
Discovery runs three search phrases per town ("managed service provider", "IT
support company", "outsourced IT"); a fourth, "managed IT services", found no MSPs
the other three missed. Web searches are most of a city's cost ($10 per 1,000).

**Candidate cap.** Crawling and classification only cover the top
`max_candidates` websites by search hits (default 50; `null` for no cap). Real MSPs
rank near the top, so 50 candidates usually yields 25-35 confirmed MSPs. Orlando
was built before the cap and uses `null`.

**Stable URLs.** The export keeps each published MSP's URL. A company with offices in
several metros gets one profile per metro (e.g. `/msp/compassmsp` and
`/msp/compassmsp-miami`), duplicate listings within a metro are merged, and merged
profiles' old URLs are redirected in `web/public/_redirects`.

**Pre-filter and review.** Before Claude runs, a free pre-filter drops sites that are
gone and businesses with no managed-IT signal. Rows marked `needs_review` in
`msps.csv` (classifier unsure, site blocked the crawler, or several listings for
one website) are also written to `review.csv` for a manual pass.

**No Google data.** Google's Maps Platform terms forbid using the Places API in a
listings or directory service, and Google's terms forbid scraping its search
results, so MSP Hub uses neither. The original discovery script used Places; it was
retired and the stored data purged. A replacement discovery step needs to write
`places.csv` in the format above (`place_id` can be any stable ID) from a source
whose terms allow building a directory: `discover.py` now uses Claude's web search
tool (directories and listing sites are blocked). Everything published comes from
the companies' own websites.

**Local check.** Search results carry no coordinates, so the export only publishes a
new MSP if its website lists an office in the metro's `areas` or `nearby_towns` (a
city config key used for matching, not searching). Companies without one (national
firms, franchise HQ sites, lead-generation sites, sites with no address) are written
to `held.csv` instead. To publish a held company after checking it, set `local_ok`
to `yes` on its row in `msps.csv` and export again.

**MSP Hub Score.** Lists are ordered by a 0-100 score computed in
`web/src/lib/score.ts` from website data only: years in business (30), managed
services coverage (25), compliance support (20), industries (10) and transparency
(15). `/how-we-rank` explains it using the same weights.

## Website

The site in `web/` is a Next.js app that reads `web/src/data/*.json`. After
classifying (and reviewing) a city, export it and run the site:

```bash
.venv/bin/python scripts/export_web.py   # confirmed MSPs -> web/src/data
cd web && npm install && npm run dev      # http://localhost:3000
```

Pages:

| URL | Page |
|---|---|
| `/` | Home: what MSP Hub is, search with suggestions, top-rated MSPs, areas covered |
| `/search?q=` | Search across MSPs, metros and towns (understands "law firms", "HIPAA", etc.) |
| `/united-states` | All 50 states + DC and the national top 25 |
| `/<state>` | Metros, towns and top MSPs; states without data say "coming soon" (noindex) |
| `/<state>/<city>` | Metro page with sortable, filterable ranking and an areas list |
| `/<state>/<city>/<area>` | Town page, for towns with 3+ MSPs (e.g. `/florida/orlando/winter-park`) |
| `/msp/<slug>` | MSP profile with its rank in the metro |
| `/how-we-rank` | Ranking method |

Plus `sitemap.xml` and `robots.txt`.

`npm run build` exports the whole site as static HTML to `web/out/`, so any static
host can serve it. It's deployed on Netlify (https://msphub.netlify.app) using
`netlify.toml`; every push to `main` redeploys. Canonical URLs use Netlify's site
address automatically; set `NEXT_PUBLIC_SITE_URL` once a custom domain is connected.

## SEO

Every location page targets "best MSPs in <place>" searches: keyword titles with
the year, an H1 of "Best MSPs in <place>", a ranked Top 10 (or Top 5) with reasons,
a "How we picked" note, data-generated FAQs, and "Best MSPs in <place>" link text.
It's all generated from the data by `web/src/lib/seo.ts`, so new cities get it
automatically. The rules are in `CLAUDE.md`.

## Adding a city

Copy `config/cities/orlando-fl.json`, change the city, areas, center and radius,
and run the three steps.
