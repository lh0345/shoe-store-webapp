# Stage assigner — domain linkage and remediation (shoe / vanilla JS SPA)

**Purpose:** This file is the **roadmap of executable stages**. Each stage has a **single primary goal**, a **frozen path scope** (what to read and trace), and a **definition of done**. Stages are ordered so humans (and agents) can open a stage by **ID** without guessing scope.

This repo has **no** `npm run start-stage` — use `START.md` for the manual workflow.

---

## Product intent (read before any stage)

- **Authoritative UX:** Wired routes and views under `src/views/`, driven by `src/router/Router.js` and `src/app.js`, express how the store is supposed to behave.
- **Data truth:** The live catalog load path uses **`data/products.json`** (see `src/data/products.js`). Admin and `DataService` may also target APIs or `localStorage` — treat **multiple persistence paths** as a risk until documented.
- **Written record:** Put audit findings in `docs/TECHNICAL_DEBT.md` (create `docs/` if needed). The README’s “reality check” is not overridden by aspirational comments in code.

---

## Global execution rules

| Rule | Detail |
|------|--------|
| **Orchestrator** | `.governance/ORCHESTRATOR.md` — default for **A\*** stages: **DOMAIN_LINKAGE_AUDIT** (document findings; **no code** unless **REMEDIATION**). |
| **Checklist** | `.governance/subplans/domain_linkage_audit.md` |
| **Invariants** | `.governance/MASTER_GOVERNANCE.md` |
| **After edits** | `npm run lint`, targeted `npm test`, and `npm run build` if build inputs changed |

---

## Stage index

| ID | Category | Name |
|----|----------|------|
| **A1** | Audit | HTML shell, assets, `config.js` |
| **A2** | Audit | App bootstrap, services, container |
| **A3** | Audit | Router and view switching |
| **A4** | Audit | Auth and admin session |
| **A5** | Audit | Catalog, `ProductService`, JSON pipeline |
| **A6** | Audit | Product, collection, home views |
| **A7** | Audit | Wishlist |
| **A8** | Audit | Currency, social, holiday banner |
| **A9** | Audit | `DataService`, APIs, Python parity |
| **A10** | Audit | Security, validation, errors |
| **A11** | Audit | Webpack, Vercel, static vs dev server |
| **A12** | Audit | Jest, ESLint, Husky, cross-cutting |

Remediation IDs (**B-***, **ADR-***) are **placeholders** — add rows when you open a tracked fix.

---

## Audit stages (A1–A12)

### A1 — HTML shell, assets, configuration injection

| Field | Value |
|-------|--------|
| **Goal** | Verify load order, cache-busting query params, `/config.js` dependency, and CDN scripts. |
| **Paths** | `index.html`, `404.html`, `manifest.json`, `scripts/spa-redirect.js`, `public/css/*.css` (links from HTML). |
| **Trace** | What runs before `src/app.js`; what breaks if `/config.js` 404s. |
| **Outputs** | `Domain audit — Stage A1` in `docs/TECHNICAL_DEBT.md`. |
| **Do not** | Deep-audit router logic — pointer “see A3”. |

---

### A2 — Bootstrap: `app.js`, `Application`, service wiring

| Field | Value |
|-------|--------|
| **Goal** | Map cold start: imports, `ServiceContainer`, `window` globals, catalog await, navbar/footer init. |
| **Paths** | `src/app.js`, `src/utils/Application.js`, `src/utils/ServiceContainer.js`, `src/utils/viewSwitcher.js`, `src/utils/navbar.js`. |
| **Trace** | Order of service registration vs router start; error boundaries if any. |
| **Outputs** | `Domain audit — Stage A2` in `docs/TECHNICAL_DEBT.md`. |

---

### A3 — Router and navigation

| Field | Value |
|-------|--------|
| **Goal** | Map declared routes, history integration, and which view class renders for each path. |
| **Paths** | `src/router/Router.js`, `src/utils/viewSwitcher.js`, imports from `src/app.js` that register routes. |
| **Trace** | Deep links, back/forward, mobile nav vs desktop. |
| **Outputs** | `Domain audit — Stage A3` in `docs/TECHNICAL_DEBT.md`. |

---

### A4 — Auth and admin

| Field | Value |
|-------|--------|
| **Goal** | Map admin login, session storage, logout, rate limiting hooks, and `supabase` usage (currently disabled in `src/config/supabase.js`). |
| **Paths** | `src/services/AuthService.js`, `src/views/LoginView.js`, `src/views/AdminView.js`, `src/utils/password.js`, `src/utils/RateLimiter.js`. |
| **Trace** | Session lifetime; what happens on refresh; guest vs admin UI. |
| **Outputs** | `Domain audit — Stage A4` in `docs/TECHNICAL_DEBT.md`. |

---

### A5 — Catalog and product domain

| Field | Value |
|-------|--------|
| **Goal** | Map `data/products.json` → `Catalog` / `Shoe` → `ProductService` caches and CRUD. |
| **Paths** | `src/data/products.js`, `src/models/Shoe.js`, `src/models/Catalog.js`, `src/services/ProductService.js`, `data/products.json`. |
| **Trace** | Admin edits vs file vs `localStorage`; search index invalidation. |
| **Outputs** | `Domain audit — Stage A5` in `docs/TECHNICAL_DEBT.md`. |

---

### A6 — Storefront views (product, collection, home)

| Field | Value |
|-------|--------|
| **Goal** | Map UI → service calls for listing, filters, PDP, images, currency attributes. |
| **Paths** | `src/views/HomeView.js`, `src/views/CollectionView.js`, `src/views/ProductView.js`, shared helpers used by them under `src/utils/`. |
| **Trace** | Slug/id routing to product; broken image fallbacks. |
| **Outputs** | `Domain audit — Stage A6` in `docs/TECHNICAL_DEBT.md`. |

---

### A7 — Wishlist

| Field | Value |
|-------|--------|
| **Goal** | Map wishlist add/remove, events, badges, persistence via `WishlistService` and `DataService`. |
| **Paths** | `src/services/WishlistService.js`, `src/views/WishlistView.js`, `src/app.js` (listeners), `data/wishlist_*.json` if used locally. |
| **Trace** | Guest wishlist identity; sync with API when present. |
| **Outputs** | `Domain audit — Stage A7` in `docs/TECHNICAL_DEBT.md`. |

---

### A8 — Currency, social, holiday banner

| Field | Value |
|-------|--------|
| **Goal** | Map `CurrencyService`, `SocialService`, `HolidayBannerService` and where DOM/global state updates fire. |
| **Paths** | `src/services/CurrencyService.js`, `src/services/SocialService.js`, `src/services/HolidayBannerService.js`, `src/config/store.config.js` (branding/contact). |
| **Trace** | `data-eur` / `data-mkd` conventions; banner dismissal persistence. |
| **Outputs** | `Domain audit — Stage A8` in `docs/TECHNICAL_DEBT.md`. |

---

### A9 — `DataService`, APIs, environment

| Field | Value |
|-------|--------|
| **Goal** | Map `readJSON` / `writeJSON`, `/api/products`, `/api/wishlist`, `API_KEY`, fallbacks to `localStorage`. |
| **Paths** | `src/services/DataService.js`, `server.py` (POST handlers, `/config.js`), optional `server_secure.py` if used. |
| **Trace** | Production static hosting without Python — which calls always fail and which fallbacks apply. |
| **Outputs** | `Domain audit — Stage A9` in `docs/TECHNICAL_DEBT.md`. |

---

### A10 — Security and validation utilities

| Field | Value |
|-------|--------|
| **Goal** | Review client-side security helpers: input validation, CSRF token usage, sanitization, `ErrorBoundary` behavior. |
| **Paths** | `src/utils/security.js`, `src/utils/inputValidation.js`, `src/utils/CSRFProtection.js`, `src/utils/ErrorBoundary.js`, `src/services/ToastService.js`. |
| **Trace** | What is actually enforced vs informational; mismatch with server when API absent. |
| **Outputs** | `Domain audit — Stage A10` in `docs/TECHNICAL_DEBT.md`. |

---

### A11 — Build and deploy

| Field | Value |
|-------|--------|
| **Goal** | Align Webpack output with how `index.html` loads the app; verify `vercel.json` rewrites and headers match SPA needs. |
| **Paths** | `webpack.config.cjs`, `package.json` scripts, `vercel.json`, `.env.template` (no secrets). |
| **Trace** | Whether production uses `dist/bundle.js` or `/src/app.js` modules; implications for caching. |
| **Outputs** | `Domain audit — Stage A11` in `docs/TECHNICAL_DEBT.md`. |

---

### A12 — Tests and repo hygiene

| Field | Value |
|-------|--------|
| **Goal** | Map Jest coverage areas, ESLint scope, Husky hook; identify untested critical paths. |
| **Paths** | `jest.config.js`, `tests/`, `eslint.config.js`, `.husky/pre-commit`, `babel.config.js`. |
| **Trace** | Whether tests mock browser APIs consistently with production. |
| **Outputs** | `Domain audit — Stage A12` in `docs/TECHNICAL_DEBT.md`. |

---

## Remediation stages (add rows as needed)

| ID | Objective |
|----|-------------|
| *TBD* | Use **B-** prefix for bugfix stages scoped from `TECHNICAL_DEBT.md`. |
| *TBD* | Use **ADR-** prefix if you add `docs/adr/` and formal decisions. |

---

## How to execute (quick reference)

1. Pick **stage ID** from the index (e.g. `A5`).
2. Open **this file** at that stage — respect **Paths** and **Do not** boundaries.
3. Follow `.governance/ORCHESTRATOR.md`.
4. For **A\*** audits: complete `subplans/domain_linkage_audit.md` and append findings to `docs/TECHNICAL_DEBT.md`.
