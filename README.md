# Website

Public website for Talos Operations LLC's deed tool. Currently a coming-soon placeholder while the product site is built out.

## Stack

Static HTML/CSS — no build step, no dependencies.

## Structure

| File | Purpose |
| --- | --- |
| `index.html` | Coming-soon landing page |
| `404.html` | Not-found page (served automatically by Netlify) |
| `netlify.toml` | Publish directory + security headers |
| `demo/` | The product demo at /demo: the app's own pages with a stand-in server in the browser and sample data (public parcels only). Built by a script in the product repo; do not hand-edit. |

## Local development

Open `index.html` directly in a browser, or serve the folder:

```
python -m http.server 8000
```

## Deployment

Connected to Netlify — every push to `main` deploys automatically.

---

© Talos Operations LLC. All rights reserved.
