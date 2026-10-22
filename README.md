# MSP Hub

A directory of managed service providers, built city by city.

## Setup

```bash
uv python install 3.12          # or any Python 3.10+
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env            # then add your keys
```

`.env` needs `GOOGLE_PLACES_API_KEY` (Places API (New)) and `ANTHROPIC_API_KEY`.

## Data pipeline (per city)

Each city has a config in `config/cities/` with its search areas, search phrases,
center point and radius. Output lands in `data/<state>/<city>/`.

| Step | Command | Output |
|---|---|---|
| 1. Discover | `.venv/bin/python scripts/discover.py config/cities/orlando-fl.json` | `places.csv`: every business Google returns |
| 2. Crawl | `.venv/bin/python scripts/crawl.py config/cities/orlando-fl.json` | `sites/*.json`: text from up to 5 pages per website |
| 3. Classify | `.venv/bin/python scripts/classify.py config/cities/orlando-fl.json` | `classified/*.json` + `msps.csv`: MSP yes/no/unsure with extracted profile |

Steps 2 and 3 skip work already done, so they can be stopped and rerun. Use
`--limit 10` to test on a few sites first, and `classify.py --report-only` to
rebuild `msps.csv` without calling Claude.

Before Claude runs, a free pre-filter drops sites that are gone and businesses
with no managed-IT signal. Rows marked `needs_review` in `msps.csv` (classifier
unsure, site blocked the crawler, or flagged, e.g. many listings with few reviews)
are also written to `review.csv` for a manual pass. `weighted_rating` blends each rating with the
city average so a 5.0 from 3 reviews doesn't outrank a 4.9 from 300.

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

## Adding a city

Copy `config/cities/orlando-fl.json`, change the city, areas, center and radius,
and run the three steps.
