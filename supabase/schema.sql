-- ============================================================
-- BnB Manager — Supabase schema (multi-tenant, RLS enforced)
-- Paste this entire file into Supabase SQL Editor and Run.
-- ============================================================

-- Helpful note: Disable email confirmation under
-- Authentication → Providers → Email → "Confirm email" = OFF.
-- Username + password is implemented in the frontend by mapping
-- the username to a synthetic email: <username>@bnb.local

-- ---------- ROOMS ----------
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  price_per_night numeric(10,2) not null check (price_per_night >= 0),
  status text not null default 'available' check (status in ('available','occupied','maintenance')),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists rooms_user_id_idx on public.rooms(user_id);

-- ---------- BOOKINGS ----------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  guest_name text not null,
  check_in date not null,
  check_out date not null,
  total_amount numeric(10,2) not null default 0 check (total_amount >= 0),
  payment_status text not null default 'unpaid' check (payment_status in ('paid','partial','unpaid')),
  created_at timestamptz not null default now(),
  check (check_out >= check_in)
);
create index if not exists bookings_user_id_idx on public.bookings(user_id);

-- ---------- EXPENSES ----------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('Rent','Water','Electricity','Maintenance','Supplies','Other')),
  amount numeric(10,2) not null check (amount >= 0),
  description text,
  expense_date date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists expenses_user_id_idx on public.expenses(user_id);

-- ---------- INCOME ----------
create table if not exists public.income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  amount numeric(10,2) not null check (amount >= 0),
  description text,
  income_date date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists income_user_id_idx on public.income(user_id);

-- ============================================================
-- ENABLE RLS
-- ============================================================
alter table public.rooms    enable row level security;
alter table public.bookings enable row level security;
alter table public.expenses enable row level security;
alter table public.income   enable row level security;

-- ============================================================
-- RLS POLICIES — auth.uid() = user_id on every operation
-- ============================================================

-- ROOMS
drop policy if exists "rooms_select_own" on public.rooms;
drop policy if exists "rooms_insert_own" on public.rooms;
drop policy if exists "rooms_update_own" on public.rooms;
drop policy if exists "rooms_delete_own" on public.rooms;
create policy "rooms_select_own" on public.rooms for select using (auth.uid() = user_id);
create policy "rooms_insert_own" on public.rooms for insert with check (auth.uid() = user_id);
create policy "rooms_update_own" on public.rooms for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "rooms_delete_own" on public.rooms for delete using (auth.uid() = user_id);

-- BOOKINGS
drop policy if exists "bookings_select_own" on public.bookings;
drop policy if exists "bookings_insert_own" on public.bookings;
drop policy if exists "bookings_update_own" on public.bookings;
drop policy if exists "bookings_delete_own" on public.bookings;
create policy "bookings_select_own" on public.bookings for select using (auth.uid() = user_id);
create policy "bookings_insert_own" on public.bookings for insert with check (auth.uid() = user_id);
create policy "bookings_update_own" on public.bookings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "bookings_delete_own" on public.bookings for delete using (auth.uid() = user_id);

-- EXPENSES
drop policy if exists "expenses_select_own" on public.expenses;
drop policy if exists "expenses_insert_own" on public.expenses;
drop policy if exists "expenses_update_own" on public.expenses;
drop policy if exists "expenses_delete_own" on public.expenses;
create policy "expenses_select_own" on public.expenses for select using (auth.uid() = user_id);
create policy "expenses_insert_own" on public.expenses for insert with check (auth.uid() = user_id);
create policy "expenses_update_own" on public.expenses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "expenses_delete_own" on public.expenses for delete using (auth.uid() = user_id);

-- INCOME
drop policy if exists "income_select_own" on public.income;
drop policy if exists "income_insert_own" on public.income;
drop policy if exists "income_update_own" on public.income;
drop policy if exists "income_delete_own" on public.income;
create policy "income_select_own" on public.income for select using (auth.uid() = user_id);
create policy "income_insert_own" on public.income for insert with check (auth.uid() = user_id);
create policy "income_update_own" on public.income for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "income_delete_own" on public.income for delete using (auth.uid() = user_id);
