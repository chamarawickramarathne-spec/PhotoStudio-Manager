-- =====================================================================
-- PhotoStudio Manager - Migration 0004 (photographer details + avatar)
-- Run this in the Supabase Dashboard -> SQL Editor (or `supabase db push`).
-- Adds: photographer profile columns + an ENCRYPTED avatar stored in-DB.
--
-- The avatar is NOT stored in a public Storage bucket. It lives in
-- profiles.avatar_data as base64 of an AES-256-GCM payload
-- (iv[12] + authTag[16] + ciphertext) encrypted client-side with
-- EXPO_PUBLIC_AVATAR_KEY. RLS (id = auth.uid()) is the access gate;
-- encryption protects the row against DB dumps / at-rest leakage.
-- =====================================================================

-- ---------- Photographer profile fields ----------
alter table public.profiles add column if not exists avatar_data     text;
alter table public.profiles add column if not exists avatar_mime     text;
alter table public.profiles add column if not exists business_email  text;
alter table public.profiles add column if not exists business_phone  text;
alter table public.profiles add column if not exists business_address text;
alter table public.profiles add column if not exists bio             text;
alter table public.profiles add column if not exists website         text;
alter table public.profiles add column if not exists portfolio_url   text;

-- ---------- Cleanup: drop the legacy public bucket approach ----------
-- The previous draft (never applied) used a public `profile-media`
-- bucket + `avatar_url`. Both are unused; drop the column if present.
alter table public.profiles drop column if exists avatar_url;

drop policy if exists "public read profile-media" on storage.objects;
drop policy if exists "owner insert profile-media" on storage.objects;
drop policy if exists "owner update profile-media" on storage.objects;
drop policy if exists "owner delete profile-media" on storage.objects;
delete from storage.buckets where id = 'profile-media';