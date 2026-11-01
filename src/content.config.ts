import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const page = z.object({
  // The <title>, before " — Fee Simple".
  title: z.string(),
  // How other pages, the hub and llms.txt name this page.
  linkTitle: z.string(),
  description: z.string(),
  // Why the page is held out of search. Present means noindex, and the page
  // stays out of the sitemap, llms.txt and the hub's ItemList.
  noindex: z.string().optional(),
  // Placeholder FAQ wording never goes into structured data.
  faqJsonld: z.boolean(),
  crumb: z.string(),
  h1: z.string(),
  // Inline HTML: the lead answer can carry links.
  answer: z.string(),
  faq: z.array(z.object({ q: z.string(), a: z.string() })),
  cta: z.string().optional(),
  related: z.array(z.string()),
  // Indexed pages only: their llms.txt line and sitemap date.
  llms: z.string().optional(),
  updated: z.string().optional(),
}).refine((p) => p.noindex || (p.llms && p.updated), {
  message: 'an indexed page needs llms and updated',
});

const learn = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/learn' }),
  schema: page.and(z.object({ order: z.number(), blurb: z.string() })),
});

const forPages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/for' }),
  schema: page,
});

export const collections = { learn, for: forPages };
