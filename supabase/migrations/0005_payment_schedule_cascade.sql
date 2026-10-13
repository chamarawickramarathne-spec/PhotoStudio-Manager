-- =====================================================================
-- PhotoStudio Manager - Migration 0005 (payment schedules cascade)
-- Run this in the Supabase Dashboard -> SQL Editor (or `supabase db push`).
-- Makes payment schedules (and their installments) delete with their
-- booking, so deleting a client no longer orphans payment records.
-- =====================================================================

-- ---- (a) Clean up orphaned schedules ------------------------------------
-- A payment schedule with booking_id = NULL was orphaned by past client /
-- booking deletions (previously the FK used ON DELETE SET NULL). Since the
-- app's PaymentScheduleForm always requires a booking, every unlinked
-- schedule is garbage. Deleting a schedule cascades to its installments;
-- the apply_installment() AFTER DELETE trigger safely no-ops here because
-- the schedule row no longer exists when it looks it up.
delete from public.payment_schedules where booking_id is null;

-- ---- (b) Re-point the FK to CASCADE ---------------------------------------
-- Drop the auto-named FK (payment_schedules_booking_id_fkey) created by
-- 0001's `booking_id uuid references public.bookings(id) on delete set null`
-- and re-add it with ON DELETE CASCADE so deleting a booking removes its
-- payment schedules and, transitively, their installments.
alter table public.payment_schedules
  drop constraint if exists payment_schedules_booking_id_fkey;

alter table public.payment_schedules
  add constraint payment_schedules_booking_id_fkey
  foreign key (booking_id) references public.bookings(id) on delete cascade;