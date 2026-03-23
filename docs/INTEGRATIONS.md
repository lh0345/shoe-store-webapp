# Integrations: Supabase, APIs, Cloudinary, EmailJS, and admin vs storefront

How optional services fit this **vanilla JS** template and **why** they are separated. For deploy and bundle entry, see [`DEPLOY.md`](./DEPLOY.md). For security posture, see [`SECURITY.md`](./SECURITY.md).

---

## 1. Supabase — reconfiguration and APIs

### Why the template disables the browser client

`src/config/supabase.js` exports **`null`** so the default app does **not** send your anon key to Postgres until you **choose** to fork. That avoids accidental **RLS mistakes** and keeps the static JSON + `localStorage` story clear.

### Reconfiguration (fork checklist)

1. Create a Supabase project; copy **Project URL** and **anon** key (Dashboard → Settings → API).
2. Expose only **`SUPABASE_URL`** and **`SUPABASE_ANON_KEY`** to the client (e.g. `window.ENV_CONFIG` via `config.js` or your host’s env injection). **Never** put the **service role** key in the SPA — it bypasses RLS.
3. Replace the null export with `createClient(url, anonKey)` (see [`SUPABASE_FORK.md`](./SUPABASE_FORK.md)).
4. **Define tables and RLS** before shipping: anon key + bad policies = public data exposure.
5. Refactor **`AuthService`**, **`ProductService`**, and any admin paths to use **Supabase Auth** and/or **PostgREST** with policies that match your roles.

### How to do “the APIs”

| Pattern | Use when |
|--------|----------|
| **Supabase client in browser** (`@supabase/supabase-js`) | Reads/writes allowed by **RLS** (e.g. public products, user-owned rows). |
| **Supabase Edge Functions** | Secrets, payment webhooks, privileged logic — **not** safe in static JS. |
| **Your own server / serverless routes** (`/api/*`) | Same as Edge Functions: hold **service role** or third-party secrets; validate sessions. |
| **Python `server.py` (local)** | Dev-only parity; production is usually static + serverless. |

**Why RLS:** The anon key is **public**. RLS is how Postgres enforces “this user may only see their rows.” Without it, you are relying on obscurity.

---

## 2. Cloudinary (images)

### What it is

A **hosted media pipeline**: upload, transform (resize, format), CDN delivery. Product images can stay **URLs** in JSON or in a database.

### Why use it (or similar)

- **Performance:** Responsive sizes and modern formats without baking every variant into the repo.
- **Separation:** Large binaries are not in Git; you swap URLs per environment.
- **Secrets:** **API secret** and **unsigned upload presets** belong in **server-side** or **signed** flows. The storefront should only receive **public** URLs or **signed upload URLs** from a backend — not your master API secret in `window`.

### Template note

`.env.template` lists Cloudinary for forks that add **server-side** or **Edge** upload endpoints. The stock template does **not** wire Cloudinary in `src/` by default.

---

## 3. EmailJS (email from the browser)

### What it is

A **third-party bridge** that sends email using **public** keys and **templates** you configure in their dashboard — typical for **contact forms** or light notifications.

### Why use it

- **No mail server** in your repo for simple “email us” flows.
- **Rate limits and abuse** are partly on EmailJS’s side; still **not** a bulk transactional system.

### Limits

- **Not** for high-volume order systems or secrets — use **server-side** mail (SMTP, SendGrid, Resend) with **API keys on the server**.
- **Admin notifications** for sensitive operations should go through **your backend**, not a public EmailJS template alone.

---

## 4. Why keep admin separate (conceptually and in architecture)

| Concern | Storefront | Admin |
|--------|------------|--------|
| **Threat model** | Public catalog, wishlist, contact | Privileged CRUD, settings, exports |
| **Auth** | Often none or customer-only | Must not rely on **browser-only** auth for real production (see [`SECURITY.md`](./SECURITY.md)) |
| **Keys** | Anon / public URLs only | Prefer **separate** session, **server** checks, or **role** claims — not the same as “same SPA bundle” trust |
| **APIs** | Read-heavy, cacheable | Write-heavy, audit-worthy |

**Separate** does not always mean a different repo: it means **separate routes** (`/admin`), **separate RLS policies**, **separate rate limits**, and **no shared “god” API key** in the client for admin writes. For a serious fork, a **subdomain** (`admin.example.com`) and **stricter CSP** are common hardening steps.

---

## 5. Quick reference

| Service | Typical client exposure | Secrets location |
|---------|-------------------------|------------------|
| Supabase anon | Yes (with RLS) | Never service role in browser |
| Cloudinary URLs | Yes | API secret / upload signing on server |
| EmailJS public key | Yes (by design) | Private keys only in EmailJS dashboard; not “secret” like DB password |
| Custom REST `/api` | Fetch from same origin | API keys only on server |

See also: [`SUPABASE_FORK.md`](./SUPABASE_FORK.md), [`ARCHITECTURE.md`](../ARCHITECTURE.md).
