#!/usr/bin/env python3
"""Export confirmed MSPs for every city to JSON files the website reads.

Usage:
    python3 scripts/export_web.py

Reads config/cities/*.json, each city's msps.csv and the contact details from
scripts/contact.py, and writes web/src/data/msps.json and cities.json. Only rows
with is_msp == "yes" that don't need review and have website contact details
are published.

Nothing from Google is published: names, phones, addresses and the website URL
come from each company's own site.
"""
import csv
import json
import re
import time
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from common import ROOT, city_dir, load_city

OUT_DIR = ROOT / "web" / "src" / "data"
# Netlify redirects file, copied into the static export from web/public.
REDIRECTS = ROOT / "web" / "public" / "_redirects"


def slugify(text):
    text = re.sub(r"[^a-z0-9]+", "-", text.lower().replace("&", " and "))
    return text.strip("-")


def clean_url(url):
    """Drop tracking parameters (utm_*, gclid) that links often carry."""
    parsed = urlparse(url)
    query = [(key, value) for key, value in parse_qsl(parsed.query)
             if not key.startswith("utm_") and key not in ("gclid", "fbclid")]
    return urlunparse(parsed._replace(query=urlencode(query)))


def split_list(value):
    return [item for item in value.split("|") if item]


def town_key(name):
    """Compare town names loosely: "Saint Petersburg", "St Petersburg" and "St. Petersburg" match."""
    name = " ".join(name.lower().replace(".", "").split())
    return name.replace("saint ", "st ")


def company_identity(city, name, website):
    """How a published profile is recognised between exports: metro, company name and website domain."""
    domain = urlparse(website).netloc.lower().removeprefix("www.")
    return (city, name.lower().strip(), domain)


def is_local(contact, metro_towns):
    """New listings must list an office in one of the metro's towns. Discovery by web
    search has no coordinates, and a site naming the metro proves little (national
    firms and lead-generation sites list dozens of "service areas"), so a company
    with no address is held for review instead of published."""
    return any(town_key(address["city"]) in metro_towns for address in contact["addresses"])


def load_writeup(base, place_id):
    path = base / "writeup" / f"{place_id}.json"
    return json.loads(path.read_text()).get("writeup") if path.exists() else None


def format_address(address):
    street = address["street"].strip()
    # Some sites put the city in the street line ("Sarasota FL, 34232"); drop it then.
    if address["city"].strip() and street.lower().startswith(address["city"].strip().lower()):
        street = ""
    parts = [street, address["city"].strip(), address["state"].strip()]
    line = ", ".join(part for part in parts if part)
    return f"{line} {address['postal_code']}" if address.get("postal_code") else line


def main():
    msps = []
    cities = []
    # Keep every published MSP's URL stable: reuse the slug it already has, and
    # reserve those slugs before naming new MSPs (a company with offices in several
    # metros gets one profile per metro, e.g. /msp/acme-it and /msp/acme-it-miami).
    previous_path = OUT_DIR / "msps.json"
    previous_msps = json.loads(previous_path.read_text()) if previous_path.exists() else []
    # Place IDs aren't published, so profiles are recognised by company identity.
    # (Older exports included placeId; those keys still match during the switch.)
    previous = {company_identity(msp["city"], msp["name"], msp["website"]): msp["slug"] for msp in previous_msps}
    previous.update({(msp["city"], msp["placeId"]): msp["slug"] for msp in previous_msps if msp.get("placeId")})
    used_slugs = set(previous.values())
    redirects = {}  # old slug -> slug of the profile it was merged into

    for config_path in sorted((ROOT / "config" / "cities").glob("*.json")):
        config = load_city(config_path)
        base = city_dir(config)
        if not (base / "msps.csv").exists():
            continue
        with open(base / "msps.csv", newline="") as handle:
            rows = [row for row in csv.DictReader(handle)
                    if row["is_msp"] == "yes" and not row["needs_review"]]

        # Town key -> the config's spelling, which is what the site displays.
        metro_towns = {town_key(area): area for area in config["areas"] + config.get("nearby_towns", [])}
        # One profile per company per metro, even when it was found twice with
        # different website pages (e.g. its homepage and a services page).
        by_company = {}
        held = []
        published = 0
        for row in rows:
            contact_path = base / "contact" / f"{row['place_id']}.json"
            record = json.loads(contact_path.read_text()) if contact_path.exists() else {}
            contact = record.get("contact")
            if not contact:
                print(f"  skipped {row.get('company') or row.get('name') or row['place_id']}: no contact details from its website "
                      f"({record.get('status', 'contact.py not run')[:60]})")
                continue
            identity = company_identity(config["slug"], contact["company_name"], clean_url(record["website"]))
            company_key = identity[1:]
            previous_slug = previous.get(identity) or previous.get((config["slug"], row["place_id"]))
            # local_ok = "yes" in msps.csv publishes a held company after a manual check.
            if previous_slug is None and row.get("local_ok") != "yes" and not is_local(contact, metro_towns):
                reason = "no office address on its website" if not contact["addresses"] else "no office in the metro"
                held.append({"company": contact["company_name"], "website": record["website"], "reason": reason,
                             "place_id": row["place_id"]})
                continue
            if company_key in by_company:
                existing = by_company[company_key]
                if previous_slug and previous_slug != existing["slug"]:
                    redirects[previous_slug] = existing["slug"]
                for address in contact["addresses"]:
                    formatted = format_address(address)
                    if formatted not in existing["addresses"]:
                        existing["addresses"].append(formatted)
                continue
            published += 1
            # National MSPs often list their head office first; put offices in this
            # metro's towns first and use the first one as the MSP's town.
            local = [address for address in contact["addresses"] if town_key(address["city"]) in metro_towns]
            addresses = local + [address for address in contact["addresses"] if address not in local]
            slug = previous_slug
            if slug is None:
                slug = slugify(contact["company_name"])
                if slug in used_slugs:
                    slug = f"{slug}-{config['slug']}"
                base_slug, number = slug, 2
                while slug in used_slugs:
                    slug = f"{base_slug}-{number}"
                    number += 1
                used_slugs.add(slug)
            msps.append({
                "slug": slug,
                "name": contact["company_name"],
                "summary": row["summary"],
                "services": split_list(row["services"]),
                "industries": split_list(row["industries"]),
                "compliance": split_list(row["compliance"]),
                "partners": split_list(row["partners_certifications"]),
                "foundedYear": int(row["founded_year"]) if row["founded_year"] else None,
                "teamSize": row["team_size"] or None,
                "serviceArea": row["service_area"] or None,
                "pricing": row["pricing_model"] or None,
                "website": clean_url(record["website"]),
                "phone": contact["phone"],
                "addresses": [format_address(address) for address in addresses],
                # Town of the local office, for area pages; None if the site lists no office in the metro.
                "town": metro_towns[town_key(local[0]["city"])] if local else None,
                "linkedin": row["linkedin"] or None,
                # Profile overview from scripts/writeup.py; the summary above is for lists.
                "writeup": load_writeup(base, row["place_id"]),
                "city": config["slug"],
                "state": config["state_slug"],
            })
            by_company[company_key] = msps[-1]

        cities.append({
            "slug": config["slug"],
            "name": config["city"],
            "state": config["state_slug"],
            "stateName": config["state"],
            "stateCode": config["state_code"],
            "areas": config["areas"],
            "count": published,
            "updated": time.strftime("%Y-%m-%d"),
        })
        held_path = base / "held.csv"
        if held:
            with open(held_path, "w", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=["company", "website", "reason", "place_id"])
                writer.writeheader()
                writer.writerows(held)
        elif held_path.exists():
            held_path.unlink()
        note = f" ({len(held)} held for review in held.csv)" if held else ""
        print(f"{config['city']}, {config['state_code']}: {published} MSPs published{note}")

    # Keep old profile URLs working after merges; earlier redirects are kept too.
    lines = REDIRECTS.read_text().splitlines() if REDIRECTS.exists() else []
    existing_sources = {line.split()[0] for line in lines if line.strip()}
    for old, new in sorted(redirects.items()):
        if f"/msp/{old}" not in existing_sources and old != new:
            lines.append(f"/msp/{old} /msp/{new} 301")
    if lines:
        REDIRECTS.parent.mkdir(parents=True, exist_ok=True)
        REDIRECTS.write_text("\n".join(lines) + "\n")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "msps.json").write_text(json.dumps(msps, indent=2))
    (OUT_DIR / "cities.json").write_text(json.dumps(cities, indent=2))
    print(f"Wrote {len(msps)} MSPs and {len(cities)} cities to {OUT_DIR.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
