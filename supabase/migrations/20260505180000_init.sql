-- Stayly UAE — initial schema. Maps the localStorage Store onto Postgres + RLS.
-- Tables: profiles (extends auth.users), listings, bookings, tickets.

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  email text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
-- Reads name and role from raw_user_meta_data (set by signup form).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    case
      when new.raw_user_meta_data->>'role' = 'admin' then 'admin'
      else 'user'
    end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: is the calling user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- listings ----------
create table if not exists public.listings (
  id text primary key,
  title text not null,
  type text,
  location text,
  country text,
  price_per_night numeric not null,
  rating numeric default 0,
  reviews integer default 0,
  superhost boolean default false,
  beds integer default 1,
  baths integer default 1,
  guests integer default 2,
  host jsonb,
  amenities jsonb,
  images jsonb,
  description text,
  active boolean default true,
  owner_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- ---------- bookings ----------
create table if not exists public.bookings (
  id text primary key,
  user_id uuid not null references auth.users on delete cascade,
  listing_id text references public.listings(id) on delete set null,
  check_in timestamptz not null,
  check_out timestamptz not null,
  guests integer,
  adults integer default 1,
  children integer default 0,
  total numeric not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  payment jsonb,
  cancellation_fee numeric,
  refunded numeric,
  cancelled_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists bookings_user_id_idx on public.bookings(user_id);
create index if not exists bookings_listing_id_idx on public.bookings(listing_id);

-- ---------- tickets ----------
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  user_id uuid references auth.users on delete set null,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.bookings enable row level security;
alter table public.tickets  enable row level security;

-- profiles: select own + admin reads all; users update own non-role fields; admin updates all.
drop policy if exists "Profiles: read self or admin" on public.profiles;
create policy "Profiles: read self or admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "Profiles: update self" on public.profiles;
create policy "Profiles: update self" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Profiles: admin manages all" on public.profiles;
create policy "Profiles: admin manages all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- listings: anyone authenticated reads active; admin manages all.
drop policy if exists "Listings: anyone reads active" on public.listings;
create policy "Listings: anyone reads active" on public.listings
  for select using (active or public.is_admin());

drop policy if exists "Listings: admin manages all" on public.listings;
create policy "Listings: admin manages all" on public.listings
  for all using (public.is_admin()) with check (public.is_admin());

-- bookings: user reads/writes own; admin reads/writes all.
drop policy if exists "Bookings: user reads own" on public.bookings;
create policy "Bookings: user reads own" on public.bookings
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Bookings: user inserts own" on public.bookings;
create policy "Bookings: user inserts own" on public.bookings
  for insert with check (auth.uid() = user_id);

drop policy if exists "Bookings: user cancels own" on public.bookings;
create policy "Bookings: user cancels own" on public.bookings
  for update using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Bookings: admin deletes" on public.bookings;
create policy "Bookings: admin deletes" on public.bookings
  for delete using (public.is_admin());

-- tickets: any authenticated user can submit; admin reads/manages all.
drop policy if exists "Tickets: insert by anyone signed in" on public.tickets;
create policy "Tickets: insert by anyone signed in" on public.tickets
  for insert with check (auth.uid() is not null);

drop policy if exists "Tickets: admin reads all" on public.tickets;
create policy "Tickets: admin reads all" on public.tickets
  for select using (public.is_admin() or auth.uid() = user_id);

drop policy if exists "Tickets: admin updates" on public.tickets;
create policy "Tickets: admin updates" on public.tickets
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Tickets: admin deletes" on public.tickets;
create policy "Tickets: admin deletes" on public.tickets
  for delete using (public.is_admin());

-- ---------- seed: 12 UAE listings ----------
insert into public.listings (id, title, type, location, country, price_per_night, rating, reviews, superhost, beds, baths, guests, host, amenities, images, description) values
('l1','Burj Khalifa Sky Suite — 108th Floor','Penthouse','Downtown Dubai','United Arab Emirates',4500,4.97,312,true,2,2,4,
 '{"name":"Khalid","years":6,"avatar":"https://i.pravatar.cc/120?img=12"}'::jsonb,
 '["Wi-Fi","Skyline view","Infinity pool access","Concierge","Air conditioning","Gym","Smart home","Valet parking"]'::jsonb,
 '["https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80","https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80","https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80","https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=1200&q=80","https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=1200&q=80"]'::jsonb,
 'A two-bedroom suite on the 108th floor of the Burj Khalifa with floor-to-ceiling glass on three sides. Watch the Dubai Fountain from your sofa, then ride a private lift to the rooftop pool deck.'),
('l2','Palm Jumeirah Beachfront Villa with Private Pool','Entire villa','Palm Jumeirah, Dubai','United Arab Emirates',8200,4.95,184,true,5,5,10,
 '{"name":"Mariam","years":9,"avatar":"https://i.pravatar.cc/120?img=44"}'::jsonb,
 '["Wi-Fi","Private beach","Pool","Kitchen","BBQ","Air conditioning","Hot tub","Free parking","Gym"]'::jsonb,
 '["https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80","https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80","https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80","https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80"]'::jsonb,
 'Five-bedroom contemporary villa on the outer crescent of Palm Jumeirah. Step from your infinity pool onto a 30-metre stretch of private sand with the Atlantis lit up across the bay every night.'),
('l3','Desert Safari Tent with Stargazing Deck','Luxury tent','Al Marmoom Reserve','United Arab Emirates',1800,4.92,246,true,1,1,2,
 '{"name":"Salem","years":4,"avatar":"https://i.pravatar.cc/120?img=8"}'::jsonb,
 '["Wi-Fi","Outdoor shower","Stargazing deck","Camel rides","Bedouin breakfast","Air conditioning","Fire pit"]'::jsonb,
 '["https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=1200&q=80","https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=1200&q=80","https://images.unsplash.com/photo-1520984032042-162d526883e0?w=1200&q=80","https://images.unsplash.com/photo-1595274459742-4a41d35784ee?w=1200&q=80"]'::jsonb,
 'A canvas-and-cedar suite in the heart of the Al Marmoom conservation reserve. Wake to oryx grazing past the deck; nights are silent except for the wind, with the Milky Way stretching from dune to dune.'),
('l4','Abu Dhabi Corniche Penthouse','Penthouse','Corniche, Abu Dhabi','United Arab Emirates',3400,4.91,158,false,3,3,6,
 '{"name":"Reem","years":5,"avatar":"https://i.pravatar.cc/120?img=29"}'::jsonb,
 '["Wi-Fi","Sea view","Pool","Kitchen","Air conditioning","Workspace","Gym","Elevator"]'::jsonb,
 '["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80","https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=1200&q=80","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80","https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80","https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80"]'::jsonb,
 'Floor-through penthouse facing the Corniche promenade and the Arabian Gulf. Walk to Sheikh Zayed Grand Mosque in fifteen minutes; the souk and Heritage Village are even closer.'),
('l5','Hatta Mountain Eco Lodge','Eco lodge','Hatta, Dubai','United Arab Emirates',1250,4.88,201,true,2,1,4,
 '{"name":"Ahmad","years":7,"avatar":"https://i.pravatar.cc/120?img=33"}'::jsonb,
 '["Wi-Fi","Mountain view","Fire pit","Kitchenette","Heating","Free parking","Hiking trails","Kayak access"]'::jsonb,
 '["https://images.unsplash.com/photo-1502784444187-359ac186c5bb?w=1200&q=80","https://images.unsplash.com/photo-1551524559-8af4e6624178?w=1200&q=80","https://images.unsplash.com/photo-1518733057094-95b53143d2a7?w=1200&q=80","https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=1200&q=80"]'::jsonb,
 'Stone-built lodge tucked into the Hajar Mountains, ten minutes drive from Hatta Dam. Pack the kayak in the morning, hike the Wadi Hub trail at sunset, and grill under the stars.'),
('l6','Al Fahidi Heritage Riad','Heritage home','Al Fahidi Historical District, Dubai','United Arab Emirates',950,4.94,387,true,3,3,6,
 '{"name":"Yasmin","years":11,"avatar":"https://i.pravatar.cc/120?img=32"}'::jsonb,
 '["Wi-Fi","Courtyard","Wind tower","Breakfast included","Air conditioning","Bicycles","Souk access"]'::jsonb,
 '["https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&q=80","https://images.unsplash.com/photo-1539020140153-e479b8c5c1f9?w=1200&q=80","https://images.unsplash.com/photo-1597211684565-dca64d72bdfe?w=1200&q=80","https://images.unsplash.com/photo-1503328427499-d92d1ac3d174?w=1200&q=80"]'::jsonb,
 'A restored 1890s coral-stone home with a traditional barjeel wind tower and a tiled courtyard fountain. Step out the door into the Al Fahidi alleys, the Textile Souk, and the Dubai Creek abra dock.'),
('l7','Saadiyat Beach Villa with Pool','Beachfront villa','Saadiyat Island, Abu Dhabi','United Arab Emirates',5600,4.96,142,true,4,4,8,
 '{"name":"Layla","years":8,"avatar":"https://i.pravatar.cc/120?img=49"}'::jsonb,
 '["Wi-Fi","Private beach","Pool","Chef on request","Kitchen","Air conditioning","Beach equipment","Free parking"]'::jsonb,
 '["https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80","https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80","https://images.unsplash.com/photo-1583878457092-0ad13fb8b777?w=1200&q=80","https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&q=80"]'::jsonb,
 'A whitewashed contemporary villa on the protected stretch of Saadiyat Beach where hawksbill turtles still nest. Ten minutes from the Louvre Abu Dhabi and Manarat Al Saadiyat.'),
('l8','Jebel Jais Cliff House','Cliffside home','Jebel Jais, Ras Al Khaimah','United Arab Emirates',2400,4.93,96,false,3,2,6,
 '{"name":"Omar","years":3,"avatar":"https://i.pravatar.cc/120?img=11"}'::jsonb,
 '["Wi-Fi","Mountain view","Hot tub","Fireplace","Kitchen","Heating","Stargazing deck","Hiking access"]'::jsonb,
 '["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80","https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80","https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80","https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80"]'::jsonb,
 'Cantilevered concrete-and-glass perch on the highest peak in the UAE. The temperature drops 10C from the coast, and the worlds longest zipline launches a five-minute drive away.'),
('l9','Yas Marina F1-View Loft','Loft','Yas Island, Abu Dhabi','United Arab Emirates',2100,4.87,211,false,2,2,4,
 '{"name":"Sara","years":4,"avatar":"https://i.pravatar.cc/120?img=20"}'::jsonb,
 '["Wi-Fi","Marina view","Pool","Kitchen","Air conditioning","Workspace","Elevator","Gym"]'::jsonb,
 '["https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80","https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=1200&q=80","https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=1200&q=80","https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80"]'::jsonb,
 'Open-plan loft above Yas Marina with a balcony directly over the F1 circuits hairpin. Walk to Ferrari World, Yas Waterworld, and Warner Bros World in under fifteen minutes.'),
('l10','Fujairah Coral Coast Bungalow','Beach bungalow','Al Aqah, Fujairah','United Arab Emirates',1650,4.89,173,true,2,2,4,
 '{"name":"Tariq","years":6,"avatar":"https://i.pravatar.cc/120?img=15"}'::jsonb,
 '["Wi-Fi","Private beach","Snorkel gear","Kitchen","Air conditioning","Hammock","Free parking"]'::jsonb,
 '["https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80","https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80","https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80","https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&q=80"]'::jsonb,
 'A timber bungalow on Al Aqahs coral coast, looking across the Gulf of Oman at Snoopy Island. Best snorkelling in the Emirates is a fifteen-metre swim from the deck.'),
('l11','The World Islands Private Estate','Private estate','The World, Dubai','United Arab Emirates',12000,4.99,47,true,6,7,12,
 '{"name":"Hessa","years":5,"avatar":"https://i.pravatar.cc/120?img=45"}'::jsonb,
 '["Wi-Fi","Private beach","Multiple pools","Speedboat transfer","Chef","Butler","Spa","Gym","Helipad"]'::jsonb,
 '["https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80","https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80","https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80","https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80"]'::jsonb,
 'Your own island in the Dubai archipelago, reached by a fifteen-minute speedboat ride from Marina. Six suites, a saltwater pool, full staff, and the entire skyline as your backdrop.'),
('l12','Sharjah Heart of Sharjah Studio','Heritage studio','Heart of Sharjah, Sharjah','United Arab Emirates',680,4.86,422,true,1,1,2,
 '{"name":"Noura","years":10,"avatar":"https://i.pravatar.cc/120?img=47"}'::jsonb,
 '["Wi-Fi","Courtyard","Kitchenette","Air conditioning","Workspace","Souk access","Bicycles"]'::jsonb,
 '["https://images.unsplash.com/photo-1539020140153-e479b8c5c1f9?w=1200&q=80","https://images.unsplash.com/photo-1597211684565-dca64d72bdfe?w=1200&q=80","https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&q=80","https://images.unsplash.com/photo-1503328427499-d92d1ac3d174?w=1200&q=80"]'::jsonb,
 'A loft above a calligraphy studio in the Heart of Sharjah heritage district. Steps from the Blue Souk, the Calligraphy Museum, and the Arts Areas monthly biennale exhibitions.')
on conflict (id) do nothing;
