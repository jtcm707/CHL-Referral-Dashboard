-- ===========================================================================
-- Christian Hearing & Tinnitus — Admin Dashboard migration
-- ---------------------------------------------------------------------------
-- Run this ONCE in the SAME Supabase project the landing page uses:
--   Supabase dashboard -> SQL Editor -> New query -> paste all -> Run
--
-- It is safe to run more than once (everything is "if not exists" / "or replace").
--
-- What it does:
--   1. Adds the columns the dashboard needs (referral_code, status, notes,
--      sale_verified) to the existing public.referrals table.
--   2. Adds a trigger so every NEW referral automatically gets a permanent
--      Referral ID like  CHT-20260704-A8F3K  (date + 5 random characters).
--   3. Backfills a code for any rows that predate this migration.
--   4. Opens SELECT + UPDATE access so the dashboard can read and edit rows.
--
-- Column names match the objects used by db.js, so no field mapping is needed.
-- ===========================================================================


-- 1. New columns ------------------------------------------------------------
alter table public.referrals
  add column if not exists referral_code text,
  add column if not exists status text not null default 'New'
    check (status in ('New','Contacted','Appointment Booked',
                      'Sale Completed','Invalid','Closed')),
  add column if not exists notes text,
  add column if not exists sale_verified boolean not null default false;

-- Each Referral ID must be unique (nulls allowed until backfilled below).
create unique index if not exists referrals_referral_code_key
  on public.referrals (referral_code);


-- 2. Referral ID generator + insert trigger ---------------------------------
-- 5-character suffix from an unambiguous alphabet (no 0/O/1/I/L).
create or replace function public.gen_referral_suffix(len int default 5)
returns text language sql volatile as $$
  select string_agg(
    substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789',
           1 + floor(random() * 31)::int, 1), '')
  from generate_series(1, len);
$$;

-- Assigns referral_code on insert if one wasn't supplied. Retries on the
-- (very unlikely) chance of a collision so codes stay unique.
create or replace function public.set_referral_code()
returns trigger language plpgsql as $$
declare
  base      text;
  candidate text;
begin
  if new.referral_code is null or new.referral_code = '' then
    base := 'CHT-' || to_char(coalesce(new.created_at, now()), 'YYYYMMDD') || '-';
    loop
      candidate := base || public.gen_referral_suffix(5);
      exit when not exists (
        select 1 from public.referrals where referral_code = candidate
      );
    end loop;
    new.referral_code := candidate;
  end if;
  return new;
end $$;

drop trigger if exists trg_set_referral_code on public.referrals;
create trigger trg_set_referral_code
  before insert on public.referrals
  for each row execute function public.set_referral_code();


-- 3. Backfill codes for existing rows ---------------------------------------
-- Gives any pre-existing referral a permanent code based on its created_at.
do $$
declare
  r         record;
  base      text;
  candidate text;
begin
  for r in select id, created_at from public.referrals
           where referral_code is null or referral_code = '' loop
    base := 'CHT-' || to_char(coalesce(r.created_at, now()), 'YYYYMMDD') || '-';
    loop
      candidate := base || public.gen_referral_suffix(5);
      exit when not exists (
        select 1 from public.referrals where referral_code = candidate
      );
    end loop;
    update public.referrals set referral_code = candidate where id = r.id;
  end loop;
end $$;


-- 4. Row Level Security policies --------------------------------------------
-- RLS is already enabled by the landing-page schema. The landing page keeps
-- its INSERT policy. Here we ADD read + update access for the dashboard.
--
-- ⚠️  SECURITY NOTE — READ THIS
-- These policies grant the "anon" (publishable-key) role permission to READ
-- and UPDATE every referral. Because the publishable key is visible in the
-- dashboard's front-end code, anyone who finds the dashboard URL could read
-- your referrals. That is acceptable for a private, unlisted internal tool,
-- but it is NOT true security.
--
-- When you add Supabase Authentication (recommended, see README), come back
-- and change  `to anon, authenticated`  to  `to authenticated`  in the two
-- policies below, then re-run this file. Only logged-in staff will have
-- access after that — no other code change is required.

drop policy if exists "Dashboard can read referrals" on public.referrals;
create policy "Dashboard can read referrals"
  on public.referrals
  for select
  to anon, authenticated          -- change to: to authenticated (after adding auth)
  using (true);

drop policy if exists "Dashboard can update referrals" on public.referrals;
create policy "Dashboard can update referrals"
  on public.referrals
  for update
  to anon, authenticated          -- change to: to authenticated (after adding auth)
  using (true)
  with check (true);

-- No DELETE policy is defined on purpose: the dashboard never deletes rows.
-- Manage deletions from the Supabase Table editor if ever needed.
  window.CHT_CONFIG = {
    
  SUPABASE_URL: 'https://eeejjoxwheydrrwdasph.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_lYqknXA6GFgMEZWRGEinkA_SEI1norq',
};
