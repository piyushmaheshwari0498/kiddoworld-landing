# Automatic deploy (GitHub Actions)

Every push to `main` builds the site. It can also upload the result to your hosting by FTP, so publishing a change is just
"edit a JSON file → commit → done". Until you finish the steps below the workflow only **builds and checks** the site
(and keeps a downloadable copy under *Actions → the run → Artifacts → site*).

## One-time setup

1. In cPanel create an **FTP account** limited to the folder of the site (e.g. the `toys.yourdomain.com` document root).
   Note the FTP server name, username and password.
2. On GitHub: **Settings → Secrets and variables → Actions**
   - **Secrets** tab → *New repository secret*: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`
   - **Variables** tab → *New repository variable*:
     - `DEPLOY_ENABLED` = `true`
     - `FTP_DIR` = `./` (the FTP account's home *is* the site folder; otherwise e.g. `/public_html/toys/`)
     - `FTP_PROTOCOL` = `ftps` (use `ftp` only if your host doesn't support FTPS)
3. Create `config.php` on the server **once** (see README → Contact form). The deploy never overwrites or deletes it.
4. Push any change (or **Actions → Build & deploy → Run workflow**). The first run uploads everything; later runs upload
   only what changed.

## Notes
- Turn automatic upload off any time by setting `DEPLOY_ENABLED` to `false`.
- Prefer SSH/rsync instead of FTP? Replace the "Deploy to server" step with an `rsync` action and an SSH key secret.
- Pull requests are built but never deployed.
