-- =====================================================================
-- BnB Manager — Supabase schema (PostgreSQL)
-- Copy-paste this into Supabase SQL Editor and run.
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS.
-- =====================================================================

-- Required for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ---------- Tables ----------------------------------------------------

create table if not exists public.rooms (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null check (length(trim(name)) between 1 and 100),
    price_per_night numeric(12,2) not null check (price_per_night > 0),
    status text not null check (status in ('available','occupied')) default 'available',
    created_at timestamptz not null default now()
);

create table if not exists public.bookings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    room_id uuid not null references public.rooms(id) on delete restrict,
    client_name text not null check (length(trim(client_name)) between 1 and 100),
    check_in_date date not null,
    check_out_date date not null,
    total_amount numeric(12,2) not null check (total_amount >= 0),
    payment_status text not null check (payment_status in ('paid','unpaid','partial')) default 'unpaid',
    created_at timestamptz not null default now(),
    constraint bookings_dates_chk check (check_out_date > check_in_date)
);

create table if not exists public.expenses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    amount numeric(12,2) not null check (amount > 0),
    category text not null check (category in ('rent','water','electricity','maintenance','other')),
    description text check (description is null or length(description) <= 500),
    date date not null,
    created_at timestamptz not null default now()
);

-- Indexes
create index if not exists rooms_user_idx     on public.rooms(user_id);
create index if not exists bookings_user_idx  on public.bookings(user_id);
create index if not exists bookings_room_idx  on public.bookings(room_id);
create index if not exists bookings_date_idx  on public.bookings(check_in_date);
create index if not exists expenses_user_idx  on public.expenses(user_id);
create index if not exists expenses_date_idx  on public.expenses(date);

-- ---------- Row-Level Security ---------------------------------------

alter table public.rooms    enable row level security;
alter table public.bookings enable row level security;
alter table public.expenses enable row level security;

-- ROOMS policies
drop policy if exists "rooms_select_own" on public.rooms;
drop policy if exists "rooms_insert_own" on public.rooms;
drop policy if exists "rooms_update_own" on public.rooms;
drop policy if exists "rooms_delete_own" on public.rooms;

create policy "rooms_select_own" on public.rooms
    for select to authenticated using (user_id = auth.uid());
create policy "rooms_insert_own" on public.rooms
    for insert to authenticated with check (user_id = auth.uid());
create policy "rooms_update_own" on public.rooms
    for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "rooms_delete_own" on public.rooms
    for delete to authenticated using (user_id = auth.uid());

-- BOOKINGS policies
drop policy if exists "bookings_select_own" on public.bookings;
drop policy if exists "bookings_insert_own" on public.bookings;
drop policy if exists "bookings_update_own" on public.bookings;
drop policy if exists "bookings_delete_own" on public.bookings;

create policy "bookings_select_own" on public.bookings
    for select to authenticated using (user_id = auth.uid());
create policy "bookings_insert_own" on public.bookings
    for insert to authenticated with check (
        user_id = auth.uid()
        and exists (select 1 from public.rooms r where r.id = room_id and r.user_id = auth.uid())
    );
create policy "bookings_update_own" on public.bookings
    for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "bookings_delete_own" on public.bookings
    for delete to authenticated using (user_id = auth.uid());

-- EXPENSES policies
drop policy if exists "expenses_select_own" on public.expenses;
drop policy if exists "expenses_insert_own" on public.expenses;
drop policy if exists "expenses_update_own" on public.expenses;
drop policy if exists "expenses_delete_own" on public.expenses;

create policy "expenses_select_own" on public.expenses
    for select to authenticated using (user_id = auth.uid());
create policy "expenses_insert_own" on public.expenses
    for insert to authenticated with check (user_id = auth.uid());
create policy "expenses_update_own" on public.expenses
    for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "expenses_delete_own" on public.expenses
    for delete to authenticated using (user_id = auth.uid());
