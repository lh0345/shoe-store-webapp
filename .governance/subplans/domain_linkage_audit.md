# Subplan: domain linkage audit (stages A1–A12)

Use this checklist **for the stage you are in**. Read the stage block in `STAGE_ASSIGNER.md` first — it lists the **authoritative path scope**.

## 1. Map the slice (no code changes)

- [ ] List **entry points** (e.g. `src/app.js`, `index.html` script tags, route handlers) for this domain.
- [ ] List **services** involved (`src/services/*.js`) and how they are obtained (`ServiceContainer`, `window.*`, or direct `import`).
- [ ] List **data sources**: static JSON under `data/`, `fetch()` URLs, `localStorage` keys, optional `POST /api/*` (Python dev server).
- [ ] List **external systems** (Supabase CDN script, fonts, analytics if wired, Vercel-only behavior vs local Python).

## 2. Trace happy-path data flow

- [ ] **User action** → **view** (`src/views/`) → **service** → **model** / **JSON** / **storage**.
- [ ] Note **read path** back to UI (DOM updates, custom events, `window` globals).

## 3. Trace failure and edge paths

- [ ] Network failure loading `data/products.json` or API calls.
- [ ] Missing `window.ENV_CONFIG` when `/config.js` is absent (e.g. static deploy without Python).
- [ ] `localStorage` full or disabled; private mode quirks.
- [ ] Admin logout: session cleared, UI gates (`admin-only` / `customer-only`) consistent.

## 4. Consistency checks

- [ ] **Single source of truth** for product list vs admin edits vs persisted JSON (no contradictory catalog without an intentional rule).
- [ ] **Naming:** slugs, IDs, and filenames align between `ProductService`, routes, and links.
- [ ] **Architecture:** no new forbidden patterns (e.g. views importing only models while bypassing services for the same operation — flag if it happens).

## 5. Bad-code / smell signals (record, do not necessarily fix)

- [ ] Very large view or `app.js` block with mixed concerns — note file.
- [ ] Business rules duplicated across two views instead of a service.
- [ ] Silent `catch` without logging; floating Promises without `.catch` in user-facing flows.
- [ ] Fetch in a tight loop or on every keystroke without debounce.

## 6. Output

- [ ] Add **Domain audit — Stage &lt;ID&gt;** subsection to `docs/TECHNICAL_DEBT.md` with bullets: **Observation** / **Risk** / **Bug-suspected** (with file:line if known). Create the file under `docs/` if missing.
- [ ] If nothing found, write one line: “No issues recorded in this pass.”

## Stop conditions

- **Do not** implement fixes unless the team agreed this stage includes remediation.
- **Do not** expand into another stage’s scope — log “see stage A*x*” instead.
