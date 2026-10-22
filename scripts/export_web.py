#!/usr/bin/env python3
"""Export confirmed MSPs for every city to JSON files the website reads.

Usage:
    python3 scripts/export_web.py

Reads config/cities/*.json and each city's msps.csv + places.csv, and writes
web/src/data/msps.json and web/src/data/cities.json. Only rows with
is_msp == "yes" that don't need review are published.
"""
import csv
import json
import re
import time
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from common import ROOT, city_dir, load_city

OUT_DIR = ROOT / "web" / "src" / "data"


def slugify(text):
    text = re.sub(r"[^a-z0-9]+", "-", text.lower().replace("&", " and "))
    return text.strip("-")


def clean_url(url):
    """Drop tracking parameters (utm_*, gclid) that Google listings often carry."""
    parsed = urlparse(url)
    query = [(key, value) for key, value in parse_qsl(parsed.query)
             if not key.startswith("utm_") and key not in ("gclid", "fbclid")]
    return urlunparse(parsed._replace(query=urlencode(query)))


def split_list(value):
    return [item for item in value.split("|") if item]


def city_from_address(address):
    # "390 N Orange Ave #2300, Orlando, FL 32801, USA" -> "Orlando"
    parts = [part.strip() for part in address.split(",")]
    for index, part in enumerate(parts):
        if re.match(r"^[A-Z]{2} \d{5}", part) and index > 0:
            return parts[index - 1]
    return ""


def main():
    msps = []
    cities = []
    used_slugs = set()

    for config_path in sorted((ROOT / "config" / "cities").glob("*.json")):
        config = load_city(config_path)
        base = city_dir(config)
        if not (base / "msps.csv").exists():
            continue
        with open(base / "places.csv", newline="") as handle:
            places = {row["place_id"]: row for row in csv.DictReader(handle)}
        with open(base / "msps.csv", newline="") as handle:
            rows = [row for row in csv.DictReader(handle)
                    if row["is_msp"] == "yes" and not row["needs_review"]]

        for row in rows:
            place = places[row["place_id"]]
            slug = slugify(row["name"])
            if slug in used_slugs:
                slug = f"{slug}-{config['slug']}"
            used_slugs.add(slug)
            addresses = [address.replace(", USA", "") for address in row["address"].split(" | ")]
            msps.append({
                "slug": slug,
                "name": row["name"],
                "summary": row["summary"],
                "services": split_list(row["services"]),
                "industries": split_list(row["industries"]),
                "compliance": split_list(row["compliance"]),
                "partners": split_list(row["partners_certifications"]),
                "foundedYear": int(row["founded_year"]) if row["founded_year"] else None,
                "teamSize": row["team_size"] or None,
                "serviceArea": row["service_area"] or None,
                "pricing": row["pricing_model"] or None,
                "rating": float(row["rating"]) if row["rating"] else None,
                "reviewCount": int(row["review_count"] or 0),
                "weightedRating": float(row["weighted_rating"]) if row["weighted_rating"] else None,
                "website": clean_url(row["website"]),
                "phone": row["phone"] or None,
                "addresses": addresses,
                "town": city_from_address(addresses[0]),
                "lat": float(place["lat"]) if place["lat"] else None,
                "lng": float(place["lng"]) if place["lng"] else None,
                "linkedin": row["linkedin"] or None,
                "googleMapsUrl": row["google_maps_url"],
                "city": config["slug"],
                "state": config["state_slug"],
            })

        cities.append({
            "slug": config["slug"],
            "name": config["city"],
            "state": config["state_slug"],
            "stateName": config["state"],
            "stateCode": config["state_code"],
            "areas": config["areas"],
            "count": len(rows),
            "updated": time.strftime("%Y-%m-%d"),
        })
        print(f"{config['city']}, {config['state_code']}: {len(rows)} MSPs")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "msps.json").write_text(json.dumps(msps, indent=2))
    (OUT_DIR / "cities.json").write_text(json.dumps(cities, indent=2))
    print(f"Wrote {len(msps)} MSPs and {len(cities)} cities to {OUT_DIR.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
