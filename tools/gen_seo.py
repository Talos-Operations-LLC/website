# gen_seo.py: generates the site's SEO files from the pages themselves.
#   robots.txt, sitemap.xml, llms.txt, and the ItemList JSON-LD block in learn/index.html
#
# Inputs:
#   - Every tracked .html file (git ls-files). A page is included if its own <head> has no
#     robots noindex meta tag and it isn't under demo/. Changing a page's noindex status and
#     re-running is all it takes to add or drop it.
#   - lastmod: the date of the file's last commit (git log -1 --format=%cs).
#   - LLMS below: a title and a one-sentence description for each indexable page, keyed by
#     URL path. An indexable page with no entry fails the run instead of being left out.
#   - The /learn/ hub's own list (<ol class="library">): it orders the learn section of the
#     sitemap and llms.txt, and supplies the ItemList names. Only indexable pages are listed.
#
# The output is committed. There is no build step: Netlify serves the committed files, and
# this script is only a convenience for regenerating them. Re-run after adding a page,
# changing a page's noindex status or editing LLMS, then review the diff.
#
# Run from the repo root:  python tools/gen_seo.py
import html, json, re, subprocess, sys

DOMAIN = "https://talosoperations.com"
HUB = "learn/index.html"

LLMS_TITLE = "Fee Simple"
LLMS_SUMMARY = ("Fee Simple, from Talos Operations LLC, pulls the owner of record and mailing address from "
                "North Carolina county tax cards and deeds, matched by parcel, for HOA collections.")

# path -> (link title, one-sentence description)
LLMS = {
    "/": ("Home", "What Fee Simple does and how to request early access."),
    "/coverage.html": ("Coverage", "Which North Carolina counties Fee Simple covers today, live in production or surveyed with bulk data mapped."),
    "/learn/": ("Learn", "An index of explanations of how North Carolina property records work."),
    "/learn/nc-property-owner-lookup/": ("How to find out who owns a property in NC from county records",
                                         "How to find a North Carolina property owner from the county tax card and the recorded deed."),
    "/learn/deed-vs-tax-card/": ("Deed vs. tax card: why they disagree",
                                 "Why the recorded deed and the county tax card can show different owners, and how to check both."),
    "/learn/county-record-lag/": ("Why county ownership records lag behind sales",
                                  "Why the tax card can still show the previous owner after a new deed is recorded."),
    "/learn/grantor-vs-grantee/": ("Grantor vs. grantee: reading a deed index",
                                   "What grantor and grantee mean, and how a Register of Deeds index is organized and searched."),
    "/learn/chain-of-title-nc/": ("What is a chain of title, and how is one checked in NC?",
                                  "How a chain of title is followed through the NC grantor/grantee index, and what a break looks like."),
    "/learn/llc-property-owner-nc/": ("Finding the owner behind an LLC-owned property in NC",
                                      "How the NC Secretary of State's business registry is used to find who is behind an LLC-owned parcel."),
    # Add an entry here when a noindex page is cleared for indexing.
}

# llms.txt sections, by path prefix; anything at the root is "Site".
SECTIONS = [("/learn/", "Learn")]

ROBOTS = """# robots.txt for talosoperations.com
# Every crawler is allowed. The named group records that the search and AI
# crawlers listed in it are welcome; "*" already covers them.
# /demo/ is kept out of search by the X-Robots-Tag header in netlify.toml,
# which a crawler can only see if it is allowed to fetch the page.

User-agent: *
Allow: /

User-agent: OAI-SearchBot
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: Claude-SearchBot
User-agent: PerplexityBot
User-agent: Bingbot
Allow: /

Sitemap: {domain}/sitemap.xml
"""

NOINDEX = re.compile(r'<meta\s+name="robots"\s+content="[^"]*noindex', re.I)
ITEMLIST_BLOCK = re.compile(r'<script type="application/ld\+json">\r?\n\{\r?\n  "@context": "https://schema.org",\r?\n  "@type": "ItemList",.*?</script>\r?\n', re.S)


def git(*args):
    return subprocess.run(["git", *args], capture_output=True, text=True, check=True).stdout


def read(path):
    with open(path, encoding="utf-8", newline="") as f:
        return f.read()


def write(path, text):
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write(text)


def url_for(f):
    if f == "index.html":
        return "/"
    if f.endswith("/index.html"):
        return "/" + f[: -len("index.html")]
    return "/" + f


def file_for(url):
    if url == "/":
        return "index.html"
    return url.lstrip("/") + ("index.html" if url.endswith("/") else "")


def indexable(f):
    return not f.startswith("demo/") and not NOINDEX.search(read(f))


def hub_list():
    s = read(HUB)
    ol = re.search(r'<ol class="library">(.*?)</ol>', s, re.S).group(1)
    return [(href, html.unescape(text)) for href, text in re.findall(r'<a href="([^"]+)">(.*?)</a>', ol)]


def main():
    files = [f for f in git("ls-files", "*.html").split() if indexable(f)]
    urls = {url_for(f): f for f in files}
    hub = [(href, name) for href, name in hub_list() if href in urls]

    # Order: home, other root pages A–Z, the hub, its pages in hub order, then anything else A–Z.
    root = sorted(u for u in urls if u.count("/") == 1 and u != "/")
    order = ["/"] + root + [url_for(HUB)] + [href for href, _ in hub]
    order += sorted(u for u in urls if u not in order)

    missing = [u for u in order if u not in LLMS]
    if missing:
        sys.exit("gen_seo: no LLMS entry for indexable page(s): " + ", ".join(missing))

    lastmod = {u: git("log", "-1", "--format=%cs", "--", urls[u]).strip() for u in order}
    sitemap = ['<?xml version="1.0" encoding="UTF-8"?>',
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    sitemap += [f"  <url><loc>{DOMAIN}{u}</loc><lastmod>{lastmod[u]}</lastmod></url>" for u in order]
    sitemap.append("</urlset>")
    write("sitemap.xml", "\n".join(sitemap) + "\n")

    def section(u):
        return next((name for prefix, name in SECTIONS if u.startswith(prefix)), "Site")

    llms = [f"# {LLMS_TITLE}", "", f"> {LLMS_SUMMARY}"]
    current = None
    for u in order:
        if section(u) != current:
            current = section(u)
            llms += ["", f"## {current}", ""]
        title, desc = LLMS[u]
        llms.append(f"- [{title}]({DOMAIN}{u}): {desc}")
    write("llms.txt", "\n".join(llms) + "\n")

    write("robots.txt", ROBOTS.format(domain=DOMAIN))

    s = read(HUB)
    nl = "\r\n" if "\r\n" in s else "\n"
    items = ",\n".join(
        f'    {{"@type": "ListItem", "position": {i}, "name": {json.dumps(name, ensure_ascii=False)}, "url": "{DOMAIN}{href}"}}'
        for i, (href, name) in enumerate(hub, 1))
    block = ('<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "ItemList",\n'
             '  "name": "Learn",\n  "itemListElement": [\n' + items + "\n  ]\n}\n</script>\n").replace("\n", nl)
    if ITEMLIST_BLOCK.search(s):
        s = ITEMLIST_BLOCK.sub(lambda m: block, s, count=1)
    else:
        anchor = '<link rel="stylesheet" href="/assets/site.css">' + nl
        assert s.count(anchor) == 1, "gen_seo: hub stylesheet link not found"
        s = s.replace(anchor, anchor + block)
    write(HUB, s)

    print(f"gen_seo: {len(order)} indexable pages; ItemList {len(hub)} entries; wrote robots.txt, sitemap.xml, llms.txt, {HUB}")


if __name__ == "__main__":
    main()
