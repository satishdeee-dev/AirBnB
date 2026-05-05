-- Store meal add-on selection on each booking.
-- Shape: { breakfast: { enabled: bool, items: [str] }, lunch: ..., dinner: ... }
alter table public.bookings
  add column if not exists meals jsonb;
