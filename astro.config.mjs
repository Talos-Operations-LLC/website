import { defineConfig } from 'astro/config';

// "preserve" keeps every URL the old static site had: coverage.astro builds
// to /coverage.html and learn/x/index.astro to /learn/x/. Changing it moves
// pages that search engines already know.
// Uncompressed HTML so built pages can be diffed line by line against the
// old hand-written files.
export default defineConfig({
  site: 'https://talosoperations.com',
  build: {
    format: 'preserve',
    inlineStylesheets: 'never',
  },
  compressHTML: false,
});
