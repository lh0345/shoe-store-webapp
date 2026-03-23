# Technical debt & domain audits

## Remediation — 2026-03-23 (governance-driven fixes)

Addressed findings from **A1 / A4 / A5 / A9** slices (see `.governance/STAGE_ASSIGNER.md`):

- **A1:** `index.html` used literal `${Date.now()}` in URLs (invalid in static HTML). Replaced with fixed `?v=1` cache-bust tokens; bump when shipping asset changes.
- **A1 / static deploy:** Added root `config.js` so `window.ENV_CONFIG` exists when Python’s dynamic `/config.js` is not used (e.g. Vercel).
- **A4:** Removed duplicate `loadSessionSync()` call in `AuthService` constructor.
- **A5:** `ProductService` no longer runs pointless `initSupabase()` when the Supabase client export is intentionally `null`.
- **A9:** `DataService.readJSON('products')` now falls back to `fetch('/data/products.json')` after API failure; `server.py` implements **GET `/api/products`** so local dev matches `readFromSecureAPI` expectations.
- **Lint / A2:** `src/app.js` — `const router = new Router(routes)` after routes (handlers only touch `router` when invoked); Prettier fix on the error fallback HTML string.

## Remediation — 2026-03-23 (continued: A6 / A10 / lint hygiene)

- **A6 / ProductView:** Dropped unused `mainImg` parameter from `renderThumbs`; simplified JSON-LD sale branch (removed dead `oldPrice` / `oldPriceStr` parsing).
- **A6 / AdminView:** Removed dead `originalPrice` placeholder and unused `accentDarkColor` in PDF export (accent dark was read but never applied).
- **A10 / navbar:** `preventBodyScroll` no longer registers unused touch coordinates; `touchmove` alone preserves the scroll-lock behavior for taps outside the panel.
- **A4 / AuthService:** Removed unused pre-login `localUsers` / `localUser` lookup (redundant with the existing `getUsers()` path below).
- **Lint:** `npx eslint src/ tests/` is clean (0 warnings, 0 errors).

## Remediation — 2026-03-23 (A7 / A8 / A11 / A12)

- **A7 / `WishlistService`:** After `loadWishlist()` resolves, dispatches `wishlist-updated` so nav badges match storage when async load finishes; `clear()` is now `async` and awaits `saveToStorage()` (callers must `await` if they need ordering). New Jest case for `clear()`.
- **A8:** No code changes — holiday/currency/social modules reviewed; banner date logic left as-is (admin-tunable via storage).
- **A11:** `webpack.config.cjs` is a function of `argv.mode`; `npm run build` uses `webpack --mode production` (minified `dist/bundle.js`); `npm run build:dev` for development-style bundles. **`index.html` still loads `/src/app.js` (ES modules)** — the bundle is optional until you switch the HTML entry.
- **A12:** `jest.config.js` `collectCoverageFrom` paths corrected to `src/models`, `src/utils`, `src/services` (were previously wrong and collected nothing useful).
- **Vercel:** `buildCommand` is now `npm run lint && npm test && npm run build` so deploys fail CI-style on lint/test failures and still emit `dist/` for future bundle use.

## Remediation — 2026-03-23 (A3 / A8 / A9 / A12 continued)

- **A3 / `Router.js`:** `/product` and `/product/` with no slug now route to **`notFound`** instead of calling `product('')`.
- **A8 / `CurrencyService.js`:** `preferred_currency` in `localStorage` is validated to **`EUR` or `MKD`**; garbage values reset to `defaultCurrency` and rewrite storage.
- **A9 / tests:** New `tests/DataService.test.js` covers `readJSON('products')` via **`/data/products.json`** and **localStorage** fallback.
- **A12 / Husky:** `.husky/pre-commit` runs **`npm test`** after **`npm run lint`** (commits fail if tests fail; requires a git repo with husky installed).

## Remediation — 2026-03-24 (Router tests, dependency hygiene)

- **npm audit:** Ran **`npm audit fix`** (non-breaking); count of reported issues dropped. Remaining findings are largely **`vercel`** CLI transitive packages (fix would be a major bump — review before `npm audit fix --force`).
- **jspdf:** Dependency raised to **`^4.2.1`** for the npm advisory chain; **`public/libs/jspdf.min.js`** was later refreshed from the package UMD build (see remediation **2026-03-24 (Vercel CLI, jsPDF vendor, admin code-splitting)**).
- **A3 / `Router`:** Constructor accepts optional **`{ autoInit: false }`** so Jest can call **`handleRoute()`** without registering global listeners. **`tests/Router.test.js`** covers home, collection, wishlist, admin routes, **`/product`** without slug → **`notFound`**, slug routing, and unknown paths.
- **A12:** **`jest.config.js`** `collectCoverageFrom` now includes **`src/router/**/*.js`**.

## Remediation — 2026-03-24 (Vercel CLI, jsPDF vendor, admin code-splitting)

- **`vercel` (devDependency):** Upgraded to **v50** to track current CLI releases. **`npm audit`** may still report issues inside the CLI’s transitive graph; treat **`vercel` as a dev tool**, not the production browser bundle — revisit with **`npm audit fix`** / upstream releases periodically (avoid blind **`--force`**).
- **jspdf / `public/libs`:** Replaced **`public/libs/jspdf.min.js`** with **`jspdf.umd.min.js`** from **`jspdf@^4.2.1`** (`node_modules`) so the script the admin PDF loader fetches matches the npm major line.
- **A11 / Webpack:** **`AdminView`** and **`LoginView`** are loaded with **`import()`** and chunk name **`admin`**; production build outputs **`bundle.js`** (~239 KiB min) plus **`admin.[hash].js`** (~102 KiB). **`webpack.config.cjs`** sets **`output.chunkFilename`** for hashed async chunks. Deploy **`dist/`** in full when using the bundle entry.
- **`vercel.json`:** Removed **`/admin` → `/admin-login`** redirect — it conflicted with the SPA **`/admin`** dashboard route (router handles auth and redirects client-side). **`public/libs`:** removed duplicate **`jspdf.umd.min.js`** / **`jspdf.es.min.js`**; **`jspdf.min.js`** remains the script loaded by admin PDF export.

## Domain audit — Stage A1–A12 (template snapshot, 2026-03-23)

Governance checklist: `.governance/subplans/domain_linkage_audit.md`. Re-run after large refactors and append dated subsections. Below: **Observation** / **Risk** / **Bug-suspected** per stage (many items addressed in remediation sections above).

### A1 — HTML shell, assets, configuration

- **Observation:** `index.html` loads `spa-redirect.js`, `/config.js`, Supabase CDN, then `src/app.js` as a module; CSS uses fixed `?v=` cache-bust; root `config.js` supplies `window.ENV_CONFIG` on static hosts.
- **Risk:** Third-party scripts (fonts, Supabase CDN) add supply-chain and CSP surface; cache tokens must be bumped manually when assets change.
- **Bug-suspected:** None open from this pass; prior `${Date.now()}` in static HTML was remediated.

### A2 — Bootstrap (`app.js`, services, container)

- **Observation:** Cold start merges `store.config.js` with `localStorage['storeConfig']`, awaits `catalog`, registers services and `Router`, exposes globals on `window` for views.
- **Risk:** Heavy `app.js` still centralizes wiring; mistakes in init order can surface as subtle race bugs between catalog and first route.
- **Bug-suspected:** Low; router construction ordering was tightened (see remediation A2 / lint).

### A3 — Router and navigation

- **Observation:** `Router.js` maps paths to view handlers; `/product` and `/product/` without slug route to `notFound` (remediated). Optional **`{ autoInit: false }`** supports unit tests; **`tests/Router.test.js`** exercises `handleRoute` dispatch.
- **Risk:** Deep links and static-host SPA fallbacks must stay aligned (`vercel.json`, `404.html` patterns).
- **Bug-suspected:** None open for empty product slug after A3 fix.

### A4 — Auth and admin session

- **Observation:** `AuthService` uses browser storage patterns; Supabase export is `null`; admin is template-grade only.
- **Risk:** No server session — anyone who can run JS in the page context can bypass client-only gates; not suitable for real multi-tenant admin without backend auth.
- **Bug-suspected:** None open from duplicate `loadSessionSync` / dead lookup cleanup (remediated).

### A5 — Catalog and `ProductService`

- **Observation:** `data/products.json` → `products.js` → `Catalog`; `ProductService` loads `localStorage['shoe_products']` over the in-memory catalog when present; `supabase` intentionally unused.
- **Risk:** Two mental models (`products.json` vs `shoe_products`) confuse operators unless documented — see `ARCHITECTURE.md`.
- **Bug-suspected:** None open from pointless `initSupabase()` when client is null (remediated).

### A6 — Storefront views (home, collection, product)

- **Observation:** Views call services for listing, PDP, filters; dead parameters and unused PDF fields were removed in remediation.
- **Risk:** Future edits could reintroduce duplicate price/display logic across views instead of services.
- **Bug-suspected:** Low after A6 cleanup; watch JSON-LD and sale branches when prices change.

### A7 — Wishlist

- **Observation:** `WishlistService` persists to storage, dispatches `wishlist-updated`; `clear()` is async and must be awaited where ordering matters.
- **Risk:** Async load vs first paint can still race in exotic timing; badges rely on event flow.
- **Bug-suspected:** None open after post-load `wishlist-updated` dispatch (remediated).

### A8 — Currency, social, holiday banner

- **Observation:** `CurrencyService` validates stored currency to EUR/MKD; holiday banner logic is admin-tunable; date-range behavior not redesigned.
- **Risk:** Holiday date logic edge cases (time zones, DST) may surprise operators; social links are placeholders until config is set.
- **Bug-suspected:** None for currency storage garbage (remediated); banner scheduling remains “good enough” for template, not production calendar guarantees.

### A9 — `DataService`, APIs, environment

- **Observation:** `readJSON('products')` tries API path, then `fetch('/data/products.json')`, then `localStorage`; Python dev server adds GET `/api/products` parity.
- **Risk:** On pure static hosting, POST-based admin file sync does not persist to server files — only `localStorage` / client behavior.
- **Bug-suspected:** None open for missing static JSON fallback (remediated); integration tests cover `readJSON('products')`.

### A10 — Security, validation, errors

- **Observation:** CSRF, validation, and error utilities exist; navbar scroll-lock uses `touchmove` without unused coords (remediated).
- **Risk:** Client-side checks are not a substitute for server validation on any future real API.
- **Bug-suspected:** None flagged from A10 pass beyond template expectations.

### A11 — Webpack, Vercel, static vs dev server

- **Observation:** `webpack.config.cjs` respects `mode`; production build emits **`dist/bundle.js`** plus lazy **`admin.[hash].js`** (admin/login views); `index.html` still uses ES modules by default. **GitHub Actions** (`.github/workflows/ci.yml`) runs lint, test, and build on push/PR to **`main`**.
- **Risk:** Operators may deploy without switching entry or may expect server APIs on Vercel — behavior must match `ARCHITECTURE.md`. Bundle deploys must upload **all** `dist/` assets so async chunks resolve.
- **Bug-suspected:** None; strict `buildCommand` on Vercel may slow iteration — relax in dashboard if needed.

### A12 — Jest, ESLint, Husky

- **Observation:** Coverage paths fixed; Husky pre-commit runs lint then test; requires a git repo for hooks to matter. Repository uses **`main`** with an initial commit; add **`origin`** and push when using GitHub/Vercel (see `README.md` → Git and hosting).
- **Risk:** Test surface remains lighter for Router/views/auth than for services — regressions possible in thinly tested paths.
- **Bug-suspected:** None from config path fixes (remediated).

---

## Domain audit — Stage A* (future passes)

Re-run audits after large refactors; append new dated subsections here per `.governance/ORCHESTRATOR.md`.
