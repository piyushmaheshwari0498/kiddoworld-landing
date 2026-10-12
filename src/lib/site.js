import fs from 'node:fs';
import path from 'node:path';
import site from '../data/site.json';
import content from '../data/content.json';
import categories from '../data/categories.json';
import ageGroups from '../data/age-groups.json';
import products from '../data/products.json';
import videos from '../data/videos.json';

export { site, content, categories, ageGroups, products, videos };

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
const publicDir = path.resolve('public');

/** Turn a "folder/file.ext" path from the data files into a URL that works under any base path. */
export function url(p = '') {
  if (!p || p.startsWith('http') || p.startsWith('#') || p.startsWith('mailto:')) return p;
  return base + p.replace(/^\/+/, '');
}

/** True if the file exists inside /public (checked at build time). */
export function publicFileExists(p) {
  if (!p) return false;
  return fs.existsSync(path.join(publicDir, p.replace(/^\/+/, '')));
}

export function waLink(message = site.whatsapp.defaultMessage) {
  return `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(message)}`;
}

export function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Product photo: explicit `image` in products.json, else public/images/products/<id>.(webp|jpg|jpeg|png). */
export function productImage(p) {
  if (p.image && publicFileExists(p.image)) return p.image;
  for (const ext of ['webp', 'jpg', 'jpeg', 'png']) {
    const guess = `images/products/${p.id}.${ext}`;
    if (publicFileExists(guess)) return guess;
  }
  return null;
}

/** Warn at build time about placeholder values that must be replaced before launch. */
export function launchWarnings() {
  const w = [];
  if (/X/.test(site.whatsapp.number)) w.push('whatsapp.number is still a placeholder (src/data/site.json)');
  if (!site.shopUrl || site.shopUrl === '#') w.push('shopUrl is not set — "Shop Now" has nowhere to go');
  if (site.domain.includes('example.com')) w.push('domain is still example.com');
  if (site.showPlaceholders) w.push('showPlaceholders is true — set it to false at launch to hide "add photo/video" tiles');
  return w;
}
