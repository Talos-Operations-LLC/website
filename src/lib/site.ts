// The indexed pages that aren't content entries. Each one's llms.txt line and
// sitemap date live here; bump `updated` when the page's content changes.
export const SITE_PAGES = [
  { path: '/', title: 'Home', llms: 'What Fee Simple does and how to request early access.', updated: '2026-11-01' },
  { path: '/coverage.html', title: 'Coverage', llms: 'Which North Carolina counties Fee Simple covers today, live in production or surveyed with bulk data mapped.', updated: '2026-11-01' },
  { path: '/privacy.html', title: 'Privacy Policy', llms: 'What Fee Simple collects, what it does with it, who else handles it, and the choices you have.', updated: '2026-10-05' },
  { path: '/terms.html', title: 'Terms of Service', llms: 'The terms for using Fee Simple: your account, acceptable use, what the records are and are not, and our liability.', updated: '2026-10-05' },
];

export const HUB = { path: '/learn/', title: 'Learn', llms: 'An index of explanations of how North Carolina property records work.', updated: '2026-10-01' };

export const LLMS_SUMMARY =
  'Fee Simple, from Talos Operations LLC, pulls the owner of record and mailing address from North Carolina county tax cards and deeds, matched by parcel, for HOA collections.';
