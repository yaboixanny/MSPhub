#!/usr/bin/env python3
"""Delete a city's stored Google Places data.

Usage:
    .venv/bin/python scripts/purge.py config/cities/orlando-fl.json

MSP Hub no longer uses Google Places. This removes what earlier discovery runs
stored: places.csv (names, websites, coordinates, categories) and any raw
response file, the Google name and website columns in msps.csv and review.csv,
and Google names and URLs inside the crawl and classification files.

Before dropping Google's columns, msps.csv and review.csv get "company" and
"site" columns taken from the companies' own websites (contact.py and the
crawl), so the review lists stay usable. Rows with no website data of their own
(dead or blocked sites) keep only their status. Bare place IDs stay as internal
file names: Google's terms allow storing them, and they're never published.
"""
import argparse
import csv
import json

from common import city_dir, load_city

GOOGLE_COLUMNS = ["name", "website", "domain", "google_maps"]


def own_details(base, place_id):
    """Company name and website from the company's own site, if we have them."""
    company = site = ""
    contact_path = base / "contact" / f"{place_id}.json"
    if contact_path.exists():
        record = json.loads(contact_path.read_text())
        if record.get("contact"):
            company = record["contact"]["company_name"]
            site = record.get("website", "")
    site_path = base / "sites" / f"{place_id}.json"
    if not site and site_path.exists():
        site = json.loads(site_path.read_text()).get("final_url", "")
    return company, site


def rewrite_csv(base, path):
    if not path.exists():
        return
    with open(path, newline="") as handle:
        rows = list(csv.DictReader(handle))
    if not rows:
        return
    has_ids = "place_id" in rows[0]
    if has_ids:
        for row in rows:
            row["company"], row["site"] = own_details(base, row["place_id"])
    columns = [column for column in rows[0] if column not in GOOGLE_COLUMNS]
    if has_ids:
        # Put the readable columns first.
        columns = ["company", "site"] + [column for column in columns if column not in ("company", "site")]
    with open(path, "w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
    print(f"  {path.name}: Google columns removed")


def rebuild_review(base):
    """review.csv has no place IDs, so rebuild it from the cleaned msps.csv."""
    msps_path, review_path = base / "msps.csv", base / "review.csv"
    if not msps_path.exists():
        return
    with open(msps_path, newline="") as handle:
        rows = [row for row in csv.DictReader(handle) if row.get("needs_review")]
    columns = ["company", "site", "is_msp", "reason", "flags", "crawl_status", "search_hits"]
    with open(review_path, "w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
    print(f"  review.csv rebuilt: {len(rows)} rows, {sum(1 for row in rows if row['site'])} with the company's own website")


def scrub_json(folder, fields):
    if not folder.exists():
        return 0
    changed = 0
    for path in folder.glob("*.json"):
        record = json.loads(path.read_text())
        if any(field in record for field in fields):
            for field in fields:
                record.pop(field, None)
            path.write_text(json.dumps(record, indent=2))
            changed += 1
    return changed


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("city_config")
    args = parser.parse_args()

    base = city_dir(load_city(args.city_config))
    print(base.relative_to(base.parents[2]))
    # Rewrite the CSVs first: they read company names from the files scrubbed below.
    rewrite_csv(base, base / "msps.csv")
    rebuild_review(base)
    for name in ("places.csv", "places_raw.json"):
        path = base / name
        if path.exists():
            path.unlink()
            print(f"  deleted {name}")
    # "website" in crawl files is the URL Google listed; final_url is where we landed.
    print(f"  scrubbed {scrub_json(base / 'sites', ['name', 'website'])} crawl files")
    print(f"  scrubbed {scrub_json(base / 'classified', ['name'])} classification files")


if __name__ == "__main__":
    main()
