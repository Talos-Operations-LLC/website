import type { APIRoute } from 'astro';
import { indexedPages } from '../lib/pages';
import { LLMS_SUMMARY } from '../lib/site';

export const GET: APIRoute = async ({ site }) => {
  const lines = ['# Fee Simple', '', `> ${LLMS_SUMMARY}`];
  let current = '';
  for (const p of await indexedPages()) {
    const section = p.path.startsWith('/learn/') ? 'Learn' : 'Site';
    if (section !== current) {
      current = section;
      lines.push('', `## ${section}`, '');
    }
    lines.push(`- [${p.title}](${new URL(p.path, site).href}): ${p.llms}`);
  }
  return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
