-- ─────────────────────────────────────────────────────
-- Run this in your Supabase project → SQL Editor
-- ─────────────────────────────────────────────────────

-- 1. Blessings table
create table if not exists blessings (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  relationship text,
  blessing     text not null,
  photo_url    text,
  created_at   timestamptz default now()
);

-- 2. Allow anyone to read blessings (public book)
alter table blessings enable row level security;

create policy "Anyone can read blessings"
  on blessings for select
  using (true);

create policy "Anyone can insert a blessing"
  on blessings for insert
  with check (true);

-- 3. Storage bucket for photos (run separately in Storage tab or SQL)
-- Go to Storage → New bucket → name it "photos" → set to Public
-- Then run:
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "Anyone can upload photos"
  on storage.objects for insert
  with check (bucket_id = 'photos');

create policy "Anyone can view photos"
  on storage.objects for select
  using (bucket_id = 'photos');
