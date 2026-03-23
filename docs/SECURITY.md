# Security posture (template defaults)

This document describes **what the stock template does not guarantee** so forks can calibrate expectations and hardening work.

## Admin authentication

- **Sessions and credentials** are stored in **`localStorage`** (and derived keys per brand slug). There is **no server-side session**, **no HttpOnly cookie**, and **no** CSRF protection wired to a backend by default.
- **Rate limiting** and “security” UIs are **browser-only**; a determined attacker can bypass them by calling APIs directly or forging requests if you add a server later without proper auth.
- **Change the default admin password** before any real deployment; treat default credentials as **public knowledge**.

**When you need real admin security:** use a **server session** (or Supabase Auth with RLS), **HTTPS only**, **secrets in environment** (never in the repo), and **principle of least privilege** for roles.

## Static assets and configuration

- **`config.js`** / **`window.ENV_CONFIG`** may expose **non-secret** public keys (e.g. Supabase anon key). **Anon keys are not secret** by design, but **RLS policies** must enforce data access; see [`docs/SUPABASE_FORK.md`](./SUPABASE_FORK.md).
- **Supabase** is **disabled** in `src/config/supabase.js` in the template; enabling a browser client is an **explicit fork decision**.

## Third-party scripts

- The HTML shell may load CDN scripts (e.g. fonts). Use **Subresource Integrity** and **CSP** headers on your host if you need stricter supply-chain control.

## npm audit

- **`npm audit`** on **devDependencies** (CLI, bundler) often does **not** map to vulnerabilities in your **deployed static files**. Treat reports as **triage**, not automatic “must fix” for the browser bundle.

For deploy and bundle entry, see [`docs/DEPLOY.md`](./DEPLOY.md). For Supabase, Cloudinary, EmailJS, and admin vs storefront, see [`docs/INTEGRATIONS.md`](./INTEGRATIONS.md).
