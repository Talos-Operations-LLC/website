import { defineConfig } from 'astro/config';

// Preserve established URLs so existing search results keep working.
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
