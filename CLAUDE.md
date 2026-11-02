# Website

Public website for Talos Operations LLC's Fee Simple product, plus the temporary
product demo at `/demo`.

Astro, built to static HTML by Netlify on every push to `main`. One dependency,
pinned. `BUILD.md` explains the build; `README.md` says where to edit.

## Site direction

Home, Coverage, Learn, and the Demo link. The home page and its globe hero are the
priority. The demo at `public/demo/` is the original sample-data demo, kept until
the replacement being built separately arrives.

`src/content/learn/` and `src/content/for/` are kept. Preserve their noindex
settings on draft pages; do not delete this content. Privacy and Terms are footer
pages.

## Demo data

`public/demo/data/` is entirely fictitious sample data: invented streets, owners,
parcel numbers, book/page references and deed text. Nothing in it comes from a real
parcel, person or recorded instrument, and it must stay that way. The demo is a
public page. The set is generated, not hand-edited; see `docs/demo.md`.

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

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
