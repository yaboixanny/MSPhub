#!/usr/bin/env python3
"""Find candidate MSPs for a city with Claude's web search tool.

Usage:
    .venv/bin/python scripts/discover.py config/cities/atlanta-ga.json --dry-run
    .venv/bin/python scripts/discover.py config/cities/atlanta-ga.json --limit-areas 1
    .venv/bin/python scripts/discover.py config/cities/atlanta-ga.json --model claude-haiku-5-5

For each town in the city config, Claude runs the config's search phrases
("managed IT services in Alpharetta, GA", ...) with the web_search tool, localized
to that town. The script reads the search results directly (URL and title), drops
directory and listing sites, and keeps one row per company website with "hits" =
how many different searches found it. The rest of the pipeline (crawl, classify,
contact, write-up) reads the companies' own websites, so nothing published comes
from the search results themselves.

Writes data/<state>/<city>/places.csv in the format crawl.py expects. Search
results carry no coordinates, so lat/lng are blank and the export checks that
new MSPs are local (an office in the state, or the metro named on their site).
"""
import argparse
import csv
import hashlib
import sys
import time
from urllib.parse import urlparse

import anthropic

from classify import DEFAULT_MODEL, PRICES
from common import city_dir, load_city, load_env

# Directories, listing sites and other non-company domains: blocked in the search
# tool and filtered again below (subdomains are covered).
BLOCKED_DOMAINS = [
    "clutch.co", "yelp.com", "bbb.org", "linkedin.com", "facebook.com", "instagram.com", "x.com",
    "twitter.com", "youtube.com", "google.com", "bing.com", "mapquest.com", "yellowpages.com",
    "manta.com", "chamberofcommerce.com", "upcity.com", "expertise.com", "goodfirms.co",
    "designrush.com", "techbehemoths.com", "themanifest.com", "indeed.com", "glassdoor.com",
    "ziprecruiter.com", "reddit.com", "quora.com", "wikipedia.org", "crunchbase.com", "zoominfo.com",
    "angi.com", "thumbtack.com", "nextdoor.com", "bizjournals.com", "superpages.com", "dnb.com",
    "apple.com", "microsoft.com", "amazon.com", "cbinsights.com", "g2.com", "capterra.com",
]
SKIP_SUFFIXES = (".gov", ".edu", ".mil")

SYSTEM_PROMPT = """You help build a directory of managed IT service providers by running web searches.

Run each search query you're given with the web_search tool, exactly as written, one search per query. Don't run other searches and don't summarize the results. When all the searches are done, reply with the single word DONE."""

CSV_COLUMNS = [
    "place_id", "name", "lat", "lng", "website", "primary_type", "types",
    "business_status", "hits", "matched_searches",
]


def bare_domain(url):
    host = urlparse(url).netloc.lower().split(":")[0]
    return host[4:] if host.startswith("www.") else host


def blocked(domain):
    return (not domain or domain.endswith(SKIP_SUFFIXES)
            or any(domain == item or domain.endswith("." + item) for item in BLOCKED_DOMAINS))


def search_town(client, model, config, town):
    queries = [f"{query} in {town}, {config['state_code']}" for query in config["queries"]]
    tools = [{
        "type": "web_search_20250305",
        "name": "web_search",
        "max_uses": len(queries) + 1,
        "blocked_domains": BLOCKED_DOMAINS,
        "user_location": {"type": "approximate", "city": town, "region": config["state"], "country": "US"},
    }]
    user = "Run these searches:\n" + "\n".join(f"- {query}" for query in queries)
    messages = [{"role": "user", "content": user}]
    results, usage = [], {"input_tokens": 0, "output_tokens": 0, "searches": 0}
    for _ in range(5):  # resume a few times if the server pauses a long turn
        response = client.messages.create(
            model=model, max_tokens=4000, system=SYSTEM_PROMPT, tools=tools, messages=messages,
            output_config={"effort": "low"},
        )
        usage["input_tokens"] += response.usage.input_tokens
        usage["output_tokens"] += response.usage.output_tokens
        server_use = getattr(response.usage, "server_tool_use", None)
        usage["searches"] += getattr(server_use, "web_search_requests", 0) or 0
        queries_by_id = {}
        for block in response.content:
            if block.type == "server_tool_use":
                queries_by_id[block.id] = (block.input or {}).get("query", "")
            elif block.type == "web_search_tool_result":
                if not isinstance(block.content, list):  # an error object, e.g. max_uses_exceeded
                    continue
                query = queries_by_id.get(block.tool_use_id, "")
                results += [(query, item.url, item.title or "") for item in block.content]
        if response.stop_reason != "pause_turn":
            break
        messages = [{"role": "user", "content": user}, {"role": "assistant", "content": response.content}]
    return results, usage


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("city_config")
    parser.add_argument("--dry-run", action="store_true", help="List the searches without calling the API")
    parser.add_argument("--limit-areas", type=int, help="Only search this many towns (for testing)")
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"Claude model (default {DEFAULT_MODEL})")
    args = parser.parse_args()

    config = load_city(args.city_config)
    areas = config["areas"][:args.limit_areas] if args.limit_areas else config["areas"]
    total_searches = len(areas) * len(config["queries"])
    print(f"{config['city']}, {config['state_code']}: {len(areas)} towns x {len(config['queries'])} searches "
          f"= {total_searches} web searches")
    if args.dry_run:
        for town in areas:
            for query in config["queries"]:
                print(f"  {query} in {town}, {config['state_code']}")
        return

    load_env()
    client = anthropic.Anthropic(max_retries=4)
    sites = {}  # domain -> {"name", "website", "searches"}
    totals = {"input_tokens": 0, "output_tokens": 0, "searches": 0}
    for town in areas:
        try:
            results, usage = search_town(client, args.model, config, town)
        except anthropic.APIStatusError as error:
            sys.exit(f"API error {error.status_code} while searching {town}: {error.message}")
        for key in totals:
            totals[key] += usage[key]
        kept = 0
        for query, url, title in results:
            domain = bare_domain(url)
            if blocked(domain):
                continue
            # Page titles make poor names ("Managed IT Services Atlanta | ..."), so use the
            # domain until contact.py reads the company's real name from its website.
            site = sites.setdefault(domain, {"name": domain, "website": f"https://{urlparse(url).netloc}/",
                                             "searches": set()})
            site["searches"].add(query)
            kept += 1
        print(f"  {town:<22} {usage['searches']:>2} searches, {len(results):>3} results, {kept:>3} kept "
              f"-> {len(sites)} company sites so far")
        time.sleep(1)

    rows = [{
        "place_id": "web-" + hashlib.sha1(domain.encode()).hexdigest()[:16],
        "name": site["name"], "lat": "", "lng": "", "website": site["website"],
        "primary_type": "", "types": "", "business_status": "",
        "hits": len(site["searches"]), "matched_searches": " | ".join(sorted(site["searches"])),
    } for domain, site in sites.items()]
    rows.sort(key=lambda row: (-row["hits"], row["name"]))

    out_dir = city_dir(config)
    out_dir.mkdir(parents=True, exist_ok=True)
    with open(out_dir / "places.csv", "w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        writer.writerows(rows)

    input_price, output_price = PRICES.get(args.model, PRICES[DEFAULT_MODEL])
    token_cost = (totals["input_tokens"] * input_price + totals["output_tokens"] * output_price) / 1_000_000
    print(f"\nDone: {totals['searches']} web searches, {len(rows)} company websites "
          f"({sum(1 for row in rows if row['hits'] > 1)} found by 2+ searches).")
    print(f"Tokens: {totals['input_tokens']:,} in / {totals['output_tokens']:,} out (${token_cost:.2f}); "
          f"web searches are billed per search on top of tokens.")
    print(f"Saved {out_dir.relative_to(out_dir.parents[2])}/places.csv")


if __name__ == "__main__":
    main()
