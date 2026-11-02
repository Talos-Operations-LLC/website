import { getCollection, type CollectionEntry } from 'astro:content';
import { HUB, SITE_PAGES } from './site';

export type Section = 'learn' | 'for';
export type Entry = CollectionEntry<'learn'> | CollectionEntry<'for'>;

export const pathOf = (section: Section, id: string) => `/${section}/${id}/`;

export async function learnPages() {
  return (await getCollection('learn')).sort((a, b) => a.data.order - b.data.order);
}

export async function linkTitles() {
  const titles = new Map<string, string>();
  for (const e of await getCollection('learn')) titles.set(pathOf('learn', e.id), e.data.linkTitle);
  for (const e of await getCollection('for')) titles.set(pathOf('for', e.id), e.data.linkTitle);
  return titles;
}

// Sitemap and llms.txt order: home, the other site pages A–Z, the hub, then
// its pages in hub order. Noindex pages are left out.
export async function indexedPages() {
  const [home, ...rest] = SITE_PAGES;
  const learn = (await learnPages())
    .filter((e) => !e.data.noindex)
    .map((e) => ({ path: pathOf('learn', e.id), title: e.data.linkTitle, llms: e.data.llms!, updated: e.data.updated! }));
  return [home, ...rest.sort((a, b) => a.path.localeCompare(b.path)), HUB, ...learn];
}

export function faqJsonld(faq: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}
