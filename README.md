# Shoe Store Webapp (client template)

A **vanilla JavaScript** storefront you can fork for **email / WhatsApp contact** workflows — **no in-app payment stack**. Data defaults to **`data/products.json`** with **localStorage** for admin overrides; see **[`ARCHITECTURE.md`](./ARCHITECTURE.md)** for the full data flow.

**Deploy, bundle entry, audit, Supabase, and auth expectations:** [`docs/DEPLOY.md`](./docs/DEPLOY.md) · **Audit history:** [`docs/TECHNICAL_DEBT.md`](./docs/TECHNICAL_DEBT.md)

---

## What this template is

- A **static-first SPA** (HTML shell + ES modules or optional Webpack bundle)
- **Configurable** branding, contact, and social placeholders via `src/config/store.config.js`
- **Admin UI** for demos — **browser-only auth**; not a substitute for server-side security
- **Optional** Python dev server for local `/api` parity; production is usually **static hosting** (e.g. Vercel)

This is **not** a hosted SaaS product, multi-tenant platform, or turnkey payment solution out of the box.

---

## Features

### Storefront
- Product catalog from JSON, filters, product detail, wishlist (**localStorage**)
- Currency toggle (**MKD / EUR**) with validation
- Mobile-responsive layout, modular CSS under `public/css/`

### Admin (template scope)
- Login, product CRUD, settings — persisted per browser via **localStorage** / dev APIs where wired
- **Change default admin password** before any real use (`store.config.js` / admin)

### Quality
- **ESLint**, **Prettier**, **Jest** (jsdom), **Husky** pre-commit, **GitHub Actions** CI on `main`

---

## Tech stack

| Area | Choice |
|------|--------|
| UI | HTML + CSS (`public/css/`) |
| App | ES modules under `src/`, entry `src/app.js` |
| Routing | `src/router/Router.js` |
| Data | `data/products.json`, `localStorage`, optional dev `POST /api/*` |
| Build (optional) | Webpack → `dist/bundle.js` + lazy `admin.*.js`; **`npm run build`** also writes **`dist/index.html`** |
| Deploy | Static host; `vercel.json` at repo root |

---

## Project layout

```
shoe-store-template/
├── index.html                 # Default shell: loads /src/app.js (ES modules)
├── config.js                  # Static ENV_CONFIG when Python /config is absent
├── data/products.json
├── public/css/ , public/libs/
├── src/                       # app.js, config/, views/, services/, …
├── dist/                      # produced by npm run build (gitignored)
├── server.py                  # Dev server + optional APIs
├── webpack.config.cjs
├── vercel.json
├── ARCHITECTURE.md
├── docs/DEPLOY.md
└── docs/TECHNICAL_DEBT.md
```

---

## Run locally

```bash
npm install
npm run dev          # Python server — see package.json
npm test
npm run lint
npm run build        # Webpack + dist/index.html (bundle entry)
npm run check        # test + lint + build (pre-push gate)
```

---

## Git and hosting

The default branch is **`main`**.

```bash
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

**Vercel:** use `vercel.json`; production branch **`main`**. After changing redirects or headers, **redeploy** so the dashboard applies them. Do **not** add a host redirect from **`/admin`** to **`/admin-login`** — the SPA owns **`/admin`**.

**GitHub Actions:** `.github/workflows/ci.yml` runs **`npm ci`**, lint, tests, and build on push/PR to **`main`**.

**Husky:** after `npm install`, pre-commit runs **lint** then **tests**.

---

## Known limits (by design)

- **No** server-rendered checkout or payment provider integration in-app
- **No** shared database in the default template — forks add their own backend if needed
- **`npm audit`** on **dev** tools (e.g. Vercel CLI) ≠ runtime CVEs for your static files — triage carefully

For detail on bundle vs `/src`, placeholders, and security posture, use **`docs/DEPLOY.md`**.
