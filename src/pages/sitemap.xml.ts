import type { APIRoute } from 'astro';
import { indexedPages } from '../lib/pages';

export const GET: APIRoute = async ({ site }) => {
  const urls = (await indexedPages()).map(
    (p) => `  <url><loc>${new URL(p.path, site).href}</loc><lastmod>${p.updated}</lastmod></url>`,
  );
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
  ].join('\n') + '\n';
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
