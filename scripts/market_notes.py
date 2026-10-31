#!/usr/bin/env python3
"""Write a short, original buyer's note for each metro from MSP Hub's own numbers.

Usage:
    .venv/bin/python scripts/market_notes.py --dry-run
    .venv/bin/python scripts/market_notes.py

Run after export_web.py. For every metro with 10+ MSPs this computes a few
aggregate facts from web/src/data/msps.json (counts, shares, medians), has Claude
write a short overview and three questions to ask a provider using only those
facts, and saves web/src/data/market_notes.json. The model never sees a company's
website text. Output is rejected if it contains a number that wasn't supplied, and
the site ignores a note whose MSP count no longer matches the metro, so rerun this
after each export. Existing notes with the current count are skipped.
"""
import argparse
import json
import re
import statistics
from collections import Counter

import anthropic
from pydantic import BaseModel, Field

import batching
from classify import DEFAULT_MODEL, cost_of
from common import ROOT, load_env

DATA = ROOT / "web" / "src" / "data"
MIN_MSPS = 10

SYSTEM_PROMPT = """You write short notes for businesses choosing a managed IT provider (MSP) in one metro area, for a directory.

Use ONLY the facts in the JSON you are given. Every number you write must appear in the JSON (counts, percentages, years). Do not use outside knowledge: no claims about the city's economy, industries, regulations or prices, and no statements about how good any provider is. Don't name companies. Don't use marketing language or superlatives. Describe what the numbers show about how providers here describe themselves, and what that means for a buyer asking questions. The facts come from what providers say on their own websites, so say "providers list" or "say they", not that they are proven."""


class MarketNote(BaseModel):
    overview: str = Field(description="90-130 words, plain prose, one or two short paragraphs, using at least four of the facts")
    questions: list[str] = Field(description="Exactly three questions a buyer here could ask a provider, each under 30 words and tied to a supplied fact")


def pct(part, whole):
    return round(100 * part / whole) if whole else 0


def facts_for(place, msps, all_msps, year):
    count = len(msps)
    years = [year - m["foundedYear"] for m in msps if m["foundedYear"]]
    compliance = Counter(c for m in msps for c in m["compliance"])
    industries = Counter(i for m in msps for i in m["industries"])
    all_compliance = Counter(c for m in all_msps for c in m["compliance"])
    priced = sum(1 for m in msps if m["pricing"])
    return {
        "metro": place,
        "msps_listed": count,
        "msps_listed_across_all_metros": len(all_msps),
        "median_years_in_business": statistics.median(years) if len(years) >= 5 else None,
        "pct_describing_pricing": pct(priced, count),
        "pct_describing_pricing_all_metros": pct(sum(1 for m in all_msps if m["pricing"]), len(all_msps)),
        "compliance_support_pct": {c: pct(n, count) for c, n in compliance.most_common(4)},
        "compliance_support_pct_all_metros": {c: pct(all_compliance[c], len(all_msps)) for c, _ in compliance.most_common(4)},
        "industries_named_by_count": dict(industries.most_common(4)),
        "pct_with_multiple_offices": pct(sum(1 for m in msps if len(m["addresses"]) > 1), count),
    }


def numbers_in(value):
    return set(re.findall(r"\d+(?:\.\d+)?", json.dumps(value)))


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--dry-run", action="store_true", help="Print the facts without calling Claude")
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--no-batch", action="store_true")
    args = parser.parse_args()

    msps = json.loads((DATA / "msps.json").read_text())
    cities = json.loads((DATA / "cities.json").read_text())
    year = int(max(city["updated"] for city in cities)[:4])
    notes_path = DATA / "market_notes.json"
    notes = json.loads(notes_path.read_text()) if notes_path.exists() else {}

    requests, facts = {}, {}
    for city in cities:
        key = f"{city['state']}/{city['slug']}"
        group = [m for m in msps if m["state"] == city["state"] and m["city"] == city["slug"]]
        if len(group) < MIN_MSPS or notes.get(key, {}).get("count") == len(group):
            continue
        place = f"{city['name']}, {city['stateCode']}"
        facts[key] = facts_for(place, group, msps, year)
        requests[key.replace("/", "--")] = {
            "model": args.model, "max_tokens": 2000, "system": SYSTEM_PROMPT,
            "messages": [{"role": "user", "content": f"Facts:\n{json.dumps(facts[key], indent=1)}\n\nWrite the note."}],
            "output_config": {"effort": "low"},
        }
    print(f"{len(requests)} metros need a note")
    if args.dry_run:
        for key, data in facts.items():
            print(key, json.dumps(data)[:200])
        return

    load_env()
    client = anthropic.Anthropic(max_retries=4)
    costs = []

    def save(request_id, outcome):
        key = request_id.replace("--", "/")
        note = outcome["parsed"]
        costs.append(cost_of({"model": outcome["model"], "usage": outcome["usage"], "batch": outcome["batch"]}))
        if note is None or len(note.questions) != 3:
            print(f"  {key}: {outcome['status']}; rerun to retry")
            return
        allowed = numbers_in(facts[key]) | {str(year)}
        stray = numbers_in([note.overview, note.questions]) - allowed
        if stray:
            print(f"  {key}: rejected, numbers not in the facts: {sorted(stray)}; rerun to retry")
            return
        notes[key] = {"count": facts[key]["msps_listed"], "overview": note.overview.strip(),
                      "questions": [q.strip() for q in note.questions]}
        notes_path.write_text(json.dumps(notes, indent=2, sort_keys=True))
        print(f"  ok {key}  {len(note.overview.split())} words")

    batching.run(client, requests, MarketNote, save, batch=not args.no_batch)
    if costs:
        print(f"\nClaude cost this run: ${sum(costs):.3f}")


if __name__ == "__main__":
    main()
