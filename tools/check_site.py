#!/usr/bin/env python3
"""Check the built site in dist/ without network access or writes.

Run `npm run build` first. Requires Python 3.11+."""
import json
import math
import re
import sys
import tomllib
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'dist'
if not PUBLIC.is_dir():
    sys.exit('dist/ not found: run `npm run build` first')
DOMAIN = 'https://talosoperations.com'
errors = []


def error(file, message):
    errors.append(f'{file.relative_to(ROOT)}: {message}')


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path, self.ids, self.links, self.noindex = path, set(), [], False
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            if attrs['id'] in self.ids:
                error(self.path, f'duplicate id {attrs["id"]!r}')
            self.ids.add(attrs['id'])
        if tag == 'meta' and attrs.get('name', '').lower() == 'robots':
            self.noindex |= 'noindex' in attrs.get('content', '').lower()
        self.links.extend(value for key, value in attrs.items()
                          if key in ('href', 'src', 'action') and value)


pages = {path: Page(path) for path in sorted(PUBLIC.rglob('*.html'))}


def check_link(source, value, *, fragment=True):
    url = urlsplit(value)
    if url.scheme and url.scheme not in ('http', 'https'):
        return None
    if url.netloc and url.netloc != urlsplit(DOMAIN).netloc:
        return None
    path = unquote(url.path)
    target = (PUBLIC / path.lstrip('/') if path.startswith('/')
              else source.parent / path if path else source).resolve()
    if not target.is_relative_to(PUBLIC):
        error(source, f'link escapes the site: {value}')
        return None
    if target.is_dir():
        target /= 'index.html'
    if not target.is_file():
        error(source, f'missing target: {value}')
    elif fragment and url.fragment and target in pages:
        anchor = unquote(url.fragment).split(':~:text=')[0]
        if anchor and anchor not in pages[target].ids:
            error(source, f'missing fragment: {value}')
    return target


for path, page in pages.items():
    for link in page.links:
        check_link(path, link)
for path in PUBLIC.rglob('*.css'):
    for link in re.findall(r'url\(\s*[\'"]?([^\s\)\'";]+)', path.read_text()):
        check_link(path, link, fragment=False)
for path in PUBLIC.rglob('*.js'):
    source = path.read_text()
    # All literal /assets/ URLs, including arrays mapped into fetch(url).
    links = re.findall(r'''["'](/assets/[^"'\n]+)["']''', source)
    links += re.findall(r'''\bfetch\(\s*["']([^"'\n]+)["']''', source)
    for link in set(links):
        # Browser fetch paths are relative to a document, not its script file.
        check_link(PUBLIC / 'index.html', link, fragment=False)


def invalid_constant(value):
    raise ValueError(f'non-JSON numeric constant: {value}')


data = {}
for path in PUBLIC.rglob('*.json'):
    try:
        data[path.name] = json.loads(path.read_text(), parse_constant=invalid_constant)
    except (ValueError, OSError) as exc:
        error(path, f'invalid JSON: {exc}')
try:
    topology = data['county-map.json']
    fips_ids = {str(g['id']).zfill(5) for g in topology['objects']['counties']['geometries']}
    for fips, county in data['coverage.json']['counties'].items():
        if not re.fullmatch(r'\d{5}', fips) or fips not in fips_ids:
            error(PUBLIC / 'assets/data/coverage.json', f'unknown county FIPS: {fips}')
        if county['status'] not in ('live', 'surveyed'):
            error(PUBLIC / 'assets/data/coverage.json', f'invalid status for {fips}')
    for key in ('world', 'us'):
        values = data['hero-geometry.json'][key]
        if (not isinstance(values, list) or not values or len(values) % 2
                or not all(type(v) in (int, float) and math.isfinite(v) for v in values)):
            error(PUBLIC / 'assets/data/hero-geometry.json', f'invalid coordinate pairs: {key}')
except (KeyError, TypeError, AttributeError) as exc:
    error(PUBLIC / 'assets/data', f'missing or malformed map/hero data: {exc}')

try:
    demo_manifest = PUBLIC / 'demo/data/index.json'
    for run in data['index.json']['runs'].values():
        for asset in run['files'].values():
            check_link(demo_manifest, f'/demo/data/{run["dir"]}/{asset}', fragment=False)
except (KeyError, TypeError, AttributeError) as exc:
    error(PUBLIC / 'demo/data', f'missing or malformed demo data: {exc}')

try:
    config = tomllib.loads((ROOT / 'netlify.toml').read_text())
    if config.get('build', {}).get('publish') != 'dist':
        error(ROOT / 'netlify.toml', 'build.publish must be "dist"')
    demo_headers = next((rule['values'] for rule in config.get('headers', [])
                         if rule.get('for') == '/demo/*'), {})
    if demo_headers.get('X-Robots-Tag') != 'noindex, nofollow':
        error(ROOT / 'netlify.toml', 'demo must keep its noindex, nofollow header')
    sitemap = PUBLIC / 'sitemap.xml'
    urls = [node.text or '' for node in ET.parse(sitemap).iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
    listed = set()
    for url in urls:
        if not url.startswith(DOMAIN + '/'):
            error(sitemap, f'noncanonical URL: {url}')
        listed.add(check_link(sitemap, url))
    if len(urls) != len(set(urls)):
        error(sitemap, 'duplicate URLs')
    expected = {path for path, page in pages.items() if not page.noindex}
    for path in sorted(expected - listed):
        error(sitemap, f'indexable page missing: {path.relative_to(PUBLIC)}')
    for path in listed - expected:
        error(sitemap, f'nonindexable or non-HTML target: {path}')
    robots = PUBLIC / 'robots.txt'
    declared = re.findall(r'^Sitemap:\s*(\S+)', robots.read_text(), re.M | re.I)
    if declared != [DOMAIN + '/sitemap.xml']:
        error(robots, 'expected the canonical sitemap URL')
    llms = PUBLIC / 'llms.txt'
    for url in re.findall(r'\]\(([^)]+)\)', llms.read_text()):
        check_link(llms, url)
except (OSError, ValueError, ET.ParseError) as exc:
    error(ROOT, f'configuration/search files: {exc}')

if errors:
    print('\n'.join('ERROR: ' + message for message in errors))
    sys.exit(1)
print(f'PASS: {len(pages)} pages, {len(data)} JSON files, local links, search files, and hosting config.')
