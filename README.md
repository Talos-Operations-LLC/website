# Website

Public website for Talos Operations LLC's deed tool.

The old local demo has been removed. A replacement demo is being built separately
and will be integrated when it is ready.

## Stack

Static HTML/CSS — no build step, no dependencies.

## Structure

| File | Purpose |
| --- | --- |
| `index.html` | Coming-soon landing page |
| `404.html` | Not-found page (served automatically by Netlify) |
| `netlify.toml` | Publish directory + security headers |

## Local development

Open `index.html` directly in a browser, or serve the folder:

```
python -m http.server 8000
```

## Deployment

Connected to Netlify — every push to `main` deploys automatically.

---

© Talos Operations LLC. All rights reserved.
