#!/usr/bin/env python3
"""Fetch the homepage and a few key pages of each candidate MSP website.

Usage:
    .venv/bin/python scripts/crawl.py config/cities/orlando-fl.json --limit 10
    .venv/bin/python scripts/crawl.py config/cities/orlando-fl.json

Reads data/<state>/<city>/places.csv, keeps places inside the city radius that
have a website, and writes one JSON file per place to .../sites/<place_id>.json.
Already-crawled places are skipped (failed ones are retried), so the script
can be stopped and resumed.
"""
import argparse
import json
import re
import time
import urllib.robotparser
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser
from urllib.parse import urldefrag, urljoin, urlparse

import httpx

from common import city_dir, load_city, read_places, top_candidates

USER_AGENT = "MSPHubBot/0.1 (directory of managed IT providers; crawls a few public pages per site)"
MAX_EXTRA_PAGES = 4
MAX_PAGE_CHARS = 8000
PAGE_DELAY_SECONDS = 0.5

# One page is picked per category (in this order) so each site gets a spread of
# about / services / industries / security pages rather than four service pages.
LINK_CATEGORIES = [
    ("about", ("about", "who-we-are", "our-story", "company", "team", "why-")),
    ("services", ("managed", "services", "solutions", "it-support")),
    ("industries", ("industries", "industry", "who-we-serve", "verticals", "healthcare", "legal")),
    ("security", ("cyber", "security", "compliance", "hipaa", "cmmc")),
]
SKIP_LINK_WORDS = (
    "blog", "news", "article", "post", "career", "job", "privacy", "terms", "cookie",
    "login", "portal", "cart", "wp-content", "tag/", "category/", "author/", "feed",
)
SKIP_EXTENSIONS = (".pdf", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".zip", ".doc", ".docx", ".mp4")


class PageParser(HTMLParser):
    SKIP_TAGS = {"script", "style", "noscript", "svg", "template", "iframe", "head"}
    BLOCK_TAGS = {
        "p", "div", "li", "ul", "ol", "h1", "h2", "h3", "h4", "h5", "h6", "section",
        "article", "header", "footer", "nav", "br", "tr", "td", "th", "table", "form",
        "label", "button", "blockquote", "main", "aside",
    }

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skip_depth = 0
        self.in_title = False
        self.title = ""
        self.meta_description = ""
        self.links = []
        self._link_href = None
        self._link_text = []
        self._chunks = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "title":
            self.in_title = True
        elif tag == "meta" and (attrs.get("name") or "").lower() == "description":
            self.meta_description = (attrs.get("content") or "").strip()
        if tag in self.SKIP_TAGS and tag != "head":
            self.skip_depth += 1
        if tag in self.BLOCK_TAGS:
            self._chunks.append("\n")
        if tag == "a" and attrs.get("href"):
            self._link_href = attrs["href"]
            self._link_text = []

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag in self.SKIP_TAGS and tag != "head" and self.skip_depth:
            self.skip_depth -= 1
        if tag in self.BLOCK_TAGS:
            self._chunks.append("\n")
        if tag == "a" and self._link_href is not None:
            self.links.append((self._link_href, " ".join(self._link_text).strip()))
            self._link_href = None

    def handle_data(self, data):
        if self.in_title:
            self.title += data
            return
        if self.skip_depth:
            return
        self._chunks.append(data)
        if self._link_href is not None:
            self._link_text.append(data.strip())

    def lines(self):
        text = "".join(self._chunks)
        seen = set()
        result = []
        for line in text.split("\n"):
            line = re.sub(r"\s+", " ", line).strip()
            if len(line) > 1 and line not in seen:
                seen.add(line)
                result.append(line)
        return result


def bare_host(url):
    host = urlparse(url).netloc.lower()
    return host[4:] if host.startswith("www.") else host


def parse_page(html):
    parser = PageParser()
    try:
        parser.feed(html)
    except Exception:
        pass  # Malformed HTML: keep whatever was parsed before the error.
    return parser


def pick_links(base_url, links):
    host = bare_host(base_url)
    candidates = {}
    for href, text in links:
        url = urldefrag(urljoin(base_url, href))[0].rstrip("/")
        parsed = urlparse(url)
        path = parsed.path.lower()
        if parsed.scheme not in ("http", "https") or bare_host(url) != host:
            continue
        if path in ("", "/") or path.endswith(SKIP_EXTENSIONS) or parsed.query:
            continue
        if any(word in path for word in SKIP_LINK_WORDS):
            continue
        candidates.setdefault(url, f"{path} {text.lower()}")

    def short_first(url):
        # Top-level pages beat deep pages and long blog-style slugs.
        path = urlparse(url).path
        return (path.count("/"), len(path))

    picked = []
    for _, keywords in LINK_CATEGORIES:
        matches = [url for url, haystack in candidates.items()
                   if url not in picked and any(word in haystack for word in keywords)]
        if matches:
            picked.append(min(matches, key=short_first))
    extras = sorted(
        (url for url, haystack in candidates.items() if url not in picked
         and any(word in haystack for _, keywords in LINK_CATEGORIES for word in keywords)),
        key=short_first,
    )
    return (picked + extras)[:MAX_EXTRA_PAGES]


def robots_for(client, url):
    parsed = urlparse(url)
    robots = urllib.robotparser.RobotFileParser()
    try:
        response = client.get(f"{parsed.scheme}://{parsed.netloc}/robots.txt")
        robots.parse(response.text.splitlines() if response.status_code == 200 else [])
    except httpx.HTTPError:
        robots.parse([])
    return robots


def fetch(client, url):
    response = client.get(url)
    response.raise_for_status()
    if "html" not in response.headers.get("content-type", "html"):
        raise ValueError(f"not HTML ({response.headers.get('content-type')})")
    return str(response.url), response.text


def crawl_site(place):
    record = {
        "place_id": place["place_id"],
        "name": place["name"],
        "website": place["website"],
        "crawled_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "status": "ok",
        "error": "",
        "pages": [],
        "social": {},
    }
    with httpx.Client(follow_redirects=True, timeout=15, headers={"User-Agent": USER_AGENT}) as client:
        try:
            robots = robots_for(client, place["website"])
            if not robots.can_fetch(USER_AGENT, place["website"]):
                record.update(status="blocked", error="robots.txt disallows crawling")
                return record
            final_url, html = fetch(client, place["website"])
        except httpx.HTTPStatusError as error:
            # 401/403 means the site's firewall rejects bots; don't keep retrying it.
            status = "blocked" if error.response.status_code in (401, 403) else "error"
            record.update(status=status, error=f"HTTP {error.response.status_code} from {error.request.url}"[:300])
            return record
        except (httpx.HTTPError, ValueError) as error:
            record.update(status="error", error=f"{type(error).__name__}: {error}"[:300])
            return record

        home = parse_page(html)
        home_lines = home.lines()
        boilerplate = set(home_lines)
        record["final_url"] = final_url
        record["pages"].append({
            "url": final_url,
            "title": home.title.strip(),
            "meta_description": home.meta_description,
            "text": "\n".join(home_lines)[:MAX_PAGE_CHARS],
        })
        all_links = list(home.links)

        for url in pick_links(final_url, home.links):
            if not robots.can_fetch(USER_AGENT, url):
                continue
            time.sleep(PAGE_DELAY_SECONDS)
            try:
                page_url, page_html = fetch(client, url)
            except (httpx.HTTPError, ValueError):
                continue
            page = parse_page(page_html)
            all_links.extend(page.links)
            # Drop navigation/footer lines already seen on the homepage.
            lines = [line for line in page.lines() if line not in boilerplate]
            record["pages"].append({
                "url": page_url,
                "title": page.title.strip(),
                "meta_description": page.meta_description,
                "text": "\n".join(lines)[:MAX_PAGE_CHARS],
            })

    for href, _ in all_links:
        for network in ("linkedin.com/company", "facebook.com", "x.com", "twitter.com", "youtube.com"):
            if network in href and network.split(".")[0] not in record["social"]:
                record["social"][network.split(".")[0]] = href
    total_chars = sum(len(page["text"]) for page in record["pages"])
    if total_chars < 500:
        record["status"] = "thin"
        record["error"] = f"only {total_chars} characters of text (site may need JavaScript)"
    return record


def needs_crawl(sites_dir, place):
    path = sites_dir / f"{place['place_id']}.json"
    # Retry earlier failures (timeouts, TLS errors); keep everything else.
    return not path.exists() or json.loads(path.read_text())["status"] == "error"


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("city_config")
    parser.add_argument("--limit", type=int, help="Only crawl this many sites (for testing)")
    parser.add_argument("--workers", type=int, default=8, help="Sites crawled in parallel")
    parser.add_argument("--refresh", action="store_true", help="Re-crawl sites that already have a file")
    args = parser.parse_args()

    config = load_city(args.city_config)
    places = read_places(config)
    candidates = top_candidates(config, places)
    sites_dir = city_dir(config) / "sites"
    sites_dir.mkdir(parents=True, exist_ok=True)
    todo = [place for place in candidates if args.refresh or needs_crawl(sites_dir, place)]
    if args.limit:
        todo = todo[:args.limit]

    print(f"{len(places)} places -> {len(candidates)} top candidates within {config['radius_miles']} miles "
          f"with a website; {len(todo)} to crawl")

    counts = {}
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(crawl_site, place): place for place in todo}
        for done, future in enumerate(as_completed(futures), 1):
            record = future.result()
            (sites_dir / f"{record['place_id']}.json").write_text(json.dumps(record, indent=2))
            counts[record["status"]] = counts.get(record["status"], 0) + 1
            chars = sum(len(page["text"]) for page in record["pages"])
            note = record["error"][:60] if record["error"] else f"{len(record['pages'])} pages, {chars} chars"
            print(f"  [{done:>3}/{len(todo)}] {record['status']:<7} {record['name'][:40]:<40} {note}")

    print(f"\nDone: {counts}")


if __name__ == "__main__":
    main()
