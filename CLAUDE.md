# Fee Simple website

Public website for Talos Operations LLC. Main navigation: Home, Coverage, Learn,
and Demo. The homepage and hero are the priority. The original sample-data demo
is restored at `public/demo/` as a temporary version until its replacement arrives. Privacy and Terms are
footer pages. Learn and audience content is restored in `public/learn/` and
`public/for/`, including its original SEO metadata. Keep Learn in navigation.
Preserve noindex settings on draft pages; do not delete this content.

## Shared memory

Use `/Users/ethanriddle/ai-memory`. At session start, pull with `--ff-only`, preserving
local changes; if sync fails, report it and read locally. Read `codex/global-AGENTS.md`,
`shared/SHARED.md`, every @-referenced shared note, and `claude/website/MEMORY.md` plus
relevant project notes. Verify memories against disk. Save durable notes in the
existing memory folders, keep the index current, and never store secrets or firm
data. Commit or push memory only when Ethan asks.

## Structure

- `public/` is the entire deployed website. Keep internal files outside it.
- `public/assets/css/`: shared defaults plus page-specific styles.
- `public/assets/js/`: hero and coverage behavior.
- `public/assets/data/`: hero geometry, county geometry, and coverage statuses.
- `public/assets/images/`: the supplied logo and icons.
- `public/demo/`: self-contained temporary demo, browser adapter, and generated fictitious data.
  Keep its data intact; see `docs/demo.md`. Preserve its noindex metadata and Netlify headers.
- `tools/`: optional Python development helpers, not a build system.
- `docs/FACTS.md`: sources supporting content claims, not current coverage data.
- `archive/content/`: original snapshot and legacy generators for reference; edit active pages under `public/`.

Plain HTML/CSS/JS. No framework, build step, or npm dependencies. Coverage uses
pinned CDN D3/TopoJSON; fonts come from Google Fonts. Preserve existing behavior
when reorganizing code. Keep legal wording unchanged unless specifically asked.
Public demo samples must remain entirely fictitious.

## Working on the site

Read `README.md` for file ownership and commands. Preview with:

`python3 -m http.server 8000 --bind 127.0.0.1 --directory public`

Run `python3 tools/check_site.py` (Python 3.11+) after structural/content changes.
Check changed JavaScript syntax and verify affected behavior in the browser.
Update navigation, sitemap, and llms.txt when pages change. Preserve the Netlify
form attributes and existing `/ledger` redirects. Follow applicable available
skills; do not install tooling merely to satisfy a stale skill name.

Netlify publishes `public/` on pushes to `main`. Do not commit, push, open a PR,
or deploy unless Ethan asks. Preserve other sessions' uncommitted work.
