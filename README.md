# BnB Manager — SaaS for BnB / Airbnb owners

Multi-tenant SaaS to manage rooms, bookings, payments and expenses.
Each user only sees and edits their own data — enforced by Postgres RLS.

## Tech

- **Frontend:** React 18 + Vite + TypeScript + Tailwind + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + RLS) — **external project, fully under your control**
- **Validation:** zod (client) + Postgres CHECK constraints (server)

## Folder structure

```
src/
  components/       AppLayout, ProtectedRoute, ui/*
  context/          AuthContext (Supabase auth)
  lib/              supabase client + types
  pages/            Login, Signup, Dashboard, Rooms, Bookings, Expenses
supabase/
  schema.sql        Full schema + RLS (copy-paste into Supabase SQL editor)
.env.example        Env var template
```

## Setup

### 1. Create a Supabase project
Go to https://supabase.com → New Project. Wait for it to provision.

### 2. Run the SQL schema
- Open **SQL Editor** in your Supabase dashboard.
- Paste the contents of [`supabase/schema.sql`](./supabase/schema.sql) and **Run**.
- This creates the `rooms`, `bookings`, `expenses` tables, indexes, CHECK
  constraints and RLS policies.

### 3. Configure auth
- **Authentication → Providers → Email**: enable email/password.
- (Recommended) **Authentication → Settings**: enable **Leaked password
  protection (HIBP)** for stronger security.
- For local dev you can disable "Confirm email" so signups can sign in
  immediately. In production, leave it enabled.

### 4. Configure environment
```bash
cp .env.example .env.local
```
Fill in from **Supabase → Project Settings → API**:
- `VITE_SUPABASE_URL` — Project URL
- `VITE_SUPABASE_ANON_KEY` — `anon` `public` key (safe to expose in client)

> Never put the `service_role` key in the frontend.

### 5. Install & run
```bash
npm install   # or bun install / pnpm install
npm run dev
```

## Security model

- **RLS on every table.** All `SELECT/INSERT/UPDATE/DELETE` policies enforce
  `user_id = auth.uid()`. There are no admin-bypass policies.
- **Bookings INSERT** also requires the `room_id` to belong to the same user.
- **Server-side CHECK constraints** prevent negative prices/amounts and
  invalid statuses/categories — even if a client is tampered with.
- **Client-side zod validation** for friendly error messages.
- **Protected routes** redirect unauthenticated users to `/login`.
- **No secrets in code.** Only the publishable anon key is shipped, and only
  via env vars.

## Features

- 🏠 **Rooms** — CRUD, per-room nightly price, available/occupied status
- 📅 **Bookings** — assign room, auto-compute `total = nights × price`,
  payment status (paid / partial / unpaid). Unpaid rows are highlighted.
- 💸 **Expenses** — categorised (Rent, Water, Electricity, Maintenance, Other)
- 📊 **Dashboard** — income from paid bookings, expenses, profit/loss,
  filterable Last 7 days / Last 30 days. All scoped per user.

## Extending

The schema and code are modular. To add e.g. subscriptions or analytics:
1. Add the table to `supabase/schema.sql` (with RLS!).
2. Add a typed accessor in `src/lib/supabase.ts`.
3. Add a page under `src/pages/` and a sidebar entry in `AppLayout.tsx`.

## Deployment

GitHub-ready. Connect the repo to Vercel / Netlify / Cloudflare Pages and set
the two `VITE_SUPABASE_*` env vars in the host's dashboard.
