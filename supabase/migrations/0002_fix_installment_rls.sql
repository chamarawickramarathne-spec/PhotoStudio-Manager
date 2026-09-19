-- =====================================================================
-- PhotoStudio Manager - Migration 0002 (security hardening)
-- Run this in the Supabase Dashboard -> SQL Editor (or `supabase db push`).
-- Fixes:
--   1. apply_installment() is changed to SECURITY INVOKER so the
--      payment_schedules update is governed by Row Level Security
--      (previously SECURITY DEFINER allowed cross-tenant tampering of
--      another user's paid_amount via a foreign schedule_id).
--   2. New BEFORE trigger rejects installments whose schedule_id does
--      not belong to the same user_id (defence in depth).
--   3. Marking a schedule 'paid' now requires amount > 0 (a zero-amount
--      schedule was auto-marked paid after any installment).
-- =====================================================================

-- ---------- Check that schedule belongs to the same user ----------
create or replace function public.check_installment_schedule_owner()
returns trigger language plpgsql set search_path = public as $$
begin
  if not exists (
    select 1 from public.payment_schedules
    where id = new.schedule_id and user_id = new.user_id
  ) then
    raise exception 'installment schedule_id does not belong to this user';
  end if;
  return new;
end;
$$;

drop trigger if exists payment_installments_owner_check on public.payment_installments;
create trigger payment_installments_owner_check
  before insert or update of schedule_id, user_id on public.payment_installments
  for each row execute function public.check_installment_schedule_owner();

-- ---------- Roll up installments into schedule (security invoker) ----------
create or replace function public.apply_installment()
returns trigger language plpgsql set search_path = public as $$
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
        when v_schedule.amount > 0 and v_new_paid >= v_schedule.amount then 'paid'
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