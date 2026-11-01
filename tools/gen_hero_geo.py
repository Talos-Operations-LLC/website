#!/usr/bin/env python3
"""gen_hero_geo.py: generates the home page's dot geometry as JSON.

  world  land dots on an even grid: one row every WORLD_STEP degrees of latitude,
         longitudes spaced WORLD_STEP/cos(lat) apart so the dots sit evenly on the
         globe. The continental US is cut out (it has its own set) and lakes are cut out.
  us     the continental US on a finer, jittered grid (US_STEP degrees), lakes cut out.

Inputs are Natural Earth GeoJSON (public domain), downloaded separately and kept out of
the repo, from https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ :
  ne_110m_land.geojson              world coastlines
  ne_50m_admin_0_countries.geojson  the US border
  ne_50m_lakes.geojson              lakes (the Great Lakes shape the US silhouette)

Run:  python3 tools/gen_hero_geo.py <land.geojson> <countries.geojson> <lakes.geojson> [output.json]
Default output: public/assets/data/hero-geometry.json, relative to this repository.
The site reads the committed JSON directly; this is an optional development tool,
not a build step. Re-run only when changing the geographic dot layout, then review the diff.
"""
import bisect
import json
import math
import random
import sys
from pathlib import Path

WORLD_STEP = 1.0          # degrees between globe dots
US_STEP = 0.28            # degrees between US dots
US_JITTER = 0.32          # fraction of US_STEP each US dot is nudged, so the grid reads organic
US_BBOX = (-125.5, 24.0, -66.0, 49.8)   # lon0, lat0, lon1, lat1: the contiguous states only
SEED = 7                  # fixed so re-runs produce the same geometry


def polygons(geom):
    """A geometry as a list of polygons, each a list of rings, each a list of (lon, lat)."""
    kind, coords = geom["type"], geom["coordinates"]
    polys = [coords] if kind == "Polygon" else coords if kind == "MultiPolygon" else []
    return [[[(float(pt[0]), float(pt[1])) for pt in ring] for ring in poly] for poly in polys]


def load_polygons(path, keep=lambda feature: True):
    data = json.loads(Path(path).read_text())
    out = []
    for feature in data["features"]:
        if keep(feature):
            out.extend(polygons(feature["geometry"]))
    return out


def edges_of(polys):
    """Every non-horizontal edge of every ring, for scanline crossings."""
    edges = []
    for poly in polys:
        for ring in poly:
            for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1]):
                if y1 != y2:
                    edges.append((x1, y1, x2, y2))
    return edges


def row_crossings(edges, y):
    """Sorted x positions where the latitude line y crosses the polygon outlines."""
    xs = []
    for x1, y1, x2, y2 in edges:
        if (y1 <= y < y2) or (y2 <= y < y1):
            xs.append(x1 + (y - y1) * (x2 - x1) / (y2 - y1))
    xs.sort()
    return xs


def inside_row(xs, x):
    return bisect.bisect_left(xs, x) % 2 == 1


def ring_boxes(polys):
    rings = []
    for poly in polys:
        for ring in poly:
            lons = [p[0] for p in ring]
            lats = [p[1] for p in ring]
            rings.append((min(lons), min(lats), max(lons), max(lats), ring))
    return rings


def inside(rings, x, y):
    """Even-odd point-in-polygon over every ring whose box contains the point."""
    hit = False
    for x0, y0, x1, y1, ring in rings:
        if x < x0 or x > x1 or y < y0 or y > y1:
            continue
        n = len(ring)
        for i in range(n):
            ax, ay = ring[i]
            bx, by = ring[(i + 1) % n]
            if (ay <= y < by) or (by <= y < ay):
                if x < ax + (y - ay) * (bx - ax) / (by - ay):
                    hit = not hit
    return hit


def is_usa(feature):
    props = feature["properties"]
    return "United States of America" in (props.get("ADMIN", ""), props.get("NAME", "")) \
        or props.get("ISO_A3") == "USA" or props.get("ADM0_A3") == "USA"


def contiguous(polys):
    """Drop Alaska, Hawaii and the islands: keep parts whose centre lies in the US box."""
    lon0, lat0, lon1, lat1 = US_BBOX
    kept = []
    for poly in polys:
        ring = poly[0]
        cx = sum(p[0] for p in ring) / len(ring)
        cy = sum(p[1] for p in ring) / len(ring)
        if lon0 <= cx <= lon1 and lat0 <= cy <= lat1:
            kept.append(poly)
    return kept


def world_dots(land_edges, us_rings):
    """Even dots over land, skipping the contiguous US. Returns flat [lon*10, lat*10, ...]."""
    out = []
    rows = int(180 / WORLD_STEP)
    for i in range(rows):
        lat = -90 + (i + 0.5) * WORLD_STEP
        n = max(1, round(360 * math.cos(math.radians(lat)) / WORLD_STEP))
        xs = row_crossings(land_edges, lat)
        shift = 0.5 if i % 2 else 0.0       # alternate rows offset half a step: a hex look
        for k in range(n):
            lon = -180 + (k + 0.5 + shift) * 360 / n
            if lon >= 180:
                lon -= 360
            if not inside_row(xs, lon):
                continue
            if inside(us_rings, lon, lat):
                continue
            out.extend((round(lon * 10), round(lat * 10)))
    return out


def us_dots(us_rings, lake_rings):
    """Jittered fine dots over the contiguous US. Returns flat [lon*100, lat*100, ...]."""
    rng = random.Random(SEED)
    out = []
    lon0, lat0, lon1, lat1 = US_BBOX
    rows = int((lat1 - lat0) / US_STEP)
    for i in range(rows):
        lat = lat0 + (i + 0.5) * US_STEP
        step_lon = US_STEP / math.cos(math.radians(lat))
        n = int((lon1 - lon0) / step_lon)
        shift = 0.5 if i % 2 else 0.0
        for k in range(n):
            lon = lon0 + (k + 0.5 + shift) * step_lon
            jlon = lon + rng.uniform(-US_JITTER, US_JITTER) * step_lon
            jlat = lat + rng.uniform(-US_JITTER, US_JITTER) * US_STEP
            if not inside(us_rings, jlon, jlat) or inside(lake_rings, jlon, jlat):
                continue
            out.extend((round(jlon * 100), round(jlat * 100)))
    return out


def main():
    if len(sys.argv) not in (4, 5):
        raise SystemExit(__doc__)
    land_path, countries_path, lakes_path = sys.argv[1:4]
    output = Path(sys.argv[4]) if len(sys.argv) == 5 else Path(__file__).resolve().parent.parent / "public/assets/data/hero-geometry.json"

    land = load_polygons(land_path)
    lakes = load_polygons(lakes_path)
    usa = contiguous(load_polygons(countries_path, is_usa))
    if not usa:
        raise SystemExit("no contiguous US polygon found in " + countries_path)

    # lakes sit inside land, so folding their edges into the land scanline cuts them out (even-odd)
    world = world_dots(edges_of(land + lakes), ring_boxes(usa))
    us = us_dots(ring_boxes(usa), ring_boxes(lakes))

    geo = {"ws": WORLD_STEP, "uss": US_STEP, "world": world, "us": us}
    blob = json.dumps(geo, separators=(",", ":"))
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(blob + "\n", encoding="utf-8")
    print(f"world {len(world) // 2} dots, us {len(us) // 2} dots, {len(blob)} bytes -> {output}")


if __name__ == "__main__":
    main()
