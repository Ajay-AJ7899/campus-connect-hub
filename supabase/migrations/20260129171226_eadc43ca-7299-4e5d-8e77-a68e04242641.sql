-- Group Orders MVP

-- 1) Tables
create table if not exists public.group_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  creator_profile_id uuid not null references public.profiles(id) on delete cascade,
  campus_id uuid not null references public.campuses(id) on delete restrict,
  title text not null,
  description text not null,
  deadline_at timestamptz null,
  status text not null default 'active'
);

create index if not exists idx_group_orders_status on public.group_orders(status);
create index if not exists idx_group_orders_deadline on public.group_orders(deadline_at);
create index if not exists idx_group_orders_campus on public.group_orders(campus_id);

create table if not exists public.group_order_participants (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  order_id uuid not null references public.group_orders(id) on delete cascade,
  participant_profile_id uuid not null references public.profiles(id) on delete cascade,
  quantity integer not null default 1,
  note text null,
  unique(order_id, participant_profile_id)
);

create index if not exists idx_group_order_participants_order on public.group_order_participants(order_id);

-- 2) RLS
alter table public.group_orders enable row level security;
alter table public.group_order_participants enable row level security;

-- Anyone authenticated can view group orders for their campus.
create policy "Group orders viewable by campus"
on public.group_orders
for select
using (
  auth.uid() is not null
  and campus_id = public.current_user_campus_id()
);

-- Creator can create orders for their own campus.
create policy "Users can create group orders for own campus"
on public.group_orders
for insert
with check (
  auth.uid() is not null
  and campus_id = public.current_user_campus_id()
  and creator_profile_id in (
    select p.id from public.profiles p where p.user_id = auth.uid()
  )
);

-- Creator can update/delete their orders.
create policy "Creators can update their group orders"
on public.group_orders
for update
using (
  creator_profile_id in (select p.id from public.profiles p where p.user_id = auth.uid())
)
with check (
  creator_profile_id in (select p.id from public.profiles p where p.user_id = auth.uid())
);

create policy "Creators can delete their group orders"
on public.group_orders
for delete
using (
  creator_profile_id in (select p.id from public.profiles p where p.user_id = auth.uid())
);

-- Participants: read participants for orders they can see.
create policy "Participants viewable for campus orders"
on public.group_order_participants
for select
using (
  exists (
    select 1 from public.group_orders o
    where o.id = group_order_participants.order_id
      and o.campus_id = public.current_user_campus_id()
  )
);

-- Users can join an order as themselves.
create policy "Users can join group orders"
on public.group_order_participants
for insert
with check (
  participant_profile_id in (select p.id from public.profiles p where p.user_id = auth.uid())
  and exists (
    select 1 from public.group_orders o
    where o.id = group_order_participants.order_id
      and o.status = 'active'
      and o.campus_id = public.current_user_campus_id()
  )
);

-- Users can update their own participation (quantity/note).
create policy "Users can update their participation"
on public.group_order_participants
for update
using (
  participant_profile_id in (select p.id from public.profiles p where p.user_id = auth.uid())
)
with check (
  participant_profile_id in (select p.id from public.profiles p where p.user_id = auth.uid())
);

-- Users can leave (delete) their participation.
create policy "Users can delete their participation"
on public.group_order_participants
for delete
using (
  participant_profile_id in (select p.id from public.profiles p where p.user_id = auth.uid())
);

-- 3) updated_at trigger
-- Reuse existing function public.update_updated_at_column()
create trigger update_group_orders_updated_at
before update on public.group_orders
for each row execute function public.update_updated_at_column();
