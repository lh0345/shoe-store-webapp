# Deploy & fork checklist

Vanilla JS storefront template: **contact via email / WhatsApp**, **no payment stack** in the app. Use this with [`ARCHITECTURE.md`](../ARCHITECTURE.md) and [`README.md`](../README.md).
**Security posture:** [`SECURITY.md`](./SECURITY.md) · **Supabase / APIs / media / email:** [`INTEGRATIONS.md`](./INTEGRATIONS.md) · **Supabase (fork):** [`SUPABASE_FORK.md`](./SUPABASE_FORK.md)

## Git remote and push

```bash
git remote add origin https://github.com/<org>/<repo>.git
git push -u origin main
```

After changing `vercel.json` (e.g. admin redirect fix), trigger a **new production deployment** on Vercel so the dashboard picks up the file.

## Entry: ES modules (`/src/app.js`) vs Webpack bundle (`/dist/bundle.js`)

| Mode | When to use |
|------|-------------|
| **ES modules** (default root `index.html`) | Local dev with **`npm run dev`** (`scripts/static-dev-server.mjs`) or **`npm run dev:python`**; quick edits, many module requests. |
| **Webpack bundle** | Production-style: smaller initial parse path, lazy **admin** chunk under `/dist/`. |

**Luxon (holiday banners):** native ES modules cannot resolve npm package names like `luxon` without a bundler. Root `index.html` includes an **import map** pointing **`luxon`** → **`/public/libs/luxon.mjs`** (copied from `node_modules/luxon/build/es6/luxon.mjs` when upgrading `luxon`). Webpack bundles still resolve **`luxon`** from `node_modules` as usual.

After `npm run build`:

- **`dist/bundle.js`** — main chunk  
- **`dist/admin.*.js`** — loaded when user opens admin/login routes  
- **`dist/index.html`** — copy of the app shell that loads **`/dist/bundle.js`** (chunks load via `publicPath` **`/dist/`**)

**Options to ship the bundle:**

1. Keep site root as today but **swap the script** in root `index.html` from `/src/app.js` to `/dist/bundle.js` (`defer`, not `type="module"`), **or**  
2. Point your host’s document root at **`dist/`** and use **`dist/index.html`** as the homepage (you must still expose **`/data/`**, **`/public/`**, **`config.js`**, etc. — same origin paths as now).

Do **not** deploy only `bundle.js` without **`admin.*.js`** when using the bundle entry.

## npm audit (dev tooling)

`webpack` and other **devDependencies** pull transitive packages; `npm audit` warnings are often **CLI/build tools**, not your static site runtime. This template does **not** pin the **Vercel CLI** in `package.json` (use **`npm run deploy`** → **`npx vercel@latest`** to avoid hundreds of CLI-only transitive packages in the lockfile). Review advisories; avoid blind **`npm audit fix --force`** without testing.

## Supabase

`src/config/supabase.js` exports **`supabase === null`**. The app is designed for **static JSON + localStorage**. Re-enabling a browser Supabase client requires **env keys, RLS review**, and governance sign-off (see `.governance/MASTER_GOVERNANCE.md`). Step-by-step fork notes: **[`SUPABASE_FORK.md`](./SUPABASE_FORK.md)**.

## Admin authentication

Sessions and users live in **localStorage** with client-side checks only. Suitable for **demo / single-operator** use. For real multi-user admin or sensitive data, add a **server session**, HTTPS, and secrets handling — not covered by this template’s default scope. See **[`SECURITY.md`](./SECURITY.md)**.

## Holiday banners

`HolidayBannerService` uses **[Luxon](https://moment.github.io/luxon/)** with IANA timezone **`Europe/Skopje`**: each `YYYY-MM-DD` is a **calendar day in North Macedonia**, including DST. **Invalid dates** (e.g. `2025-02-31`) and **end before start** are ignored for that banner. Admin labels note the zone; see **`src/services/HolidayBannerService.js`** (`HOLIDAY_BANNER_TIME_ZONE`).

## Contact & social placeholders

Edit **`src/config/store.config.js`** (`contact`, **`social`**, SEO `siteUrl`). Footer WhatsApp uses **`social.whatsapp`** if set; otherwise **digits from `contact.phone`**.
