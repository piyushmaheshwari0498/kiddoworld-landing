// Turns raw photos from /inbox into web-ready WebP files.
//
//   npm run images              -> product photos  (public/images/products, max 900px)
//   npm run images -- gallery   -> gallery photos  (public/images/gallery,  max 1600px)
//
// Product photos are named after the product, e.g. "Police Van.jpg" -> police-van.webp,
// and the site picks them up automatically (no other edit needed).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const target = process.argv[2] === 'gallery' ? 'gallery' : 'products';
const maxSize = target === 'gallery' ? 1600 : 900;
const inbox = path.resolve('inbox');
const outDir = path.resolve('public/images', target);

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const files = fs.existsSync(inbox) ? fs.readdirSync(inbox).filter((f) => /\.(jpe?g|png|webp|tiff?)$/i.test(f)) : [];

if (!files.length) {
  console.log('No photos found in /inbox. Drop .jpg/.png files there first.');
  process.exit(0);
}

fs.mkdirSync(outDir, { recursive: true });
for (const file of files) {
  const name = slug(path.parse(file).name);
  const out = path.join(outDir, `${name}.webp`);
  const info = await sharp(path.join(inbox, file))
    .rotate() // respect phone orientation
    .resize({ width: maxSize, height: maxSize, fit: target === 'products' ? 'cover' : 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(out);
  console.log(`✓ ${file} -> public/images/${target}/${name}.webp  (${Math.round(info.size / 1024)} KB)`);
}
console.log('\nDone. You can delete the originals from /inbox (they are git-ignored anyway).');
