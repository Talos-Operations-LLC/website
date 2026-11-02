import { defineConfig } from 'astro/config';

// "preserve" keeps every URL the old static site had: coverage.astro builds
// to /coverage.html and learn/x/index.astro to /learn/x/. Changing it moves
// pages that search engines already know.
// Uncompressed HTML so built pages can be diffed line by line against the
// old hand-written files.
// No smart quotes: copy renders exactly as written, straight quotes included.
export default defineConfig({
  site: 'https://talosoperations.com',
  markdown: {
    smartypants: false,
  },
  build: {
    format: 'preserve',
    inlineStylesheets: 'never',
  },
  compressHTML: false,
});
