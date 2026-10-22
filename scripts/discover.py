#!/usr/bin/env python3
"""Find candidate MSPs for a city using the Google Places API (New) Text Search.

Usage:
    python3 scripts/discover.py config/cities/orlando-fl.json --dry-run
    python3 scripts/discover.py config/cities/orlando-fl.json

Writes data/<state_slug>/<slug>/places.csv and places_raw.json.
Every search in the city config runs once per area, up to --max-pages pages
(20 results each). Results are de-duplicated by Google place ID.
"""
import argparse
import csv
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from common import ROOT, load_env

SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
FIELDS = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.rating",
    "places.userRatingCount",
    "places.websiteUri",
    "places.nationalPhoneNumber",
    "places.googleMapsUri",
    "places.primaryType",
    "places.types",
    "places.businessStatus",
    "nextPageToken",
]
CSV_COLUMNS = [
    "place_id", "name", "address", "lat", "lng", "rating", "review_count",
    "website", "phone", "google_maps_url", "primary_type", "types",
    "business_status", "hits", "matched_searches",
]


def search(api_key, text_query, page_token=None):
    body = {"textQuery": text_query, "pageSize": 20, "regionCode": "US"}
    if page_token:
        body["pageToken"] = page_token
    request = urllib.request.Request(
        SEARCH_URL,
        data=json.dumps(body).encode(),
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": ",".join(FIELDS),
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        detail = error.read().decode(errors="replace")
        sys.exit(f"\nPlaces API error {error.code} for '{text_query}':\n{detail}")


def to_row(place, searches):
    location = place.get("location", {})
    return {
        "place_id": place["id"],
        "name": place.get("displayName", {}).get("text", ""),
        "address": place.get("formattedAddress", ""),
        "lat": location.get("latitude", ""),
        "lng": location.get("longitude", ""),
        "rating": place.get("rating", ""),
        "review_count": place.get("userRatingCount", 0),
        "website": place.get("websiteUri", ""),
        "phone": place.get("nationalPhoneNumber", ""),
        "google_maps_url": place.get("googleMapsUri", ""),
        "primary_type": place.get("primaryType", ""),
        "types": "|".join(place.get("types", [])),
        "business_status": place.get("businessStatus", ""),
        "hits": len(searches),
        "matched_searches": " | ".join(sorted(searches)),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("city_config", help="Path to a city JSON config")
    parser.add_argument("--dry-run", action="store_true", help="List the searches without calling the API")
    parser.add_argument("--max-pages", type=int, default=3, help="Pages per search, 20 results each (max 3)")
    parser.add_argument("--max-requests", type=int, default=400, help="Stop after this many API requests")
    args = parser.parse_args()

    config = json.loads(Path(args.city_config).read_text())
    text_queries = [
        f"{query} in {area}, {config['state_code']}"
        for area in config["areas"]
        for query in config["queries"]
    ]
    print(f"{config['city']}, {config['state_code']}: {len(text_queries)} searches "
          f"(up to {len(text_queries) * args.max_pages} requests)")

    if args.dry_run:
        for text_query in text_queries:
            print(f"  {text_query}")
        return

    load_env()
    api_key = os.environ.get("GOOGLE_PLACES_API_KEY")
    if not api_key:
        sys.exit("GOOGLE_PLACES_API_KEY is missing. Copy .env.example to .env and paste your key there.")

    places = {}
    searches_by_place = {}
    request_count = 0

    for text_query in text_queries:
        page_token = None
        for _ in range(args.max_pages):
            if request_count >= args.max_requests:
                print(f"Reached --max-requests ({args.max_requests}); stopping early.")
                break
            result = search(api_key, text_query, page_token)
            request_count += 1
            for place in result.get("places", []):
                places[place["id"]] = place
                searches_by_place.setdefault(place["id"], set()).add(text_query)
            page_token = result.get("nextPageToken")
            if not page_token:
                break
            time.sleep(0.5)
        print(f"  [{request_count:>3} requests] {len(places):>4} unique places  <- {text_query}")

    rows = [
        to_row(place, searches_by_place[place_id])
        for place_id, place in places.items()
        if place.get("businessStatus") != "CLOSED_PERMANENTLY"
    ]
    rows.sort(key=lambda row: (-row["hits"], -int(row["review_count"] or 0)))

    out_dir = ROOT / "data" / config["state_slug"] / config["slug"]
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "places_raw.json").write_text(json.dumps(list(places.values()), indent=2))
    with open(out_dir / "places.csv", "w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        writer.writerows(rows)

    with_website = sum(1 for row in rows if row["website"])
    print(f"\nDone: {request_count} requests, {len(rows)} open businesses "
          f"({with_website} with a website).")
    print(f"Saved {out_dir.relative_to(ROOT)}/places.csv")


if __name__ == "__main__":
    main()
