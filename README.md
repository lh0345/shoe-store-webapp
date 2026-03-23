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
shoe-webapp/
├── app.js                    # Main app (734 lines of vanilla JS)
├── index.html               # Single page app
├── main.css                 # Main styles
├── server.py                # Python dev server
├── jest.config.js           # Test config
├── babel.config.js          # ES modules support
├── config/
│   └── store.config.js      # Basic config
├── data/
│   └── products.js          # Local product data
├── models/
│   ├── Shoe.js             # Shoe model class
│   ├── Catalog.js          # Product catalog
│   └── User.js             # User model
├── views/
│   ├── HomeView.js         # Home page
│   ├── ProductView.js      # Product details
│   ├── CollectionView.js   # Product listing
│   ├── WishlistView.js     # Wishlist page
│   ├── AdminView.js        # Basic admin
│   └── LoginView.js        # Login form
├── services/
│   ├── AuthService.js      # Basic auth (no real security)
│   ├── ProductService.js   # Product operations
│   ├── WishlistService.js  # Wishlist management
│   ├── CurrencyService.js  # Currency toggle
│   └── SocialService.js    # Social sharing
├── utils/
│   ├── ServiceContainer.js # Dependency injection
│   ├── Application.js      # App initialization
│   └── helpers.js          # Utility functions
└── tests/
    └── Shoe.test.js        # Basic model tests
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
