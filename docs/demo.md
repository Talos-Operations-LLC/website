# Fee Simple workbench demo

The static workbench at `/demo/` replaces the former Run, Workbench and LD Capture demo.
Old Workbench and LD Capture URLs redirect to the new entry point. Astro copies the
snapshot unchanged into `dist/demo/`; Netlify deploys website `main`.

Five real North Carolina properties are replayed from captured public records.
Old Beulah Road, the trust transfer, and the ownership-change example are preloaded;
two additional properties can be searched. Search includes all 100 NC counties,
a globe-to-parcel map, and a step-by-step replay. Each property has its verdict,
findings, chain, mortgages, documents, parcel map and record-pack export.

The runtime is plain HTML, CSS and JavaScript. `records.js` supplies captured results,
`model.js` builds property models, and `app.js` routes views. `property-view.*` renders
Overview; `search-map.js` uses MapLibre, and property maps use Leaflet. PDF.js renders
saved PDFs; JSZip exports records. Vendor licenses are included.

## Public snapshot

The 108 evidence files are allowlisted by `manifest.js`. The source pack was reviewed
with text scans, OCR of 74 PDF pages and 28 images, and visual checks of flagged pages.
Four bank-account/loan-number regions in three instruments are permanently redacted.
Parcel, tax-account, book/page and recorded instrument identifiers remain.
Internal worksheet comparisons, machine/capture paths and the Zillow capture are
excluded. The captured verdict statuses are preserved, including Needs review;
private comparison inputs behind that status are not distributed.
HTML evidence is converted to inert, self-contained readable captures, removing
portal scripts, forms, hidden inputs, session attributes and external resources.
The account defaults to the fictional Alex Morgan with no email or phone number.
No working credentials, backend, email delivery, live property lookup or integrations
are included. Requests and generated example API keys remain in browser local storage.
Restart clears all five demo-owned storage keys and restores the three saved properties.

Regenerate with `demo/export_public_snapshot.py <website checkout>` in the product
repository after reviewing any changed records. Do not copy raw source captures.
Run `npm run build` and `python3 tools/check_site.py`; the checks validate the exact
manifest, evidence byte counts, retired-demo removal, links and hosting configuration.

The demo stays out of search indexes and the sitemap. Its CSP allows only local code
and the two Esri tile hosts used by the maps. Open `/demo/` to check Search, a property,
a PDF, an export, Settings and Restart. The footer identifies captured demo records.
