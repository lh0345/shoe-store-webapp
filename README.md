# Shoe Store Webapp

A basic vanilla JavaScript e-commerce webapp for displaying shoes. **This is NOT a commercial SaaS product.** It's a learning project/demo with limited functionality.

**How data, routing, and deploy paths fit together:** see [`ARCHITECTURE.md`](./ARCHITECTURE.md) at the repo root. Ongoing audit notes and remediation history: [`docs/TECHNICAL_DEBT.md`](./docs/TECHNICAL_DEBT.md).

---

## ⚠️ Reality Check

**This is NOT:**
- A production-ready SaaS template
- Something you can deploy in 3 hours
- A €500 commercial product
- A business you can sell to clients
- A template for creating multiple stores

**This IS:**
- A basic shoe store demo
- A learning project in vanilla JS
- A portfolio piece
- Something that works locally
- Code you can learn from

---

## 🚀 What Actually Works

### Basic Features
- ✅ Display shoe products from local data
- ✅ Product filtering (basic)
- ✅ Wishlist (localStorage only)
- ✅ Currency toggle (MKD/EUR)
- ✅ Social sharing buttons
- ✅ Mobile-responsive design
- ✅ Product search (basic)

### Admin Features (Limited)
- ✅ Basic admin login
- ✅ Add/edit/delete products (in memory only)
- ❌ No real database persistence
- ❌ No image upload
- ❌ No analytics

### Security Improvements
- ✅ Server-side API proxy (no client-side database keys)
- ✅ Input validation and sanitization
- ✅ Secure wishlist persistence
- ✅ Error handling with user feedback
- ✅ Optimistic UI updates with rollback on failure

### Technical Stuff
- ✅ Vanilla JavaScript (ES6 modules)
- ✅ Python development server with API endpoints
- ✅ Jest tests (comprehensive)
- ✅ Modular CSS architecture
- ✅ Event-driven architecture for UI updates
- ✅ Optional Webpack bundle (`dist/bundle.js`); `index.html` defaults to ES module entry (`/src/app.js`)
- ❌ No real backend
- ❌ No deployment automation

---

## 🛠️ Tech Stack (Reality)

- **Frontend:** Vanilla JavaScript SPA
- **Styling:** Plain CSS (modular files)
- **Data:** Local JSON file (no database)
- **Server:** Python HTTP server (development only)
- **Testing:** Jest with jsdom
- **Persistence:** localStorage only

---

## 📂 Actual Project Structure

```
shoe-store-template/
├── index.html                 # SPA shell (loads src/app.js as ES module)
├── config.js                  # Static ENV_CONFIG for hosts without Python /config
├── data/
│   └── products.json          # Default catalog (fetched at runtime)
├── public/css/                # Modular stylesheets
├── src/
│   ├── app.js                 # Entry: services, router, views
│   ├── config/                # store.config.js, supabase.js (client disabled)
│   ├── data/products.js       # Loads JSON → Catalog / Shoe
│   ├── models/                # Shoe, Catalog, User
│   ├── router/Router.js
│   ├── services/              # Product, auth, wishlist, currency, DataService, …
│   ├── utils/                 # navbar, viewSwitcher, helpers, …
│   └── views/
│       ├── home/, collection/, product/, wishlist/, login/
│       └── admin/               # AdminView + admin products/settings/PDF/…
├── tests/                     # Jest (jsdom)
├── server.py                  # Python dev server + optional /api routes
├── webpack.config.cjs         # Optional dist/bundle.js
├── vercel.json
├── ARCHITECTURE.md
└── docs/TECHNICAL_DEBT.md
```

---

## 🚀 How to Actually Run This

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test
```

That's it. No fancy deployment scripts, no automated setup, no SaaS magic.

### Git and hosting

The repository uses the **`main`** branch. To publish to GitHub (or another host), add a remote and push:

```bash
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

**Vercel:** import the repo and keep the production branch on **`main`**; configuration lives in `vercel.json` at the project root. If the dashboard **build** step feels too heavy (lint + test + webpack), you can relax it there.

**GitHub Actions:** on push or pull request to **`main`**, `.github/workflows/ci.yml` runs **`npm ci`**, **lint**, **tests**, and **webpack build** (same idea as the Vercel build command).

**Husky:** after `npm install`, pre-commit runs **lint** then **tests**. Commits fail if either step fails.

---

## What's Missing (Major Gaps)

### No Real Backend
- Products stored in local JSON file
- No database integration
- No user accounts for admin

### Deployment (template scope)
- Static hosting (e.g. Vercel) is configured; no app server in production by default
- Optional Webpack build; Python APIs are dev-oriented
- No automated multi-environment pipeline out of the box

### No Business Features
- No inventory management
- No analytics for product viewed most.

### Security Issues
- No real authentication
- No CSRF protection (despite having the code)
- No input validation only on customer part.
- No HTTPS enforcement


## 🎯 What This Actually Is

This is a **learning project** that demonstrates:
- Vanilla JavaScript architecture
- Modular CSS organization
- Basic SPA routing
- Service layer pattern
- localStorage usage
- Event-driven UI updates


## 📞 Contact

**Built as a coding exercise, not a business venture.**

*Reality: It's just a shoe store demo. 🚀*
