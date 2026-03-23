# Forking with Supabase

The template ships with **`src/config/supabase.js` exporting `supabase === null`** so the app never talks to Postgres from the browser until you deliberately wire it. This guide is for forks that want **Supabase Auth** and/or **Postgres** with **Row Level Security (RLS)**.

**Broader context:** how to think about **APIs**, **Edge Functions**, **Cloudinary**, **EmailJS**, and **admin vs storefront** — see **[`INTEGRATIONS.md`](./INTEGRATIONS.md)**.

## 1. Prerequisites

- A Supabase project ([supabase.com](https://supabase.com)).
- **Anon** and **service role** keys — only the **anon** key belongs in client-side env; **never** ship the service role to the browser.

## 2. Environment variables

Typical names (align with your host and `window.ENV_CONFIG`):

| Variable | Where |
|----------|--------|
| `SUPABASE_URL` or `VITE_SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` or `VITE_SUPABASE_ANON_KEY` | Public anon key (RLS-enforced) |

Load them into the shell via **`config.js`** or your host’s env injection so `window.ENV_CONFIG` (or `process.env` at build time) exposes them.

## 3. Client initialization (fork)

In a fork, you would replace the null export with something like:

```js
import { createClient } from '@supabase/supabase-js';

export function getSupabaseClient() {
  const url = window.ENV_CONFIG?.SUPABASE_URL;
  const key = window.ENV_CONFIG?.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}
```

Then **refactor `AuthService` and data paths** to use Supabase Auth APIs instead of (or in addition to) `localStorage` — this is **non-trivial** and should be tracked as its own milestone.

## 4. RLS: why it matters

Without RLS, anyone with the anon key can read/write tables the policies allow. **Enable RLS** on every table exposed to the client and add policies that match your roles.

### Example policies (illustrative — adjust schema names)

**Profiles (users see only their row):**

```sql
alter table public.profiles enable row level security;

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);
```

**Products (public read, admin write via claim or role):**

```sql
alter table public.products enable row level security;

create policy "Anyone can read active products"
  on public.products for select
  using (true);

-- Example: only service role or edge function should insert; or use a custom claim:
-- create policy "Admin insert" ... using ( (auth.jwt() ->> 'role') = 'admin' );
```

Use the **Supabase dashboard** SQL editor to iterate; test with the **anon** key from a minimal script before shipping.

## 5. What stays server-side

- **Payment secrets**, **service role**, **webhooks**, and **privileged migrations** belong in **Edge Functions**, **serverless routes**, or CI — not in the SPA.

## 6. Template scope

This repository does **not** enable Supabase by default. Treat **`docs/DEPLOY.md`**, **`docs/SECURITY.md`**, and governance notes in **`.governance/`** as complementary when you propose client DB access.
