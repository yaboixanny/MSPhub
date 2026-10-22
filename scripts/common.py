"""Shared helpers for the MSP Hub data scripts."""
import csv
import json
import math
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load_env():
    env_path = ROOT / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            value = value.strip().strip('"').strip("'")
            if value:
                os.environ.setdefault(key.strip(), value)


def load_city(config_path):
    return json.loads(Path(config_path).read_text())


def city_dir(config):
    return ROOT / "data" / config["state_slug"] / config["slug"]


def read_places(config):
    with open(city_dir(config) / "places.csv", newline="") as handle:
        return list(csv.DictReader(handle))


def miles_between(lat1, lng1, lat2, lng2):
    lat1, lng1, lat2, lng2 = map(math.radians, (lat1, lng1, lat2, lng2))
    a = (math.sin((lat2 - lat1) / 2) ** 2
         + math.cos(lat1) * math.cos(lat2) * math.sin((lng2 - lng1) / 2) ** 2)
    return 3958.8 * 2 * math.asin(math.sqrt(a))


def in_radius(config, place):
    if not place.get("lat") or not place.get("lng"):
        return False
    center = config["center"]
    distance = miles_between(center["lat"], center["lng"], float(place["lat"]), float(place["lng"]))
    return distance <= config["radius_miles"]
