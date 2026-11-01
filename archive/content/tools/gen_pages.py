# gen_pages.py: generates 15 static pages for the Fee Simple site.
#   learn/  Pages 4, 5, 7, 8 (full answer pages) and 1, 2, 6, 10 (legal-review placeholders, noindex)
#   for/    the 7 use-case pages (noindex)
#
# Inputs: the page content defined in PAGES below, plus the shared chrome (head, nav, footer,
# CTA) defined at the top, which mirrors the hand-written template learn/grantor-vs-grantee/.
# FAQ entries produce both the visible FAQ and the FAQPage JSON-LD, so the two always match.
# Not generated: learn/index.html (hub), learn/grantor-vs-grantee/, learn/nc-property-owner-lookup/.
#
# The output HTML is committed. There is no build step: Netlify serves the committed files, and
# this script is only a convenience for regenerating them. Edit PAGES, re-run, review the diff.
#
# Run from the repo root:  python tools/gen_pages.py
import html, json, os

DOMAIN = "https://talosoperations.com"
FONTS = "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;600;700&display=swap"

LEARN_TITLES = {
    "nc-property-owner-lookup": "How to find out who owns a property in NC from county records",
    "deed-vs-tax-card": "Deed vs. tax card: why they disagree",
    "county-record-lag": "Why county ownership records lag behind sales",
    "grantor-vs-grantee": "Grantor vs. grantee: reading a deed index",
    "chain-of-title-nc": "What is a chain of title, and how is one checked in NC?",
    "llc-property-owner-nc": "Finding the owner behind an LLC-owned property in NC",
    "verify-mailing-address": "How to verify a mailing address before a collections notice",
    "15-day-letter-nc": "What is a 15-day letter in NC?",
    "ncgs-47f-3-116": "N.C.G.S. § 47F-3-116: what the statute says",
    "hoa-collections-process-nc": "How the NC HOA collections process works",
}
FOR_TITLES = {
    "hoa-management": "Fee Simple for HOA management companies",
    "hoa-eye": "HOA-EYE",
    "attorneys": "Fee Simple for HOA collections attorneys",
    "title-update": "Fee Simple for title updates",
    "investors": "Fee Simple for real estate investors",
    "foreclosure-trustees": "Fee Simple for foreclosure trustees",
    "self-managed-hoas": "Fee Simple for self-managed HOAs",
}

NAV = """  <nav class="nav" aria-label="Primary">
    <a class="wordmark" href="/">Fee Simple</a>
    <div class="links">
      <a href="/">[home]</a>
      <a href="/coverage.html">[coverage]</a>
      <a href="/learn/"{learn_cls}>[learn]</a>
    </div>
  </nav>"""

FOOTER = """  <footer class="footer">
    Talos Operations LLC · <a href="mailto:info@talosoperations.com">info@talosoperations.com</a> · <a href="https://www.linkedin.com/company/talos_operations/" target="_blank" rel="me noopener noreferrer">LinkedIn</a>
  </footer>"""

CTA_DEFAULT = "Fee Simple reads the county tax card and the recorded deed for a parcel and returns the owner of record and mailing address, matched by parcel."


def esc(s):
    return html.escape(s, quote=False)


def faq_jsonld(faq):
    data = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}}
            for q, a in faq
        ],
    }
    return '<script type="application/ld+json">\n' + json.dumps(data, indent=2, ensure_ascii=False) + "\n</script>\n"


def related_link(path):
    if path.startswith("/learn/"):
        title = LEARN_TITLES[path.split("/")[2]]
    else:
        title = FOR_TITLES[path.split("/")[2]]
    return f'        <li><a href="{path}">{esc(title)}</a></li>'


def page(p):
    url = f"{DOMAIN}{p['path']}"
    title = f"{p['title']} — Fee Simple"
    head = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{esc(title)}</title>
<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
"""
    if p.get("noindex"):
        head += f'<meta name="robots" content="noindex">\n<!-- {p["noindex"]} -->\n'
    head += f"""<meta name="description" content="{html.escape(p['desc'])}">
<link rel="canonical" href="{url}">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(p['desc'])}">
<meta property="og:type" content="article">
<meta property="og:url" content="{url}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="{FONTS}" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css">
"""
    if p.get("jsonld", True):
        head += faq_jsonld(p["faq"])
    else:
        head += "<!-- FAQPage JSON-LD is added when the FAQ wording is approved. Placeholder text never goes into structured data. -->\n"
    head += "</head>\n"

    learn_cls = ' class="active"' if p["path"].startswith("/learn/") else ""
    crumb = p["crumb"]
    if p["path"].startswith("/learn/"):
        crumb_html = f'    <p class="crumb"><a href="/learn/">[learn]</a> / {esc(crumb)}</p>'
    else:
        crumb_html = f'    <p class="crumb"><a href="/">[home]</a> / {esc(crumb)}</p>'

    faq_html = "\n\n".join(f"      <h3>{esc(q)}</h3>\n      <p>{esc(a)}</p>" for q, a in p["faq"])
    rel = "\n".join(related_link(r) for r in p["related"])

    body = f"""<body>
<div class="wrap">

{NAV.format(learn_cls=learn_cls)}

  <main>
  <article class="learn">

{crumb_html}

    <h1>{esc(p['h1'])}</h1>

    <p class="answer">{p['answer']}</p>

{p['sections'].strip(chr(10))}

    <section class="faq" aria-labelledby="faq-heading">
      <h2 id="faq-heading">Frequently asked questions</h2>

{faq_html}
    </section>

    <div class="cta-box">
      <p>{esc(p.get('cta', CTA_DEFAULT))}</p>
      <a class="btn btn-primary" href="/#early-access">Request early access</a>
    </div>

    <nav class="related" aria-labelledby="related-heading">
      <h2 id="related-heading">[related]</h2>
      <ul>
{rel}
      </ul>
    </nav>

  </article>
  </main>

{FOOTER}

</div>
</body>
</html>
"""
    out = p["path"].strip("/") + "/index.html"
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8", newline="\n") as f:
        f.write(head + body)
    print("wrote", out)


PAGES = []

# ---------------------------------------------------------------- Page 4
PAGES.append(dict(
    path="/learn/deed-vs-tax-card/",
    title="Deed vs. tax card: why they disagree",
    desc="The deed is the recorded source document; the tax card is the tax office's working copy. Why the two disagree after a sale, over name formats and over mailing addresses.",
    crumb="deed vs. tax card",
    h1="Why don't the deed and the tax card show the same owner?",
    answer="The deed is the recorded source document: it says who took title and when. The tax card is the county tax office's working record, updated after the deed is processed. The two disagree most often right after a sale, and also over name formatting, multiple owners, and mailing-address changes that never reach the county.",
    sections="""
    <h2>What is each record, and which office keeps it?</h2>
    <p>The deed is the document that transfers ownership. After closing it is recorded at the county Register of Deeds, which indexes it under the names of the grantor and grantee and assigns it a book and page. The recorded deed is the source document for who took title and when.</p>
    <p>The tax card is the county tax office's record for a parcel, kept for listing and taxing property. It carries the owner's name, a mailing address, the property address, the parcel number and the assessed value. The tax office updates the owner after a deed is recorded: the tax card follows the deed rather than creating ownership.</p>

    <h2>Why do they disagree right after a sale?</h2>
    <p>The deed is recorded first. The tax office processes the transfer afterward, in a separate system, so the tax card can still show the previous owner after the new deed is recorded. <a href="/learn/county-record-lag/">Why county records lag behind sales</a> covers that window.</p>

    <h2>How do name formats make the same owner look different?</h2>
    <ul>
      <li><strong>Name order.</strong> Deed indexes list people last name first, and tax cards can too, while the deed itself is written in natural order.</li>
      <li><strong>Two owners.</strong> Two owners can appear as separate rows in the deed index and as one line joined with "&amp;" on the tax card.</li>
      <li><strong>Trusts.</strong> A property held in trust may be listed under the trust's name, the trustee's name, or both.</li>
      <li><strong>Entities.</strong> Punctuation differs between records: periods in initials, commas before "INC".</li>
    </ul>

    <h2>Why is the mailing address a separate question?</h2>
    <p>The tax card's mailing address is where the county sends the tax bill. It is a separate field from the property address, and it isn't part of the deed's conveyance. Owners who move, rent the property out or sell may never update it with the county. <a href="/learn/verify-mailing-address/">Verifying a mailing address</a> describes how it's checked.</p>

    <h2>How do you check both, and what does a match look like?</h2>
    <ol>
      <li>Pull the tax card for the property address and note the owner, mailing address and parcel number.</li>
      <li>Find the most recent deed for the parcel, from the book and page on the tax card or by searching the grantee index for the owner's name.</li>
      <li>Compare the deed's grantee name with the tax card owner, allowing for the format differences above.</li>
      <li>Compare the deed's property description with the tax card's parcel reference.</li>
      <li>Check the deed's recording date against the sale date on the tax card, if the card shows one.</li>
    </ol>
    <p>A match means the grantee on the most recent deed is the owner on the tax card, allowing for formatting, and the parcel references agree.</p>
""",
    faq=[
        ("Which record is \"right\"?", "They answer different questions. The recorded deed is the source document for who took title; the tax card is the tax office's working copy, which follows the deed. A disagreement right after a sale can mean the tax card hasn't caught up yet."),
        ("How long until the tax card catches up?", "It varies by county and by how each tax office processes transfers. Fee Simple doesn't publish a figure yet. [ELIJAH: observed range from the assessor-lag data, labeled as observed]"),
        ("Does a mismatch mean fraud?", "A mismatch on its own doesn't indicate fraud. Timing and name formatting both produce mismatches, as ordinary results of two offices keeping separate records."),
    ],
    related=["/learn/nc-property-owner-lookup/", "/learn/county-record-lag/", "/learn/verify-mailing-address/", "/for/hoa-management/"],
))

# ---------------------------------------------------------------- Page 5
PAGES.append(dict(
    path="/learn/county-record-lag/",
    title="Why county ownership records lag behind sales",
    desc="After a sale, the deed is recorded at the Register of Deeds and the tax office processes the transfer separately. Why the tax card can still show the previous owner, and how the gap shows up.",
    crumb="record lag",
    h1="Why do county ownership records lag behind sales?",
    answer="When a property sells in North Carolina, the deed is recorded and indexed at the Register of Deeds. The county tax office then processes the transfer separately, so the tax card can still show the previous owner after the new deed is recorded. Anyone mailing to the tax-card address during that window may be mailing to someone who has moved.",
    sections="""
    <h2>What path does a deed travel after closing?</h2>
    <ol>
      <li><strong>Closing.</strong> The seller signs the deed to the buyer.</li>
      <li><strong>Recording.</strong> The deed is presented to the county Register of Deeds, recorded and given a book and page.</li>
      <li><strong>Indexing.</strong> The deed is entered in the grantor and grantee index, where it becomes searchable by name.</li>
      <li><strong>Tax office transfer.</strong> The county tax office updates the owner on the tax card, and the mailing address if a new one is supplied.</li>
    </ol>

    <h2>Where does the lag come from?</h2>
    <p>Recording and the tax transfer happen in separate offices, in separate systems, each on its own schedule. Until the tax office processes the transfer, the tax card reflects the owner before the sale.</p>
    <p>Third-party copies of county data can trail further. A statewide parcel dataset reflects the date it was last refreshed: in one case we checked, it showed no sales after the end of 2025, about eight months behind the county's own records.</p>

    <h2>What does a "last action" date on a tax card mean?</h2>
    <p>Some county tax cards print a "last action" date for the record. A sale recorded after that date may not be reflected on the card yet.</p>

    <h2>How does the lag show up in practice?</h2>
    <ul>
      <li>Mail to the tax-card address comes back, or is forwarded.</li>
      <li>Notices go out addressed to the previous owner.</li>
      <li>The new owner doesn't receive mail sent from county records.</li>
      <li>A sale appears in the deed index but not yet on the tax card.</li>
    </ul>
    <p><a href="/learn/verify-mailing-address/">Verifying a mailing address</a> describes the check that catches this before a mailing.</p>
""",
    faq=[
        ("How long is the lag typically?", "It varies by county and over the year, and Fee Simple doesn't publish a figure yet. In one case observed in our runs, a county tax card still showed the previous owner five days after the new deed was recorded. [ELIJAH: observed ranges from the assessor-lag data, labeled as observed]"),
        ("Does every county lag the same?", "Not in what we've observed. Each county's tax office processes transfers in its own system, and the gaps we've seen differ: a tax card still behind five days after recording in one county, and at least seven days in another."),
        ("Is the deed index also delayed?", "In the cases we've observed, the deed index has been ahead of the tax card, not behind it. It is the record the tax card updates from."),
    ],
    related=["/learn/deed-vs-tax-card/", "/learn/verify-mailing-address/", "/learn/nc-property-owner-lookup/", "/for/hoa-eye/"],
))

# ---------------------------------------------------------------- Page 7
PAGES.append(dict(
    path="/learn/chain-of-title-nc/",
    title="What is a chain of title, and how is one checked in NC?",
    desc="A chain of title is the sequence of recorded deeds from one owner to the next. How it's walked through the NC Register of Deeds grantor/grantee index, and what a break looks like.",
    crumb="chain of title",
    h1="What is a chain of title, and how do you check one in NC?",
    answer="A chain of title is the sequence of recorded deeds showing how ownership of a parcel passed from one owner to the next. In North Carolina it's checked through the Register of Deeds grantor/grantee index: start from a known deed, search the grantee's name forward in time as a grantor, and follow each conveyance to the present owner.",
    sections="""
    <h2>What is a chain of title?</h2>
    <p>Each deed is one link. It names who conveyed the property (the grantor) and who received it (the grantee). When the grantee on one deed is the grantor on the next, the links connect. The chain of title is the whole sequence, from an earlier deed to the current owner.</p>

    <h2>How is the grantor/grantee index organized?</h2>
    <p>Each county's Register of Deeds indexes every recorded document under the names of its grantors and its grantees, with the recording date, the book and page, and the instrument type. <a href="/learn/grantor-vs-grantee/">Grantor vs. grantee</a> walks through an index entry.</p>

    <h2>How do you walk the chain forward from a known deed?</h2>
    <ol>
      <li>Start from a deed you know, using a book and page from the tax card or an earlier document.</li>
      <li>Note the grantee name or names and the recording date.</li>
      <li>Search the grantor index for each grantee name, from that recording date forward.</li>
      <li>Open the next deed that conveys this parcel and confirm its property description matches.</li>
      <li>Repeat with the new grantee until there is no later conveyance. That grantee is the current owner of record.</li>
    </ol>
    <p>Walking backward works the same way through the grantee index.</p>

    <h2>What does a gap or break look like?</h2>
    <ul>
      <li><strong>Name variants.</strong> The next deed is indexed under a different spelling, initial or name order, so the chain looks broken until the variant is searched.</li>
      <li><strong>Unrecorded transfers.</strong> A deed that was signed but never recorded doesn't appear in the index, so the next recorded deed's grantor doesn't match the last grantee.</li>
      <li><strong>Estates.</strong> When an owner dies, the property can pass under a will or by inheritance without a new deed, so the next deed's grantor may be an heir or an executor. In North Carolina, the Clerk of Superior Court in each county handles the administration of estates.</li>
      <li><strong>Trusts and entities.</strong> Property moves into a trust or an entity, and the next link is indexed under the trustee's or the entity's name.</li>
    </ul>

    <h2>When do people order title work instead of checking the index themselves?</h2>
    <p>A chain-of-title check through the index answers one question: who holds title now, and through which deeds. Title work done by an attorney or abstractor typically covers more than the deeds, such as deeds of trust and their cancellations, liens, judgments and other recorded matters. People generally order title work when that wider scope matters, such as for a sale or a refinance, and check the index themselves when the question is only who owns the property.</p>
""",
    faq=[
        ("Is a chain-of-title check the same as a title search?", "No. A chain-of-title check follows the deeds to the current owner. A title search covers a wider scope, typically including deeds of trust, liens, judgments and other recorded matters affecting the property."),
        ("How far back do people check?", "It depends on the purpose of the check. [JOSH: typical search periods in NC practice, described, if they are to be stated]"),
        ("What if a deed is in a trust's name?", "Search under the trustee's name as well as the trust's name. The deed into the trust usually names both, which links the individual owner to the trust in the index."),
    ],
    related=["/learn/grantor-vs-grantee/", "/learn/nc-property-owner-lookup/", "/for/title-update/"],
))

# ---------------------------------------------------------------- Page 8
PAGES.append(dict(
    path="/learn/llc-property-owner-nc/",
    title="Finding the owner behind an LLC-owned property in NC",
    desc="When a deed names an LLC, county records stop at the entity. How the NC Secretary of State's business registry is used to find who is behind an entity-owned parcel.",
    crumb="llc owner",
    h1="How do you find the owner behind an LLC-owned property in NC?",
    answer="When a deed names an LLC, the county records stop at the entity. The NC Secretary of State's business registry lists the LLC's registered agent and its filing history, and some records list company officials such as a manager. Matching the deed's grantee name to the registry filing is how people find who is behind an entity-owned parcel.",
    sections="""
    <h2>What happens when a deed names an entity?</h2>
    <p>When property is held in an LLC, the deed names the LLC as the grantee and the tax card lists the LLC as the owner. Neither record shows the people behind it.</p>

    <h2>How do you search the NC Secretary of State's registry?</h2>
    <ol>
      <li>Copy the entity name exactly as the deed shows it, punctuation included.</li>
      <li>Search the Secretary of State's business registry by that name.</li>
      <li>Open the matching record. It shows the legal name, SOSID, status, date formed, registered agent, registered office address and registered mailing address.</li>
      <li>Check for a "Company officials" section, which can list a manager or other official with a name and address.</li>
      <li>Use "View Filings" to see the filing history and open filed documents, such as the Articles of Organization.</li>
    </ol>

    <h2>Registered agent, member, manager: what does each listing mean?</h2>
    <ul>
      <li><strong>Registered agent</strong>: the person or company the LLC designated to receive official papers on its behalf. It can be an individual or a commercial registered-agent service.</li>
      <li><strong>Member</strong>: an owner of the LLC.</li>
      <li><strong>Manager</strong>: a person who manages the LLC, who may or may not also be a member.</li>
    </ul>

    <h2>How do you join the parcel to the filing?</h2>
    <p>An exact name match is the starting point. Punctuation and abbreviations often differ between the deed index and other records (periods in initials, commas before "INC"), and different entities can have very similar names. Comparing the addresses on the registry record with the tax card's mailing address can help tell similar names apart.</p>

    <h2>Where does the trail stop?</h2>
    <ul>
      <li><strong>Out-of-state LLCs.</strong> An LLC formed in another state may be registered in North Carolina as a foreign LLC. Its application for a certificate of authority names the jurisdiction where it was formed, which is where the search goes next.</li>
      <li><strong>Layered LLCs.</strong> The listed member or manager is itself another entity, and the search repeats one level up.</li>
      <li><strong>New LLCs.</strong> A newly formed LLC may not list any company officials yet, so the record shows only the registered agent.</li>
      <li><strong>Formation services.</strong> When an LLC is formed through a registered-agent or formation service, the Articles of Organization can list only that service as organizer and registered agent, so no owner's name appears in the filings.</li>
    </ul>
""",
    faq=[
        ("Is the registered agent the owner?", "Not necessarily. The registered agent is whoever the LLC designated to receive official papers. It can be an individual, who may or may not be an owner, or a commercial registered-agent service. The listing alone doesn't say who owns the LLC."),
        ("Are Secretary of State records free?", "Yes. Viewing business records on the NC Secretary of State site is free. The fees printed on Secretary of State forms are for filing documents, not for viewing them."),
        ("What about trusts?", "Trusts follow a different path. The deed into a trust typically names the trustee, and trust agreements usually aren't recorded, so the trustee named on the deed is generally where the public record leads."),
    ],
    related=["/learn/nc-property-owner-lookup/", "/learn/chain-of-title-nc/", "/for/investors/"],
))

# ------------------------------------------------- review pages (noindex)
REVIEW = "PENDING LEGAL REVIEW: noindex stays until approved wording replaces every JOSH placeholder."


def review_sections(items):
    return "\n".join(f"    <h2>{esc(h)}</h2>\n    <p>[JOSH: {esc(n)}]</p>\n" for h, n in items)


PAGES.append(dict(
    path="/learn/15-day-letter-nc/", noindex=REVIEW, jsonld=False,
    title="What is a 15-day letter in NC?",
    desc="What a 15-day letter is in North Carolina HOA collections, what it typically contains, who sends it and where it sits in the collections timeline.",
    crumb="15-day letter",
    h1="What is a 15-day letter in North Carolina?",
    answer="[JOSH: approved direct answer, 2–4 sentences. Draft is in the Page Skeletons doc, Page 1.]",
    sections=review_sections([
        ("Where does the name \"15-day letter\" come from?", "quote the relevant statute language verbatim with a link to ncleg.gov"),
        ("What does a 15-day letter typically contain?", "describe typical contents, process only"),
        ("Who prepares and sends it?", "describe who sends it in practice: associations, management companies, law firms"),
        ("Why does the mailing address matter?", "describe returned mail and stale county records, process only"),
        ("Where does it sit in the collections timeline?", "describe its place among the stages"),
    ]),
    faq=[
        ("Is a 15-day letter the same as a late notice?", "[JOSH: approved answer]"),
        ("Does an attorney have to send it?", "[JOSH: approved answer, describing who sends it in practice]"),
        ("What typically happens after one is sent?", "[JOSH: approved answer]"),
        ("Is there a condo equivalent?", "[JOSH: approved answer, with a pointer to Chapter 47C]"),
    ],
    related=["/learn/ncgs-47f-3-116/", "/learn/verify-mailing-address/", "/learn/hoa-collections-process-nc/", "/for/hoa-management/"],
))

PAGES.append(dict(
    path="/learn/ncgs-47f-3-116/", noindex=REVIEW, jsonld=False,
    title="N.C.G.S. § 47F-3-116: what the statute says",
    desc="N.C.G.S. § 47F-3-116, the assessment-lien section of the NC Planned Community Act: the statute text, the terms it uses, and the process practitioners run around it.",
    crumb="§ 47F-3-116",
    h1="What does N.C.G.S. § 47F-3-116 say?",
    answer="[JOSH: approved direct answer, 2–4 sentences. Draft is in the Page Skeletons doc, Page 2.]",
    sections=review_sections([
        ("What does the statute text say?", "quoted excerpts, verified by direct read of ncleg.gov, with a link to the official text"),
        ("What do the terms in the statute mean?", "claim of lien, assessment, declaration, defined descriptively"),
        ("What process do practitioners build around it?", "records pulled and notices prepared, described"),
        ("How does § 47C-3-116 differ?", "the condominium counterpart and where its scope differs"),
    ]),
    faq=[
        ("Where do I read the official text?", "[JOSH: approved answer, with the ncleg.gov link]"),
        ("What's the difference between 47F and 47C?", "[JOSH: approved answer]"),
        ("When was it last amended?", "[JOSH: approved answer, verified against ncleg.gov before publishing]"),
    ],
    related=["/learn/15-day-letter-nc/", "/learn/hoa-collections-process-nc/", "/for/attorneys/"],
))

PAGES.append(dict(
    path="/learn/verify-mailing-address/", noindex=REVIEW, jsonld=False,
    title="How to verify a mailing address before a collections notice",
    desc="The tax card's mailing address is a separate field from the property address, and it goes stale. How it's checked against the tax card and deed before a mailing.",
    crumb="verify mailing address",
    h1="How do you verify a mailing address before a collections notice?",
    answer="[JOSH: approved direct answer, 2–4 sentences. Draft is in the Page Skeletons doc, Page 6.]",
    sections=review_sections([
        ("How is the mailing address different from the property address?", "two fields, two purposes, described"),
        ("How does a mailing address go stale?", "move, sale, never filed"),
        ("What are the verification steps, in order?", "tax card, then deed, then match"),
        ("What goes in a verification record?", "what was checked and when, described"),
    ]),
    faq=[
        ("Why does mail come back even when the county has an address?", "[JOSH: approved answer]"),
        ("Is the deed's address more current than the tax card's?", "[JOSH: approved answer]"),
        ("What's a verification record?", "[JOSH: approved answer]"),
    ],
    related=["/learn/deed-vs-tax-card/", "/learn/county-record-lag/", "/for/hoa-management/"],
))

PAGES.append(dict(
    path="/learn/hoa-collections-process-nc/", noindex=REVIEW, jsonld=False,
    title="How the NC HOA collections process works",
    desc="The stages of HOA collections in North Carolina, from late notices to referral, who acts at each stage and which records get checked along the way.",
    crumb="hoa collections process",
    h1="How does the HOA collections process work in North Carolina?",
    answer="[JOSH: approved direct answer, 2–4 sentences, described as a process and not legal advice. Draft is in the Page Skeletons doc, Page 10.]",
    sections=review_sections([
        ("What are the stages, start to finish?", "timeline description"),
        ("Who does what at each stage?", "association, manager, firm"),
        ("Which records are checked along the way?", "tax card, deed, mailing address"),
        ("What's in the referral packet?", "what firms receive when an account moves to an attorney"),
        ("Where does the process commonly stall?", "bad addresses, stale records"),
    ]),
    faq=[
        ("Can an HOA foreclose in NC?", "[JOSH: approved wording describing that lien foreclosure exists in the statute, factually]"),
        ("How long does the process take?", "[JOSH: approved answer, typical ranges labeled as observed]"),
        ("Who sends each notice?", "[JOSH: approved answer]"),
    ],
    related=["/learn/15-day-letter-nc/", "/learn/ncgs-47f-3-116/", "/learn/verify-mailing-address/", "/for/hoa-management/"],
))

# ------------------------------------------------------ use-case pages
FOR_NOINDEX = "USE-CASE PAGE PENDING REVIEW: noindex stays until Josh approves the copy and every placeholder is resolved."
WORKFLOW = "Fee Simple takes a property address, reads the county tax card and the recorded deed for that parcel, and matches the two by parcel number. It returns the owner of record and mailing address, with a verification record of the county pages it read."


def for_page(slug, crumb, h1, desc, audience, related, problem_extra, custom=None):
    if custom:
        answer, sections = custom
    else:
        answer = f"{esc(WORKFLOW)} [JOSH: one sentence on how this fits the workflow of {esc(audience)}]"
        sections = f"""
    <h2>What's the records problem?</h2>
    <p>County records are kept by two offices that update on different schedules. The tax card can still show the previous owner after a new deed is recorded, and the mailing address on file goes stale when owners move or sell. <a href="/learn/deed-vs-tax-card/">Deed vs. tax card</a> describes how the two records drift apart.</p>
    <p>[JOSH: {esc(problem_extra)}]</p>

    <h2>How does the check work?</h2>
    <ol>
      <li>Fee Simple reads the county tax card for the property address.</li>
      <li>It reads the recorded deed for the same parcel at the Register of Deeds.</li>
      <li>It matches the two by parcel number.</li>
      <li>It returns the owner of record and mailing address.</li>
    </ol>

    <h2>What do you get?</h2>
    <p>A verification record for each property: the owner of record and mailing address, with the county pages they were read from, captured and timestamped.</p>
    <p>[ELIJAH: confirm the deliverable format and fields for {esc(audience)}]</p>
"""
    PAGES.append(dict(
        path=f"/for/{slug}/", noindex=FOR_NOINDEX, jsonld=False,
        title=FOR_TITLES[slug] if slug != "hoa-eye" else "HOA-EYE",
        desc=desc, crumb=crumb, h1=h1, answer=answer, sections=sections,
        faq=[(f"[JOSH: FAQ question {i} for {audience}]", "[JOSH: approved answer]") for i in (1, 2, 3)],
        related=related,
    ))


for_page("hoa-management", "for hoa management",
         "Owner and mailing-address checks for HOA management companies sending 15-day letters",
         "How HOA management companies use Fee Simple to check the owner of record and mailing address from NC county records before sending a 15-day letter.",
         "HOA management companies", ["/learn/15-day-letter-nc/", "/learn/verify-mailing-address/", "/learn/hoa-collections-process-nc/", "/learn/deed-vs-tax-card/"],
         "describe the records problem as management companies meet it when preparing 15-day letters, process only")
for_page("hoa-eye", "hoa-eye",
         "HOA-EYE",
         "HOA-EYE from Fee Simple.",
         "HOA-EYE users", ["/learn/county-record-lag/", "/learn/deed-vs-tax-card/", "/learn/nc-property-owner-lookup/"], "",
         custom=("[ELIJAH: HOA-EYE product description]", """
    <h2>What's the records problem?</h2>
    <p>[ELIJAH: the records problem HOA-EYE addresses]</p>

    <h2>How does the check work?</h2>
    <p>[ELIJAH: how HOA-EYE works]</p>

    <h2>What do you get?</h2>
    <p>[ELIJAH: what HOA-EYE delivers]</p>
"""))
for_page("attorneys", "for attorneys",
         "Owner-of-record checks for HOA collections attorneys",
         "How HOA collections attorneys use Fee Simple to check the owner of record and mailing address from NC county records on referred accounts.",
         "collections attorneys", ["/learn/verify-mailing-address/", "/learn/hoa-collections-process-nc/", "/learn/ncgs-47f-3-116/", "/learn/chain-of-title-nc/"],
         "describe the records problem as firms meet it on referred accounts, process only")
for_page("title-update", "for title updates",
         "Ownership checks for title updates",
         "How Fee Simple supports title updates: confirming the current owner of record from NC county records since the last known deed.",
         "title updates", ["/learn/chain-of-title-nc/", "/learn/grantor-vs-grantee/", "/learn/nc-property-owner-lookup/"],
         "describe the records problem in title updates, from the last known deed forward, process only")
for_page("investors", "for investors",
         "Owner lookups for real estate investors",
         "How real estate investors use Fee Simple to find the owner of record and mailing address for NC properties, including entity-owned parcels.",
         "real estate investors", ["/learn/llc-property-owner-nc/", "/learn/nc-property-owner-lookup/", "/learn/deed-vs-tax-card/"],
         "describe the records problem investors meet, including entity-owned parcels, process only")
for_page("foreclosure-trustees", "for foreclosure trustees",
         "Record checks for foreclosure trustees",
         "How foreclosure trustees use Fee Simple to check the owner of record and mailing address from NC county records.",
         "foreclosure trustees", ["/learn/chain-of-title-nc/", "/learn/grantor-vs-grantee/", "/learn/hoa-collections-process-nc/"],
         "describe the records a trustee pulls and where they drift, process only, as trustees do it in practice")
for_page("self-managed-hoas", "for self-managed hoas",
         "Owner and mailing-address checks for self-managed HOAs",
         "How self-managed HOAs use Fee Simple to check the owner of record and mailing address from NC county records before sending notices.",
         "self-managed HOAs", ["/learn/15-day-letter-nc/", "/learn/hoa-collections-process-nc/", "/learn/verify-mailing-address/"],
         "describe the records problem as volunteer boards meet it, process only")

for p in PAGES:
    page(p)
