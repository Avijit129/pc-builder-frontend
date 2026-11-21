# Deploy checklist

PC Builder: Next.js frontend + Laravel API. Written from decisions D1 to D3.
Placeholders: `https://www.example.com` = the website, `https://api.example.com` = the API.
Tick a box only after you have really checked it.

## 1. Questions to ask a host BEFORE you choose one

- [ ] **Frontend:** can it run a Node.js server (`next start`)? A static-only host does NOT work. We need a server for the image optimizer, "use cache", and server actions. Check the Next.js docs for the minimum Node version.
- [ ] **Backend:** which PHP version (see `composer.json`), MySQL, Composer, and a way to run `php artisan` commands?
- [ ] **HTTPS** for both addresses. The login cookie is `secure` in production, so login does not work on plain http.
- [ ] **The API must be reachable from the internet.** Browsers call it directly. One variable (`NEXT_PUBLIC_API_URL`) is used by the server AND the browser, so an internal-only address does not work.
- [ ] **Does the proxy in front of Next.js set the `X-Real-IP` header itself** (and overwrite one sent by a visitor)? Needed for D2. Nginx: `proxy_set_header X-Real-IP $remote_addr;`. Behind Cloudflare, `$remote_addr` is Cloudflare's address, so ask which header holds the visitor address.
- [ ] **Does Laravel sit behind a proxy** (Nginx, Cloudflare, a load balancer)? If yes, write down the proxy IP addresses (see section 5).
- [ ] **Outbound internet from the Laravel server.** In production the password rule `uncompromised()` asks an external service, so register needs it.
- [ ] A way to run a **scheduled job** (cron) for the future price sync.
- [ ] **Database backups.** How often, and how do you restore?
- [ ] A **second environment** for staging, with its own database. Never point staging at the production database.

## 2. Environment variables

### Laravel `.env` (production)

| Variable            | Value                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `APP_ENV`           | `production`                                                                                    |
| `APP_DEBUG`         | `false` (with `true`, 404 pages show file paths)                                                |
| `APP_KEY`           | made once with `php artisan key:generate`, never changed later                                  |
| `APP_NAME`          | `"PC Builder"` (quotes, because of the space)                                                   |
| `APP_URL`           | `https://api.example.com`                                                                       |
| `FRONTEND_URL`      | `https://www.example.com`, **no trailing slash**. Used for CORS, canonical URLs and the sitemap |
| `DB_*`              | the production database                                                                         |
| `VISITOR_IP_SECRET` | long random text (`php -r "echo bin2hex(random_bytes(32));"`). Same value as in Next.js         |

### Next.js environment (production)

| Variable               | Value                                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`  | `https://api.example.com` (public, https)                                                                                    |
| `NEXT_PUBLIC_SITE_URL` | `https://www.example.com` (same as `FRONTEND_URL`)                                                                           |
| `VISITOR_IP_SECRET`    | same value as Laravel. **Never** with the `NEXT_PUBLIC_` prefix. Set it only when the proxy sets `X-Real-IP` (see section 5) |

### Staging only

| Where   | Variable               | Value                                |
| ------- | ---------------------- | ------------------------------------ |
| Next.js | `BLOCK_INDEXING`       | `true` (production must NOT have it) |
| Next.js | `NEXT_PUBLIC_SITE_URL` | the staging address                  |
| Laravel | `FRONTEND_URL`         | the staging address                  |
| Laravel | `APP_DEBUG`            | `false` also on staging              |

### Rules

- [ ] **Build once per environment.** `NEXT_PUBLIC_*` values and `BLOCK_INDEXING` are fixed at build time. A change needs a new `npm run build`.
- [ ] After changing Laravel `.env`: `php artisan config:clear`, or `php artisan config:cache` in production. `env()` is only used inside `config/*.php`, so caching is safe.
- [ ] `.env` and `.env.local` are not in Git.

## 3. Deploy order

1. [ ] Laravel first: upload the code, `composer install --no-dev --optimize-autoloader`, set `.env`.
2. [ ] `php artisan migrate --force`. (`migrate:fresh` and `db:wipe` are blocked in production on purpose.)
3. [ ] `php artisan config:cache`, `php artisan route:cache`, `php artisan event:cache`.
4. [ ] Check `https://api.example.com/api/cpus?per_page=1` answers JSON.
5. [ ] Set the Next.js variables.
6. [ ] `npm ci`, then `npm run build`. **The build calls Laravel**, so Laravel must be running and reachable from the place where the build runs.
7. [ ] `npm run start` (or the host's equivalent).
8. [ ] Run the smoke tests (section 7).

## 4. Data before go-live

- [ ] **Remove the `/` route in `routes/web.php` before deploy.** It dispatches queue jobs (`PullRepo`, `PullRequest`, `Deploy`) on every visit. It is practice code, and the Next.js site does not use it.
- [ ] Do NOT run demo seeders in production. `GuideSeeder` refuses to run there. Check the other seeders yourself.
- [ ] The seeded specs are demo data and not verified. Replace them with real data before you tell anyone about the site.
- [ ] **Do not launch with demo prices.** They show on pages, in the builder total, and in the Product JSON-LD (`AggregateOffer`) that Google reads. With no price rows, pages say "No in-stock price" and no offers are sent to Google. Decide at launch: no prices, or a few real ones entered by hand. Do not truncate the price tables, because their history rows are deleted with them. Test an empty-price database on staging first.
- [ ] Delete test builds from "My builds" ("Postman test build", "JSON sample") and any guide with a slug starting with `demo-`.
- [ ] Images: demo images come from `placehold.co`, `via.placeholder.com` and `picsum.photos`. Put real images on your own storage or CDN, about 2000 px wide for the zoom. Add that ONE hostname to `image-hosts.json`, then rebuild. Remove `picsum.photos` from the list.
- [ ] Price changes must go through models (`->update()`, `updateOrCreate`), never `DB::table()` or `Model::query()->update()`. Otherwise no price history is written.

## 5. Visitor IP and proxies

**Next.js side (D2, done in code):** login and register send `X-Visitor-IP` and `X-Visitor-Secret`. Laravel believes the IP only when the secret matches.

- [ ] Set `VISITOR_IP_SECRET` on Next.js ONLY when the proxy in front of Next.js sets `X-Real-IP` itself. Without that, a visitor could send a fake `X-Real-IP`.
- [ ] Test it after deploy (section 7, point 8).

**Laravel side (not done yet, needs the host):** browsers call `POST /api/compatibility/check-build` directly (60 per minute per IP). If Laravel is behind a proxy, Laravel sees the proxy address, so all visitors share ONE counter.

- [ ] If Laravel is behind a proxy: in `bootstrap/app.php`, inside `withMiddleware`, add `$middleware->trustProxies(at: ['PROXY_IP_ADDRESS']);`. Use the real proxy IPs. **Never `'*'`**: anyone could send a fake `X-Forwarded-For` and escape every limit.
- [ ] Known and accepted: shared build and price history calls come from the Next.js server, so Laravel counts them as one IP (120 per minute each). The 60-second cache protects Laravel. A crawler that opens many different shared builds in one minute can make those pages show the error screen. Raise the limit later if you see it in the logs.

## 6. SEO settings to verify on production

- [ ] `https://www.example.com/robots.txt` has `Allow: /` AND a `Sitemap:` line.
- [ ] Response headers of a page have NO `X-Robots-Tag` (that header is for staging only).
- [ ] `https://www.example.com/sitemap.xml`: every `<loc>` starts with the real domain. A warning `[sitemap] ... do not start with ...` in the Next.js log means `FRONTEND_URL` is wrong.
- [ ] Page source of a part page: canonical URL has the real domain, and `og:site_name` says "PC Builder" (not "Laravel").
- [ ] `/cpu?page=2` has a canonical that points to itself, and the title ends with "- Page 2". `/cpu?sort=newest` points to `/cpu`. Test with a Googlebot user agent (see the step "self-canonical for ?page=2").
- [ ] Submit the sitemap in Google Search Console.
- [ ] Optional later: add a `logo` to the Organization JSON-LD on the homepage.

## 7. Smoke tests after deploy

Run in PowerShell. Set the two addresses first. For a dry run on your own machine, use `http://localhost:8000` and `http://localhost:3000`.

```powershell
$api  = "https://api.example.com"
$site = "https://www.example.com"

# 1. The API answers JSON.
curl.exe -s "$api/api/cpus?per_page=1"

# 2. Pages answer 200 (run it for /, /cpu, /builder, /guides).
curl.exe -s -o NUL -w "%{http_code}`n" "$site/cpu"

# 3. An unknown part gives 404.
curl.exe -s -o NUL -w "%{http_code}`n" "$site/cpu/amd/does-not-exist"

# 4. robots.txt and the first sitemap entries.
curl.exe -s "$site/robots.txt"
curl.exe -s "$site/sitemap.xml" | Select-String "<loc>" | Select-Object -First 3

# 5. A production page has NO X-Robots-Tag. (Staging must show it.)
curl.exe -s -I "$site/cpu" | Select-String "x-robots-tag"

# 6. An API 404 must not show file paths. (No output = good.)
curl.exe -s "$api/api/cpus/does-not-exist" | Select-String "vendor|\\app\\|/app/"

# 7. CORS: another site is NOT allowed (no output), our site is allowed.
curl.exe -s -D - -o NUL -H "Origin: https://evil.example" "$api/api/cpus?per_page=1" | Select-String "access-control-allow-origin"
curl.exe -s -D - -o NUL -H "Origin: $site" "$api/api/cpus?per_page=1" | Select-String "access-control-allow-origin"
```

8. **Visitor IP** (only after `VISITOR_IP_SECRET` is set on both servers). Send 6 wrong logins as visitor A, then 1 as visitor B, through the real site. Visitor A must get 429 on the 6th. Visitor B must NOT be blocked. The `x-real-ip` header must be set by the proxy, so test from outside, not with a fake header sent by yourself.
9. **In a browser:** register an account, log out, log in. Save a build, make it public, open the share link in a private window. The share link must start with the real domain.
10. **Compatibility:** in `/builder` choose a CPU and a motherboard. The result must appear (this tests CORS and the browser-to-API connection).
11. **Images:** a picture must load from `/_next/image?url=...` (Network tab, filter Img).

## 8. Known and accepted for now

- Plain demo images and demo data (section 4).
- Price or guide changes can take about 60 seconds to show (`apiGet` cache).
- No password reset or email verification yet (Laravel has none).
- The builder cannot show part notes (saving removes them).
- The price chart has no touch tooltips (the table is the fallback).
- The builder picker does not hide parts that do not fit.
- An old cookie of an expired token stays until the next login or logout.

## 9. Admin panel (Filament)

- [ ] The admin is at `https://api.example.com/admin`. It is on the API host, not on the website.
- [ ] Create the admin user on the production server: `php artisan make:filament-user`, then set `is_admin = true` in `php artisan tinker`. Nobody else can become an admin: registration cannot set `is_admin`.
- [ ] Run the Filament speed-up commands in the deploy script. Check the "Deploying to production" page of the Filament docs for the exact commands in the version we use (`php artisan filament:optimize` and `php artisan optimize`).
- [ ] After deploy, open `/admin` while logged out (must go to the login page), and try to log in with a normal user (must fail).
