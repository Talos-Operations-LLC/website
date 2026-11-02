import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) =>
  new Response(`# robots.txt for talosoperations.com
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

Sitemap: ${new URL('/sitemap.xml', site).href}
`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
