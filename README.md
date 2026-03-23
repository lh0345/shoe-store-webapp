# Shoe Store Webapp (client template)

A **vanilla JavaScript** storefront you can fork for **email / WhatsApp contact** workflows — **no in-app payment stack**. Data defaults to **`data/products.json`** with **localStorage** for admin overrides; see **[`ARCHITECTURE.md`](./ARCHITECTURE.md)** for the full data flow.

**Deploy & bundle:** [`docs/DEPLOY.md`](./docs/DEPLOY.md) · **Integrations (Supabase, APIs, Cloudinary, EmailJS, admin):** [`docs/INTEGRATIONS.md`](./docs/INTEGRATIONS.md) · **Security:** [`docs/SECURITY.md`](./docs/SECURITY.md) · **Supabase (fork):** [`docs/SUPABASE_FORK.md`](./docs/SUPABASE_FORK.md) · **Audit history:** [`docs/TECHNICAL_DEBT.md`](./docs/TECHNICAL_DEBT.md)

---

## What this template is

- A **static-first SPA** (HTML shell + ES modules or optional Webpack bundle)
- **Configurable** branding, contact, and social placeholders via `src/config/store.config.js`
- **Admin UI** for demos — **browser-only auth**; not a substitute for server-side security
- **Optional** local dev servers (Node by default, Python for full **`POST /api`**) for `/api` parity; production is usually **static hosting** (e.g. Vercel)

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
├── data/                      # products.json, wishlist_*.json, products-template.csv
├── public/css/ , public/libs/
├── scripts/                   # dev servers, spa-redirect, sync, dist index helper
│   ├── static-dev-server.mjs  # Default `npm run dev` (Node; GET /config.js, /api/products, SPA)
│   ├── server.py              # `npm run dev:python` — full GET/POST /api/* parity
│   ├── server_secure.py       # Optional Supabase-aware dev server (`npm run dev:secure`)
│   └── sql/setup.sql          # Supabase schema (run in SQL editor)
├── src/                       # app.js, config/, views/, services/, …
├── dist/                      # produced by npm run build (gitignored)
├── webpack.config.cjs
├── vercel.json
├── ARCHITECTURE.md
├── docs/DEPLOY.md
├── docs/INTEGRATIONS.md
├── docs/SECURITY.md
├── docs/SUPABASE_FORK.md
└── docs/TECHNICAL_DEBT.md
```

---

## Run locally

```bash
npm install
# Optional: copy .env.template → .env.local for local env (gitignored; never commit secrets)
npm run dev          # Node static server (default; no Python required)
npm test
npm run lint
npm run build        # Webpack + dist/index.html (bundle entry)
npm run check        # test + lint + build (pre-push gate)
```

**`net::ERR_CONNECTION_REFUSED` on `/src/...` modules:** the app must be opened over **HTTP** with a server running — e.g. **`npm run dev`** then **http://localhost:8000/** (if **8000** is busy, the dev server tries **8001**, **8002**, … and prints the URL). Do not open `index.html` as a `file://` URL. If you need Python **`POST /api/*`** (admin file sync), use **`npm run dev:python`** instead (requires `python3` on your PATH; on Windows you can use **`py -3 scripts/server.py`**).

**`EADDRINUSE` / port already in use:** stop the other process on that port, or run with a fixed port: **`set PORT=8001 && npm run dev`** (cmd) / **`$env:PORT=8001; npm run dev`** (PowerShell).

**Wishlist / `POST /api`:** the Node dev server implements **`POST /api/wishlist`** and **`POST /api/products`** (same API key rules as Python). If you see **401**, align **`API_KEY`** in **`.env.local`** with what the client sends (default **`demo-key-123`**).


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
- **`npm audit`** on **dev** tools (bundler, test runner) ≠ runtime CVEs for your static files — triage carefully; **`npm run deploy`** uses **`npx vercel@latest`** so the Vercel CLI is not pinned in `package.json`

For detail on bundle vs `/src`, placeholders, and security posture, use **`docs/DEPLOY.md`**.
