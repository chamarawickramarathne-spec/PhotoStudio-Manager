-- =====================================================================
-- PhotoStudio Manager - Migration 0001 (initial schema)
-- Run this in the Supabase Dashboard -> SQL Editor (or `supabase db push`).
-- Creates: profiles, clients, bookings, payment_schedules,
--          payment_installments + RLS + triggers.
-- =====================================================================

-- ---------- Profiles (extends auth.users) ----------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  phone         text,
  business_name text,
  currency_type text not null default 'LKR',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------- Clients ----------
create table if not exists public.clients (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  full_name      text not null,
  email          text,
  phone          text,
  second_contact text,
  second_phone   text,
  address        text,
  city           text,
  state          text,
  zip_code       text,
  country        text not null default 'Sri Lanka',
  status         text not null default 'active'
                 check (status in ('active','inactive','blacklisted')),
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------- Bookings ----------
create table if not exists public.bookings (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references public.profiles(id) on delete cascade,
  client_id                 uuid not null references public.clients(id) on delete cascade,
  title                     text not null,
  booking_date              date,
  start_time                time,
  end_time                  time,
  location                  text,
  event_type                text not null default 'Other'
                            check (event_type in ('Wedding','Birthday','Anniversary','Corporate','Party','Other')),
  package_name              text,
  shoot_type                text not null default 'Photography'
                            check (shoot_type in ('Photography','Videography','Both')),
  album                     text not null default 'No' check (album in ('Yes','No')),
  status                    text not null default 'pending'
                            check (status in ('pending','confirmed','in_progress','completed','cancelled')),
  total_amount              numeric(12,2),
  deposit_amount            numeric(12,2),
  notes                     text,
  -- Wedding-specific fields
  wedding_hotel_name        text,
  wedding_date              date,
  homecoming_hotel_name     text,
  homecoming_date           date,
  wedding_album             boolean not null default false,
  pre_shoot_album           boolean not null default false,
  family_album              boolean not null default false,
  group_photo_size          text,
  homecoming_photo_size     text,
  wedding_photo_sizes       text[] not null default '{}',
  extra_thank_you_cards_qty integer not null default 0,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- ---------- Payment schedules ----------
create table if not exists public.payment_schedules (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  booking_id    uuid references public.bookings(id) on delete set null,
  name          text,
  schedule_type text not null check (schedule_type in ('deposit','milestone','final','custom')),
  amount        numeric(12,2) not null default 0,
  paid_amount   numeric(12,2) not null default 0,
  due_date      date,
  status        text not null default 'pending'
                check (status in ('pending','paid','overdue','cancelled')),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------- Payment installments ----------
create table if not exists public.payment_installments (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  schedule_id    uuid not null references public.payment_schedules(id) on delete cascade,
  amount         numeric(12,2) not null check (amount > 0),
  paid_date      date not null default now(),
  payment_method text check (payment_method in ('cash','e_transfer_bank','card_pay','other')),
  notes          text,
  created_at     timestamptz not null default now()
);

-- ---------- Indexes ----------
create index if not exists clients_user_id_idx            on public.clients(user_id);
create index if not exists bookings_user_id_idx          on public.bookings(user_id);
create index if not exists bookings_client_id_idx        on public.bookings(client_id);
create index if not exists ps_user_id_idx                on public.payment_schedules(user_id);
create index if not exists ps_booking_id_idx             on public.payment_schedules(booking_id);
create index if not exists pi_schedule_id_idx            on public.payment_installments(schedule_id);

-- ---------- updated_at helper ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

drop trigger if exists ps_set_updated_at on public.payment_schedules;
create trigger ps_set_updated_at
  before update on public.payment_schedules
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------- Auto-create profile on signup ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, currency_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name',
             new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'phone',
    coalesce(new.raw_user_meta_data ->> 'currency_type', 'LKR')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Installments roll up into schedule ----------
create or replace function public.apply_installment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_schedule_id uuid;
  v_delta       numeric(12,2);
  v_schedule    public.payment_schedules%rowtype;
  v_new_paid    numeric(12,2);
begin
  if tg_op = 'DELETE' then
    v_schedule_id := old.schedule_id;
    v_delta       := -old.amount;
  else
    v_schedule_id := new.schedule_id;
    v_delta       := new.amount;
    if tg_op = 'UPDATE' then
      v_delta := new.amount - old.amount;
    end if;
  end if;

  select * into v_schedule from public.payment_schedules where id = v_schedule_id;
  if not found then
    return coalesce(new, old);
  end if;

  v_new_paid := greatest(v_schedule.paid_amount + v_delta, 0);

  update public.payment_schedules
  set paid_amount = v_new_paid,
      status = case
        when v_schedule.status = 'cancelled' then 'cancelled'
        when v_new_paid >= v_schedule.amount then 'paid'
        when v_schedule.due_date is not null and v_schedule.due_date < current_date then 'overdue'
        else 'pending'
      end
  where id = v_schedule_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists payment_installments_apply on public.payment_installments;
create trigger payment_installments_apply
  after insert or update or delete on public.payment_installments
  for each row execute function public.apply_installment();

-- ---------- Row Level Security ----------
alter table public.profiles             enable row level security;
alter table public.clients              enable row level security;
alter table public.bookings             enable row level security;
alter table public.payment_schedules    enable row level security;
alter table public.payment_installments enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "own clients" on public.clients;
create policy "own clients" on public.clients
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own bookings" on public.bookings;
create policy "own bookings" on public.bookings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own payment_schedules" on public.payment_schedules;
create policy "own payment_schedules" on public.payment_schedules
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own payment_installments" on public.payment_installments;
create policy "own payment_installments" on public.payment_installments
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Grants ----------
grant usage on schema public to authenticated;
grant all on public.profiles             to authenticated;
grant all on public.clients              to authenticated;
grant all on public.bookings             to authenticated;
grant all on public.payment_schedules    to authenticated;
grant all on public.payment_installments to authenticated;
