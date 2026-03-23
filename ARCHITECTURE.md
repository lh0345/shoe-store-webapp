# Architecture

One-page map of how this **vanilla JS** storefront template is structured: static catalog, client routing, admin overrides, and optional build/deploy paths. For governance invariants, see `.governance/MASTER_GOVERNANCE.md`.

---

## Data flow: JSON → catalog → views

1. **`data/products.json`** — Default catalog shipped with the site. It is fetched at runtime (not bundled into JS).
2. **`src/data/products.js`** — Loads `/data/products.json`, builds placeholder images, instantiates **`Shoe`** models and a **`Catalog`**, and exports `catalog` as an async singleton.
3. **`src/app.js`** — Awaits the catalog, assigns **`window.catalog`**, wires **`ProductService`**, **`Router`**, and views. Store branding/contact defaults come from **`src/config/store.config.js`**, merged with **`localStorage`** when present (see below).
4. **Views** (`src/views/**`) — DOM and navigation; they read products through **`ProductService`** / global catalog rather than re-implementing catalog rules.

This template is **Email / WhatsApp contact–oriented**; there is no payment stack in the app layer.

---

## Source of truth (products, admin, services, storage)

| Layer | Role |
|--------|------|
| **`data/products.json`** | **Baseline** for a fresh visit: what you commit and deploy. |
| **`ProductService` + `localStorage` key `shoe_products`** | After the catalog loads from JSON, **`loadFromStorage()`** may **replace** in-memory products with whatever is stored under `shoe_products`. Admin CRUD and imports persist here. So for a given browser, **local overrides win** over the file until cleared. |
| **`DataService`** | General JSON read/write with cache, optional **`POST /api/*`** when the Python dev server is running, and **`localStorage`** keys like `data_<name>` (e.g. `data_products` for filename `products`). Used for file/API-style persistence paths; **catalog listing in the SPA is driven by `ProductService` + `shoe_products`**, not by `data_products` alone. |
| **Admin UI** | Changes products and store settings in memory and persists via the keys above (`shoe_products`, `storeConfig`, etc.). There is **no shared database** in the default template—forks that need a real backend should treat JSON + `localStorage` as demo scope. |

**Mental model:** ship **`products.json`** as the reproducible default; treat **per-browser `localStorage`** as the editable overlay for demos and admin workflows. To “reset” to the file, clear site data or remove the relevant keys.

---

## Admin and configuration

- **Store config** (brand, contact, colors, …): defaults in **`store.config.js`**, overridden by **`localStorage['storeConfig']`** when valid (`src/app.js`).
- **Admin authentication** is **browser-only** (template-appropriate); do not rely on it for real multi-user security without a server session or hosted auth.
- **Social / WhatsApp** links and similar fields are intended to be **config-driven**; replace placeholders with real URLs/numbers for production forks.

---

## Routing

- **`src/router/Router.js`** maps paths to view classes (home, collection, product, wishlist, admin, login, …).
- **`index.html`** is a single shell; navigation is client-side. Static hosts may need SPA fallback rules (see `vercel.json` / your host’s docs).

---

## Build and entry: ES modules vs Webpack bundle

| Approach | When to use |
|----------|-------------|
| **Current default:** `<script src="/src/app.js" type="module">`** | Simple debugging, no build step for local/static serving, many HTTP requests for modules. |
| **Optional:** **`webpack.config.cjs` → `dist/bundle.js`** | Run **`npm run build`**: writes **`dist/bundle.js`**, hashed **`admin.*.js`**, and **`dist/index.html`** (shell that loads **`/dist/bundle.js`**). **`publicPath`** is **`/dist/`** so chunks resolve from the site root. You can keep root **`index.html`** on **`/src/app.js`** for dev and use **`dist/index.html`** or a one-line script swap for production — see **`docs/DEPLOY.md`**. |

Only one entry path should be active in **`index.html`** for a given deployment.

---

## Supabase and cloud data

- **`src/config/supabase.js`** exports **`supabase === null`**. The browser client is **intentionally disabled**; `ProductService` does not use a live Supabase client in this repo.
- **Implication:** there is **no** cloud DB in the default template. Re-enabling a client would require keys, RLS review, and governance sign-off per `MASTER_GOVERNANCE.md`.

---

## Optional Python dev server

- **`server.py`** (and related scripts) can expose **`/api/*`** for wishlist or admin sync during development. **Static production hosts** (e.g. Vercel) typically **do not** run this Python server; behavior falls back to **`fetch('/data/products.json')`** and **`localStorage`** as implemented in **`DataService`**.

---

## Quality and deploy notes

- **ESLint / Prettier / Jest** — see `package.json` scripts. CI or Vercel **`buildCommand`** may run lint + test + build; relax in the dashboard if deploy time is an issue for a static demo.
- **Webpack:** admin and login routes are **lazy-loaded** in the bundle build to keep the main chunk smaller; the dev ES-module path still loads everything on demand via separate requests.
