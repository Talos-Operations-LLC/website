# Build

The site is written in Astro and built into plain HTML. Netlify runs the build on
every deploy and serves the result. Nothing runs on the server: what's in `dist/`
after a build is exactly what visitors get.

## What the build does

- **`src/pages/`** — each `.astro` file becomes one HTML page at the same path
  (`coverage.astro` → `/coverage.html`, `learn/index.astro` → `/learn/`).
- **`src/layouts/` and `src/components/`** — the shared head, nav and footer.
  Every page uses them, so a nav or footer change is made once.
- **`src/styles/site.css`** — the sitewide stylesheet, bundled into `/_astro/`.
- **`public/`** — copied into `dist/` byte for byte. Nothing in it is processed.

## Run it locally

Needs Node 22 or newer.

```
npm ci              # install the exact versions in package-lock.json
npm run dev         # live preview at http://localhost:4321, reloads on save
npm run build       # write the finished site to dist/
npm run preview     # serve dist/ at http://localhost:4321
```

## Check the built output against the source

The HTML is built uncompressed so it can be read and diffed.

```
npm run build
diff -rq public dist          # every file in public/ must appear unchanged
diff old-page.html dist/x.html
```

To compare against what is live now, check out `main` in a second folder and diff
its files against `dist/`.

## Generated files: never hand-edit

- **`public/demo/`** — the product demo at `/demo`. Built by a script in the
  hoa-tool repo; run it with this repo's `public/` folder as the checkout path:
  `python tools/demo/build_demo.py C:\talos-website\public <data dir>`.
  It replaces `public/demo/` wholesale, so hand edits are lost.
- **`public/map-data.js`** — the pre-projected county map used by `/coverage.html`.

Both pass through the build untouched.

## Versions

Astro is pinned to an exact version and `package-lock.json` is committed, so every
build — local or Netlify — uses the same code. Upgrade deliberately, in its own
change.
