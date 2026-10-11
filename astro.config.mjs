import { defineConfig } from 'astro/config';
import site from './src/data/site.json' with { type: 'json' };

// If the page is served from a sub-folder (e.g. https://yourdomain.com/toys/),
// set base: '/toys/' below. For a domain/sub-domain root leave it as '/'.
export default defineConfig({
  site: site.domain,
  base: '/',
  build: { inlineStylesheets: 'auto' },
});
