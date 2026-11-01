# Website

Public website for Fee Simple, built by Talos Operations LLC.

## Stack

Astro, built to static HTML. One dependency (`astro`, exact pin). See `BUILD.md`.

## Structure

| Path | Purpose |
| --- | --- |
| `src/pages/` | One file per page; the path is the URL |
| `src/layouts/Base.astro` | Shared head, meta, canonical, JSON-LD, nav, footer |
| `src/components/` | Nav and footer |
| `src/styles/site.css` | Sitewide stylesheet |
| `public/` | Copied to the site as-is: favicon, images, `map-data.js`, `demo/` |
| `public/demo/` | The product demo at /demo: the app's own pages with a stand-in server in the browser and sample data (public parcels only). Built by a script in the product repo; do not hand-edit. |
| `netlify.toml` | Build command, security headers, redirects |

## Local development

```
npm ci
npm run dev
```

## Deployment

Connected to Netlify — every push to `main` builds and deploys automatically.

---

© Talos Operations LLC. All rights reserved.
