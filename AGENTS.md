# Website

Public website for Talos Operations LLC's Fee Simple product, plus the static
product demo at `/demo`.

Astro, built to static HTML by Netlify on every push to `main`. One dependency,
pinned. `BUILD.md` explains the build; `README.md` says where to edit.

## Site direction

Home, Coverage, Learn, and the Demo link. The home page and its globe hero are the
priority. The demo at `public/demo/` is the Fee Simple workbench snapshot.

`src/content/learn/` and `src/content/for/` are kept. Preserve their noindex
settings on draft pages; do not delete this content. Privacy and Terms are footer
pages.

## Demo data

`public/demo/` contains five captured North Carolina public-record searches.
Publish only the reviewed snapshot: 595 evidence files, static HTML captures,
redacted financial account numbers, and no internal worksheet inputs or session data.
Keep the public-data checks and noindex headers. See `docs/demo.md`.

## Structure

- `src/`: pages, layout, components, Markdown content, page lists.
- `public/assets/`: `css/`, `js/`, `data/`, `images/`. Styles are plain files
  linked from each page, not bundled.
- `docs/FACTS.md`: sources for factual claims on the site.
- `tools/`: optional Python helpers, not part of the build.

## Working on the site

`npm ci`, then `npm run dev` to preview at http://localhost:4321. After changes,
`npm run build` and `python3 tools/check_site.py`. Keep URLs unchanged. Preserve
the Netlify form attributes and the `/ledger` redirects.

Do not commit, push, open a PR, or deploy unless Ethan asks.
