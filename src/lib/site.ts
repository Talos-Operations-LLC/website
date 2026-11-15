// The indexed pages that aren't content entries. Each one's llms.txt line and
// sitemap date live here; bump `updated` when the page's content changes.
export const SITE_PAGES = [
  { path: '/', title: 'Home', llms: 'What Fee Simple does and how to request early access.', updated: '2026-11-01' },
  { path: '/privacy.html', title: 'Privacy Policy', llms: 'How Talos handles account information, private workspace content, public records, website analytics and privacy requests.', updated: '2026-11-14' },
  { path: '/terms.html', title: 'Terms of Service', llms: 'Terms for the Talos website, Fee Simple app and demo, including free and paid access. Lead-sale agreements remain separate.', updated: '2026-11-14' },
];

export const HUB = { path: '/learn/', title: 'Learn', llms: 'An index of explanations of how North Carolina property records work.', updated: '2026-10-01' };

export const LLMS_SUMMARY =
  'Fee Simple, from Talos Operations LLC, pulls the owner of record and mailing address from North Carolina county tax cards and deeds, matched by parcel, for HOA collections.';
