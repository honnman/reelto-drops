-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ─── TABLES ───────────────────────────────────────────────────────────────────

create table public.profiles (
  id              uuid primary key references auth.users on delete cascade,
  role            text not null check (role in ('buyer', 'seller')),
  display_name    text not null,
  whatsapp_number text,
  avatar_url      text,
  created_at      timestamptz not null default now()
);

create table public.drops (
  id           uuid primary key default gen_random_uuid(),
  seller_id    uuid not null references public.profiles on delete cascade,
  title        text not null,
  description  text,
  scheduled_at timestamptz not null,
  started_at   timestamptz,
  ended_at     timestamptz,
  status       text not null default 'scheduled' check (status in ('scheduled', 'live', 'ended')),
  created_at   timestamptz not null default now()
);

create table public.sarees (
  id              uuid primary key default gen_random_uuid(),
  drop_id         uuid not null references public.drops on delete cascade,
  seller_id       uuid not null references public.profiles on delete cascade,
  position        int not null,
  title           text not null,
  description     text,
  starting_price  int not null,  -- paise (₹ × 100)
  reserve_price   int,
  auction_seconds int not null default 120,
  status          text not null default 'pending' check (status in ('pending', 'active', 'sold', 'unsold')),
  active_since    timestamptz,
  winner_id       uuid references public.profiles,
  winning_bid     int,
  created_at      timestamptz not null default now(),
  unique (drop_id, position)
);

create table public.saree_images (
  id           uuid primary key default gen_random_uuid(),
  saree_id     uuid not null references public.sarees on delete cascade,
  storage_path text not null,
  position     int not null default 0
);

create table public.bids (
  id         uuid primary key default gen_random_uuid(),
  saree_id   uuid not null references public.sarees on delete cascade,
  bidder_id  uuid not null references public.profiles on delete cascade,
  amount     int not null,
  created_at timestamptz not null default now()
);

create table public.drop_participants (
  drop_id   uuid not null references public.drops on delete cascade,
  user_id   uuid not null references public.profiles on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (drop_id, user_id)
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────

create index drops_seller_id_idx on public.drops (seller_id);
create index drops_status_idx on public.drops (status);
create index drops_scheduled_at_idx on public.drops (scheduled_at);
create index sarees_drop_id_idx on public.sarees (drop_id);
create index sarees_status_idx on public.sarees (status);
create index bids_saree_id_idx on public.bids (saree_id);
create index bids_bidder_id_idx on public.bids (bidder_id);
create index saree_images_saree_id_idx on public.saree_images (saree_id, position);

-- ─── STORAGE ──────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('saree-images', 'saree-images', true)
on conflict do nothing;

-- ─── RLS ──────────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.drops enable row level security;
alter table public.sarees enable row level security;
alter table public.saree_images enable row level security;
alter table public.bids enable row level security;
alter table public.drop_participants enable row level security;

-- profiles
create policy "profiles: public read"     on public.profiles for select using (true);
create policy "profiles: own insert"      on public.profiles for insert with check (auth.uid() = id);
create policy "profiles: own update"      on public.profiles for update using (auth.uid() = id);

-- drops
create policy "drops: public read"        on public.drops for select using (true);
create policy "drops: seller insert"      on public.drops for insert with check (auth.uid() = seller_id);
create policy "drops: seller update"      on public.drops for update using (auth.uid() = seller_id);

-- sarees
create policy "sarees: public read"       on public.sarees for select using (true);
create policy "sarees: seller insert"     on public.sarees for insert with check (auth.uid() = seller_id);
create policy "sarees: seller update"     on public.sarees for update using (auth.uid() = seller_id);

-- saree_images
create policy "saree_images: public read" on public.saree_images for select using (true);
create policy "saree_images: seller manage" on public.saree_images for all
  using (exists (select 1 from public.sarees s where s.id = saree_id and s.seller_id = auth.uid()));

-- bids: read all, buyers insert only on active sarees
create policy "bids: public read"         on public.bids for select using (true);
create policy "bids: buyer insert"        on public.bids for insert
  with check (
    auth.uid() = bidder_id
    and exists (
      select 1 from public.sarees s
      where s.id = saree_id and s.status = 'active'
    )
  );

-- drop_participants
create policy "drop_participants: public read" on public.drop_participants for select using (true);
create policy "drop_participants: own join"    on public.drop_participants for insert
  with check (auth.uid() = user_id);

-- Storage policies
create policy "saree-images: public read"
  on storage.objects for select using (bucket_id = 'saree-images');

create policy "saree-images: auth upload"
  on storage.objects for insert
  with check (bucket_id = 'saree-images' and auth.role() = 'authenticated');

create policy "saree-images: auth delete"
  on storage.objects for delete
  using (bucket_id = 'saree-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- ─── FUNCTIONS ────────────────────────────────────────────────────────────────

-- Atomic bid placement — validates, inserts, returns result
create or replace function public.place_bid(p_saree_id uuid, p_amount int)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_saree    public.sarees%rowtype;
  v_max_bid  int;
  v_bid_id   uuid;
begin
  -- Lock the saree row
  select * into v_saree from public.sarees where id = p_saree_id for update;

  if not found then
    return json_build_object('ok', false, 'error', 'Saree not found');
  end if;

  if v_saree.status <> 'active' then
    return json_build_object('ok', false, 'error', 'Bidding is closed for this lot');
  end if;

  -- Get current highest bid
  select coalesce(max(amount), v_saree.starting_price - 1)
  into v_max_bid
  from public.bids
  where saree_id = p_saree_id;

  if p_amount <= v_max_bid then
    return json_build_object('ok', false, 'error', 'Bid must exceed current highest bid');
  end if;

  -- Insert bid
  insert into public.bids (saree_id, bidder_id, amount)
  values (p_saree_id, auth.uid(), p_amount)
  returning id into v_bid_id;

  return json_build_object('ok', true, 'bid_id', v_bid_id, 'amount', p_amount);
end;
$$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, display_name)
  values (new.id, 'buyer', coalesce(new.raw_user_meta_data->>'display_name', 'Guest'))
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Advance lot: end current active lot, start next
create or replace function public.advance_lot(p_drop_id uuid, p_outcome text default 'sold')
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_active_saree  public.sarees%rowtype;
  v_next_saree    public.sarees%rowtype;
  v_winner_id     uuid;
  v_winning_bid   int;
begin
  -- Get active lot
  select * into v_active_saree
  from public.sarees
  where drop_id = p_drop_id and status = 'active'
  for update;

  if not found then
    return json_build_object('ok', false, 'error', 'No active lot');
  end if;

  -- Find winner
  select bidder_id, amount into v_winner_id, v_winning_bid
  from public.bids
  where saree_id = v_active_saree.id
  order by amount desc
  limit 1;

  -- Close current lot
  update public.sarees
  set
    status      = case when v_winner_id is not null then 'sold' else 'unsold' end,
    winner_id   = v_winner_id,
    winning_bid = v_winning_bid
  where id = v_active_saree.id;

  -- Activate next lot
  select * into v_next_saree
  from public.sarees
  where drop_id = p_drop_id and status = 'pending'
  order by position
  limit 1
  for update;

  if found then
    update public.sarees
    set status = 'active', active_since = now()
    where id = v_next_saree.id;
  else
    -- All lots done — end the drop
    update public.drops
    set status = 'ended', ended_at = now()
    where id = p_drop_id;
  end if;

  return json_build_object(
    'ok', true,
    'closed_lot_id', v_active_saree.id,
    'next_lot_id', v_next_saree.id,
    'winner_id', v_winner_id,
    'winning_bid', v_winning_bid
  );
end;
$$;
