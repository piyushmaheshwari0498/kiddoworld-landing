# Kiddo World – Landing Page

Landing page for **Kiddo World (Bhagwati Toyland Pvt. Ltd.)** – bulk toy manufacturer, Ahmedabad.
Built with [Astro](https://astro.build) (static site) + a small PHP script for the Contact form.

**Why this stack:** it compiles to plain HTML/CSS/JS, so it runs on the same cPanel/PHP hosting as the WordPress
store – no Node server needed in production. All content is in plain JSON files and folders, so updating the site never
means touching the page code. The WordPress store stays separate; "Shop Now" simply links to it.

## Quick start

```bash
npm install        # once
npm run dev        # live preview at http://localhost:4321
npm run build      # creates the deployable site in dist/
```
Requires Node 20+ (22 recommended).

## Updating content (no code changes)

| I want to change… | Edit this |
|---|---|
| WhatsApp number, Shop Now link, Instagram/Facebook, address, hours, email, domain | `src/data/site.json` |
| Headlines, About text, "why us", steps, section titles | `src/data/content.json` |
| Add / remove / edit a product (name, toy type, age groups) | `src/data/products.json` |
| Toy types (Battery / RC / Friction) | `src/data/categories.json` |
| Age-group filter buttons | `src/data/age-groups.json` |
| Videos | `src/data/videos.json` |
| Product photos | drop into `inbox/`, run `npm run images` (see below) |
| Gallery photos | drop into `inbox/`, run `npm run images -- gallery` |
| Catalogue PDF | replace `public/catalogue/kiddoworld-catalogue.pdf` |
| Logo | replace `public/images/logo.webp` (site) and `logo.png` (link previews) – transparent background; original is kept in `logo-original.jpg` |
| Colours / fonts | CSS variables at the top of `src/styles/global.css` |

After any change: `npm run build`, then upload `dist/` (see Deploying).

### Products
The 62 products come straight from the 2026 catalogue (`KW_FINAL_Q.pdf`). Each entry in `products.json`:
```json
{ "id": "police-van", "name": "Police Van", "category": "friction", "ageMin": 3, "ageText": "3+ yrs" }
```
- `category`: `battery`, `rc` or `friction` (friction group = friction-powered, pull-back, press-n-go and free-wheel toys).
- `ageMin`: the starting age printed in the catalogue, in years (6 months = `0.5`). It decides which age filter the toy appears
  under (bands are in `age-groups.json`: *Under 3 yrs*, *3+ yrs*, *4 yrs & above*). `ageText` is what the card shows.
- `mechanism` is optional (Pull Back, Press n Go, Free Wheel) and shown next to the toy type.
- The catalogue also lists item codes, pack sizes and MRP – these are deliberately **not** on the website (they're in the PDF).
- `Clapping Hand` and `Pickle Ball` have no mechanism in the catalogue and sit under the friction group for now – move or remove them as you prefer.

### Product photos
1. Name the photo after the product: `Police Van.jpg`.
2. Put it in `inbox/` and run `npm run images` – it creates a small `public/images/products/police-van.webp`.
3. Build. The photo is picked up **automatically** (matched by product `id`). Products without a photo show a neutral placeholder.

### Gallery photos
Put photos in `inbox/` and run `npm run images -- gallery`. Everything in `public/images/gallery/` appears in the
Photos section, sorted by filename (prefix `01-`, `02-` to control order). Click-to-enlarge is built in.

### Videos
Edit `src/data/videos.json`:
```json
{ "title": "Inside our factory", "youtube": "dQw4w9WgXcQ" }
{ "title": "Toys in action", "file": "videos/toys-in-action.mp4", "poster": "images/video-poster.webp" }
```
- `youtube` = the ID after `v=` in the YouTube link (loads only when someone presses play → fast page).
- `file` = an MP4 you put in `public/videos/` (keep under ~20 MB; compress it first).

### Catalogue PDF
The 2026 catalogue is already at `public/catalogue/kiddoworld-catalogue.pdf` (compressed from 38 MB to 16 MB so buyers on mobile
can download it). To replace it, overwrite that file – the "Download Catalogue" button picks it up. Keep it under ~20 MB.
Note: the catalogue prints the **MRP** of each toy, so anyone who downloads it sees the MRP. Dealer prices are not in it.

## Contact form (email + Google Sheet + WhatsApp)

The form posts to `public/api/contact.php`, which (1) saves a backup copy, (2) emails your sales inbox, (3) optionally adds
a row to a Google Sheet. After sending, the visitor is also offered a pre-filled WhatsApp message. Includes spam
protection (hidden trap field, speed check, 5-per-10-minutes limit).

**One-time setup on the server**
1. Copy `public/api/config.sample.php` → `config.php` and fill in `to`, `from` (use an address on your own domain).
2. Safest: save it **one level above the web root** as `kiddoworld-config.php`; the script finds it there automatically.
3. Optional Google Sheet: follow `docs/GOOGLE_SHEET.md` and paste the URL into `sheet_webhook`.
4. Submit a test enquiry from the live site. Backups are in `api/_data/enquiries.jsonl` (blocked from browsers by `.htaccess`).

`config.php` is git-ignored – never commit it. If you re-upload `dist/` later, don't delete `config.php` on the server.
*(Running on nginx instead of Apache? Block `/api/config.php` and `/api/_data/` in the server config – `.htaccess` is ignored there.)*

## Deploying (cPanel / shared hosting)

**Automatic (recommended):** pushing to `main` runs `.github/workflows/deploy.yml`, which builds the site and uploads it to
your server by FTP. One-time setup is in [`docs/DEPLOY.md`](docs/DEPLOY.md).

**Manual:**
1. `npm run build`
2. Upload **the contents of `dist/`** (including the hidden `.htaccess`) to the site's folder, e.g. a sub-domain
   `toys.yourdomain.com` → its document root. A sub-domain is recommended so it never clashes with WordPress.
3. Create `config.php` as described above (first time only).
4. In `src/data/site.json` set `domain`, then rebuild. If the page lives in a sub-*folder* (e.g. `yourdomain.com/toys/`)
   also set `base: '/toys/'` in `astro.config.mjs`.

## GitHub

```bash
git remote add origin https://github.com/<your-org>/kiddoworld-landing.git
git push -u origin main
```
Use a **private** repository. Secrets (`config.php`), stored enquiries and `node_modules` are git-ignored.

## Launch checklist
`npm run build` prints a "[launch checklist]" for anything still unset. In short:
- [x] WhatsApp number, Shop Now URL and contact email are set
- [ ] Instagram + Facebook URLs, and `domain` (in `site.json`)
- [ ] `config.php` created on the server and a test enquiry received
- [ ] Real product photos, gallery photos, videos, catalogue PDF added
- [ ] Review the product list (names, toy types, ages) against the catalogue
- [ ] `showPlaceholders` set to **false** (hides the "add photo/video" tiles)
- [ ] BIS certificate shown: `content.json → about.bis.enabled = true` and fill in the detail
- [ ] Add Google Analytics / Search Console if wanted

## Project structure
```
src/data/        all editable content (JSON)
src/components/  page sections (Astro components)
src/scripts/     browser code: filters, enquiry form, chat, lightbox
src/styles/      global.css
public/          files copied as-is: images, videos, catalogue PDF, api/contact.php, .htaccess
scripts/         optimize-images.mjs
inbox/           drop raw photos here (git-ignored)
```
# kiddoworld-landing
