# Governance — start here

## What this is

A **stage-gated** workflow for this **vanilla JS SPA** (shoe / e-commerce template). Stages **A1–A12** are **domain linkage audits**: one vertical slice per stage, end-to-end, to verify how modules connect and where logic may be wrong.

There is **no** `npm run start-stage` script in this repo. To run a stage:

1. Open `STAGE_ASSIGNER.md` and find the stage (e.g. **A3**).
2. Follow paths and “Do not” boundaries listed there.
3. Use `ORCHESTRATOR.md` + `subplans/domain_linkage_audit.md` for the procedure.

## Quick commands (after edits)

```bash
npm run lint
npm test
npm run build
```

## Stage map (summary) — shoe webapp

| ID | Name |
|----|------|
| A1 | HTML shell, `index.html`, scripts, CSS load order |
| A2 | Bootstrap: `src/app.js`, `Application.js`, `ServiceContainer`, globals |
| A3 | Router, routes, navigation, `viewSwitcher` |
| A4 | Auth & admin session: `AuthService`, `LoginView`, `AdminView` |
| A5 | Catalog & products: `products.js`, `ProductService`, `data/products.json` |
| A6 | Product & collection UI: `ProductView`, `CollectionView`, `HomeView` |
| A7 | Wishlist: `WishlistService`, `WishlistView`, badges |
| A8 | Currency, social, holiday banner services + UI touchpoints |
| A9 | Data layer: `DataService`, `/api/*`, Python server, `localStorage` fallbacks |
| A10 | Utilities: security, validation, CSRF, rate limit, errors |
| A11 | Build & deploy: Webpack, `vercel.json`, static assets vs dev server |
| A12 | Tests, tooling: Jest, ESLint, Husky; cross-cutting cleanup |

## Files

| File | Role |
|------|------|
| `MASTER_GOVERNANCE.md` | Invariants and stack |
| `STAGE_ASSIGNER.md` | Full stage definitions and scoped paths |
| `ORCHESTRATOR.md` | How to run a stage |
| `subplans/domain_linkage_audit.md` | Checklist for every A* stage |
