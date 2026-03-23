# Master governance (invariants)

This file is the **stable rule anchor** for stage execution. Do not edit it to excuse scope creep; change it only via deliberate architecture decisions.

## Authoritative references

- **Project reality and limits:** repository root `README.md`
- **Deploy and entry modes:** `docs/DEPLOY.md` (ES modules vs Webpack bundle, git/Vercel, audit posture); **security posture:** `docs/SECURITY.md`; **Supabase fork (RLS):** `docs/SUPABASE_FORK.md`
- **Intended layering and data flow:** repository root `ARCHITECTURE.md` (JSON → catalog → views; admin/`localStorage`; optional bundle vs `/src`). Follow the invariants below and **flag drift** in audits.

## Stack (this repository)

| Layer | Technology |
|--------|------------|
| **UI** | HTML (`index.html`), modular CSS under `public/css/` |
| **App logic** | **Vanilla JavaScript**, ES modules under `src/` (`src/app.js` entry) |
| **Routing** | Client-side `src/router/Router.js` + views under `src/views/` |
| **Data (catalog)** | Static `data/products.json` (loaded in `src/data/products.js`) |
| **Persistence** | `localStorage`, optional `POST /api/*` when Python dev server runs |
| **Dev server** | Python 3: `server.py` (and optional `server_secure.py`) — **not** the Vercel production runtime unless replaced with serverless |
| **Build (optional)** | Webpack (`webpack.config.cjs` → `dist/bundle.js`); `index.html` may load `src/app.js` directly — know which path you ship |
| **Deploy** | Static hosting (e.g. Vercel via `vercel.json`) |
| **Quality** | ESLint, Prettier, Jest (jsdom), Husky |

## Non-negotiables

1. **Modules:** New feature code lives under `src/` as ES modules; keep **one obvious entry** (`src/app.js`) unless you intentionally switch to the Webpack bundle and update `index.html` accordingly.
2. **Separation:** **Views** (`src/views/`) handle DOM and user events; **services** (`src/services/`) hold business rules and I/O; **models** (`src/models/`) hold structured data. Avoid duplicating catalog rules in multiple views — go through `ProductService` / `Catalog` where applicable.
3. **Config:** Store-wide defaults live in `src/config/store.config.js`; runtime overrides from admin use `localStorage` — document any new persisted keys.
4. **Supabase / cloud:** `src/config/supabase.js` currently **disables** a browser Supabase client (`supabase === null`). Any change that re-enables client DB access must be reviewed for **RLS, keys, and exposure** (prefer server-side or build-time injection, not service role in the browser).
5. **A stage marked audit** does not require production code changes unless the stage explicitly says **REMEDIATION** or you have team approval to fix in the same pass.

## Stage system

- **Roadmap:** `STAGE_ASSIGNER.md`
- **How to run a stage:** `ORCHESTRATOR.md` and `START.md`
- **Repeatable audit checklist:** `subplans/domain_linkage_audit.md`
