-- =====================================================================
-- PhotoStudio Manager - Migration 0006 (account deletion)
-- Run this in the Supabase Dashboard -> SQL Editor.
-- Adds a security-definer RPC that lets an authenticated user delete
-- only their own account. Deleting auth.users cascades to profiles,
-- clients, bookings, payment schedules, installments, and stored
-- profile data through the existing foreign keys.
-- =====================================================================

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  delete from auth.users where id = v_user_id;

  if not found then
    raise exception 'Account not found';
  end if;
end;
$$;

revoke all on function public.delete_own_account() from public;
revoke all on function public.delete_own_account() from anon;
revoke all on function public.delete_own_account() from authenticated;
grant execute on function public.delete_own_account() to authenticated;

comment on function public.delete_own_account() is
  'Deletes the authenticated user account and all cascading studio data.';
