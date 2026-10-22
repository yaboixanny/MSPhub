#!/usr/bin/env python3
"""Delete a city's stored Google Places data once it's published.

Usage:
    .venv/bin/python scripts/purge.py config/cities/orlando-fl.json

Google's terms allow storing place IDs indefinitely but not other Places
content. Discovery keeps business names, websites and coordinates in places.csv
only as working data for crawling and review. Run this after the city's review
is done and it's exported: it deletes places.csv and removes the Google name and
website columns from msps.csv and review.csv, keeping place IDs and everything
derived from the companies' own websites. To work on the city again later, rerun
discover.py.
"""
import argparse
import csv

from common import city_dir, load_city

GOOGLE_COLUMNS = {"name", "website", "domain", "google_maps"}


def strip_columns(path):
    if not path.exists():
        return
    with open(path, newline="") as handle:
        rows = list(csv.DictReader(handle))
    if not rows:
        return
    columns = [column for column in rows[0] if column not in GOOGLE_COLUMNS]
    with open(path, "w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
    print(f"Removed Google columns from {path.name}")


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("city_config")
    args = parser.parse_args()

    base = city_dir(load_city(args.city_config))
    for name in ("places.csv", "places_raw.json"):
        path = base / name
        if path.exists():
            path.unlink()
            print(f"Deleted {name}")
    strip_columns(base / "msps.csv")
    strip_columns(base / "review.csv")


if __name__ == "__main__":
    main()
