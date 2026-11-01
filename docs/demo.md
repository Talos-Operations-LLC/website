# Temporary product demo

The original demo is restored at `/demo/` until the separately developed replacement
is ready. Its files stay together under `public/demo/` so the section can be swapped
out without disturbing the marketing site.

- `index.html`: sample Run page.
- `workbench/index.html`: verification workbench and document viewer.
- `ld-capture/index.html`: legal-description capture flow.
- `demo.js`: browser adapter that answers the pages' `/api/` calls using sample data.
- `data/index.json`: generated sample manifest, canned history, and runnable address.
- `data/r01/` through `r06/`: sample PDFs, CSVs, screenshots, and rendered PDF pages.

All sample streets, owners, parcel numbers, book/page references, and deed text are
fictitious. Keep the generated dataset intact; do not substitute real records.
Edits and runs are held in this tab's session storage. Restart demo clears that
state. There is no live lookup, backend, or account connection.

Restored from the parent of demo-removal commit `5d7ef05`. The supplied demo layout
and inline styles/scripts are retained because this is a generated, temporary
bundle. Integration changes update icon paths and add a Website return link.

The marketing navigation links to `/demo/`. Demo pages remain noindex/nofollow;
Netlify restores the demo's CSP, noindex response header, and revalidation policy.
The demo is intentionally absent from sitemap.xml and llms.txt.

Preview at http://localhost:8000/demo/. Run a listed sample address, then open the
result in Workbench and LD capture. The plain Python preview does not emulate
Netlify response headers; hosting settings are validated from netlify.toml.
