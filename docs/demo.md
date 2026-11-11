# Fee Simple workbench demo

The static workbench at `/demo/` replaces the former Run, Workbench and LD Capture demo.
Old Workbench and LD Capture URLs redirect to the new entry point. Astro copies the
snapshot unchanged into `dist/demo/`; Netlify deploys website `main`.

Five real North Carolina properties are replayed from captured public records.
Old Beulah Road, the trust transfer, and the ownership-change example are preloaded;
two additional properties can be searched. Search includes all 100 NC counties,
address and parcel search, a globe-to-parcel map, and a step-by-step replay. Each property has its verdict,
findings, chain, mortgages, documents, parcel map and record-pack export.
All five properties use the same Overview and Title chain layouts with their own
saved facts and source links. Owner search is not a search mode.

The demo is the Fee Simple production app built to run with no server, so it looks and
works like the product: the same Home, Search, Properties, property tabs, title report,
Settings and light and dark themes. `index.html` loads the bundled app from `assets/`;
`data/demo.json` supplies the five captured property records, and the app answers its
own searches from them in the browser. Routes sit after the `#`. The search globe uses
MapLibre and property maps use Leaflet; PDF.js renders saved PDFs with the plain
JavaScript decoders in `pdf/`, because the demo's content policy does not allow wasm;
JSZip exports records. `THIRD-PARTY-LICENSES.txt` carries the bundled packages' licenses.

## Public snapshot

The shared covenant document and index are stored once for the four Wake properties.
The 589 evidence files are allowlisted by `data/manifest.js`. The source pack was reviewed
with text scans, OCR of 670 newly added PDF pages and 79 images, comparison against
previously reviewed files, barcode detection, and visual checks of flagged pages.
Financial account, loan, mortgage-system and related barcode identifiers in 53
instruments are permanently redacted. People's names, company names, street addresses
other than the five demonstration properties, contact details and personal descriptors
are blacked out in the screens, records, PDFs and images (243 documents carry pixel
redactions, from OCR plus a page-by-page hand review); evidence files once saved under
a person's name are renamed. The originals remain in the product repository.
Parcel, tax-account, book/page and recorded instrument identifiers remain.
Internal worksheet comparisons, machine/capture paths and the Zillow capture are
excluded. The captured verdict statuses are preserved, including Needs review;
private comparison inputs behind that status are not distributed.
HTML evidence is converted to inert, self-contained readable captures, removing
portal scripts, forms, hidden inputs, session attributes and external resources.
The account defaults to the fictional Alex Morgan with no email or phone number.
No working credentials, backend, email delivery, live property lookup or integrations
are included. Requests and generated example API keys remain in browser local storage.
Restart clears the demo's saved settings, notes, review marks, recent list and finished
searches, and restores the three saved properties.

Regenerate with `apps/demo/tools/export_public_snapshot.py <website checkout>` in the product
repository after reviewing any changed records. Do not copy raw source captures.
Run `npm run build` and `python3 tools/check_site.py`; the checks validate the exact
manifest, evidence byte counts, all snapshot hashes in docs/demo-review.json,
retired-demo removal, links and hosting configuration.

Captured HTML under public/demo/files/ is excluded from GitHub language statistics;
the demo index remains application HTML.

The demo stays out of search indexes and the sitemap. Its CSP allows only local code
and the two Esri tile hosts used by the maps. Open `/demo/` to check Search, a property,
a PDF, an export, Settings and Restart. The top bar's About this demo and Restart demo
buttons identify it as captured demo records.
