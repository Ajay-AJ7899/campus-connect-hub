-- Errands MVP: tables + RLS + storage bucket for photos (max 2 enforced in app)

-- 1) Storage bucket
insert into storage.buckets (id, name, public)
values ('errand-photos', 'errand-photos', false)
on conflict (id) do nothing;

-- 2) Tables
create table if not exists public.errands (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  requester_profile_id uuid not null references public.profiles(id) on delete restrict,
  campus_id uuid null references public.campuses(id) on delete set null,

  title text not null,
  description text not null,

  status text not null default 'active',
  expires_at timestamptz not null default (now() + interval '2 days')
);

create index if not exists errands_expires_at_idx on public.errands (expires_at);
create index if not exists errands_status_idx on public.errands (status);
create index if not exists errands_requester_profile_id_idx on public.errands (requester_profile_id);
create index if not exists errands_created_at_idx on public.errands (created_at desc);

create table if not exists public.errand_photos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  errand_id uuid not null references public.errands(id) on delete cascade,
  path text not null,
  sort_order smallint not null default 0
);

create unique index if not exists errand_photos_errand_sort_order_unique
  on public.errand_photos (errand_id, sort_order);

create unique index if not exists errand_photos_path_unique
  on public.errand_photos (path);

-- 3) Timestamp trigger
-- (uses existing public.update_updated_at_column())
drop trigger if exists update_errands_updated_at on public.errands;
create trigger update_errands_updated_at
before update on public.errands
for each row execute function public.update_updated_at_column();

-- 4) Enable RLS
alter table public.errands enable row level security;
alter table public.errand_photos enable row level security;

-- 5) RLS policies (Errands)
drop policy if exists "Errands are viewable by authenticated users" on public.errands;
create policy "Errands are viewable by authenticated users"
on public.errands
for select
to authenticated
using (true);

drop policy if exists "Users can create their own errands" on public.errands;
create policy "Users can create their own errands"
on public.errands
for insert
to authenticated
with check (
  requester_profile_id in (
    select p.id from public.profiles p where p.user_id = auth.uid()
  )
);

drop policy if exists "Users can update their own errands" on public.errands;
create policy "Users can update their own errands"
on public.errands
for update
to authenticated
using (
  requester_profile_id in (
    select p.id from public.profiles p where p.user_id = auth.uid()
  )
)
with check (
  requester_profile_id in (
    select p.id from public.profiles p where p.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete their own errands" on public.errands;
create policy "Users can delete their own errands"
on public.errands
for delete
to authenticated
using (
  requester_profile_id in (
    select p.id from public.profiles p where p.user_id = auth.uid()
  )
);

-- 6) RLS policies (Errand photos)
drop policy if exists "Errand photos are viewable by authenticated users" on public.errand_photos;
create policy "Errand photos are viewable by authenticated users"
on public.errand_photos
for select
to authenticated
using (true);

drop policy if exists "Users can add photos to their errands" on public.errand_photos;
create policy "Users can add photos to their errands"
on public.errand_photos
for insert
to authenticated
with check (
  exists (
    select 1
    from public.errands e
    where e.id = errand_id
      and e.requester_profile_id in (
        select p.id from public.profiles p where p.user_id = auth.uid()
      )
  )
);

drop policy if exists "Users can delete photos from their errands" on public.errand_photos;
create policy "Users can delete photos from their errands"
on public.errand_photos
for delete
to authenticated
using (
  exists (
    select 1
    from public.errands e
    where e.id = errand_id
      and e.requester_profile_id in (
        select p.id from public.profiles p where p.user_id = auth.uid()
      )
  )
);

-- 7) Storage object policies for errand-photos
-- We will store objects as: <errand_id>/<filename>

-- SELECT: allow authenticated users to read photos that are linked to an errand.
drop policy if exists "Errand photos readable (linked)" on storage.objects;
create policy "Errand photos readable (linked)"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'errand-photos'
  and exists (
    select 1
    from public.errand_photos ep
    where ep.path = storage.objects.name
  )
);

-- INSERT: only allow uploading into a folder named with an errand_id that the user owns.
drop policy if exists "Errand photos upload (owner)" on storage.objects;
create policy "Errand photos upload (owner)"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'errand-photos'
  and exists (
    select 1
    from public.errands e
    where e.id::text = (storage.foldername(storage.objects.name))[1]
      and e.requester_profile_id in (
        select p.id from public.profiles p where p.user_id = auth.uid()
      )
  )
);

-- UPDATE: only owner can modify objects.
drop policy if exists "Errand photos update (owner)" on storage.objects;
create policy "Errand photos update (owner)"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'errand-photos'
  and exists (
    select 1
    from public.errands e
    where e.id::text = (storage.foldername(storage.objects.name))[1]
      and e.requester_profile_id in (
        select p.id from public.profiles p where p.user_id = auth.uid()
      )
  )
)
with check (
  bucket_id = 'errand-photos'
  and exists (
    select 1
    from public.errands e
    where e.id::text = (storage.foldername(storage.objects.name))[1]
      and e.requester_profile_id in (
        select p.id from public.profiles p where p.user_id = auth.uid()
      )
  )
);

-- DELETE: only owner can delete objects.
drop policy if exists "Errand photos delete (owner)" on storage.objects;
create policy "Errand photos delete (owner)"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'errand-photos'
  and exists (
    select 1
    from public.errands e
    where e.id::text = (storage.foldername(storage.objects.name))[1]
      and e.requester_profile_id in (
        select p.id from public.profiles p where p.user_id = auth.uid()
      )
  )
);
