# Fee Simple website

Public website for Talos Operations LLC. Plain HTML, CSS, and JavaScript, hosted
by Netlify at https://talosoperations.com. No framework, package installation,
or build step.

## Pages

- **Home** (`public/index.html`): the main product introduction, hero, and early-access form.
- **Coverage** (`public/coverage.html`): the county coverage map; future content is TBD.
- **Learn** (`public/learn/`): the original learning index and ten articles/placeholders.
- **Audience pages** (`public/for/`): the original seven use-case pages, accessible at their existing URLs.
- **Demo** (`public/demo/`): the restored sample-data demo, kept as the temporary
  version until the separately built replacement arrives.
- Privacy and Terms live in the footer. `404.html` handles missing pages on Netlify.

The original demo is restored as a self-contained section. Learn and audience content is restored under
`public/`, with its original text, styling, metadata, and noindex settings. Draft
pages remain accessible but excluded from search listings. `/ledger` still
redirects to Coverage. `docs/FACTS.md` holds sources supporting content claims.
`archive/content/` keeps the original snapshot and legacy generators for reference.

## Where to edit

| Change | File |
| --- | --- |
| Homepage text and signup form | `public/index.html` |
| Homepage layout | `public/assets/css/home.css` |
| Shared theme and browser defaults | `public/assets/css/site.css` |
| Globe animation, timing, interaction | `public/assets/js/hero.js` |
| Globe dot positions | `public/assets/data/hero-geometry.json` |
| Coverage page content | `public/coverage.html` |
| Coverage map appearance and interactions | `public/assets/css/coverage.css`, `public/assets/js/coverage.js` |
| County statuses and displayed statistics | `public/assets/data/coverage.json` |
| County boundaries (TopoJSON) | `public/assets/data/county-map.json` |
| Logo and icons | `public/assets/images/` (browser ICO stays at `public/favicon.ico`) |
| Learning and audience content | `public/learn/`, `public/for/` |
| Learning/audience styles | `public/assets/css/content.css` |
| Temporary demo pages, browser logic, and sample files | `public/demo/` (see `docs/demo.md`) |
| Legal text | `public/privacy.html`, `public/terms.html` |
| Legal/error page styles | `public/assets/css/legal.css`, `public/assets/css/error.css` |
| Search listings | `public/sitemap.xml`, `public/llms.txt`, `public/robots.txt` |
| Hosting and redirects | `netlify.toml` |

Only `public/` is published. `archive/`, `tools/`, `docs/`, and assistant instructions are
internal. Page URLs stay the same when files move inside the repository.

## Preview

From the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory public
```

Open http://localhost:8000. Serve `public/`, not the repository root. Opening HTML
directly from disk will not load root-relative assets and JSON correctly.

The hero loads its local geometry once. Coverage loads local data plus pinned D3
and TopoJSON libraries from a CDN. Pages use Google Fonts. No backend runs locally.
The signup form uses Netlify Forms; the local server cannot process submissions.
The demo runs entirely in the browser using fictitious samples and tab-local state;
it works on the local server without a backend.

## Check changes

With Python 3.11 or newer:

```sh
python3 tools/check_site.py
```

This checks local links/assets, JSON, coverage data, search listings, and the
publish directory. It does not replace browser checks. After changing JavaScript,
check its syntax with Node if installed, then preview desktop and phone layouts:

```sh
node --check public/assets/js/hero.js
node --check public/assets/js/coverage.js
```

When adding or removing pages, update navigation, `sitemap.xml`, and `llms.txt`.
These lists are maintained directly. Preserve existing noindex settings on drafts.
The old generators are archived for reference and assume the former repository
layout; adapt their output paths before using them. Active edits belong in `public/`.

## Optional geometry tool

`tools/gen_hero_geo.py` generates globe dot positions from Natural Earth GeoJSON.
It uses only Python's standard library. Input filenames and download locations
are documented in the script. It writes `public/assets/data/hero-geometry.json`
by default. Run it only when changing the geographic dot layout; it is not needed
for preview or deployment. Keep the input datasets outside the repository.

## Deployment

Netlify reads `netlify.toml` and publishes `public/`. Every push to `main` deploys
automatically. Local changes and commits on a feature branch do not update the
production site. Netlify handles the signup form and the custom 404 page.

© Talos Operations LLC. All rights reserved.
