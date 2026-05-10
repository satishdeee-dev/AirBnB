-- Shopping cart for in-progress reservations.
-- A row is created when a guest hits "Add to cart" after picking dates/meals;
-- the row is moved to status='paid' (and a corresponding bookings row created)
-- when MyFatoorah confirms the payment via the callback.

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  listing_id text references public.listings(id) on delete cascade,
  check_in timestamptz not null,
  check_out timestamptz not null,
  guests integer,
  adults integer default 1,
  children integer default 0,
  meals jsonb,
  total numeric not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  invoice_id text,
  payment_id text,
  paid_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists cart_items_user_idx on public.cart_items(user_id);
create index if not exists cart_items_status_idx on public.cart_items(status);

alter table public.cart_items enable row level security;

drop policy if exists "Cart: owner reads own" on public.cart_items;
create policy "Cart: owner reads own" on public.cart_items
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Cart: owner inserts own" on public.cart_items;
create policy "Cart: owner inserts own" on public.cart_items
  for insert with check (auth.uid() = user_id);

drop policy if exists "Cart: owner updates own" on public.cart_items;
create policy "Cart: owner updates own" on public.cart_items
  for update using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Cart: owner deletes own" on public.cart_items;
create policy "Cart: owner deletes own" on public.cart_items
  for delete using (auth.uid() = user_id or public.is_admin());
