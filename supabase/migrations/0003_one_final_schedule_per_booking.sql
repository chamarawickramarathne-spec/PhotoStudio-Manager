-- =====================================================================
-- PhotoStudio Manager - Migration 0003 (one final payment per booking)
-- Run this in the Supabase Dashboard -> SQL Editor (or `supabase db push`).
-- Guarantees a booking can never have more than one 'final' schedule.
-- =====================================================================

-- A unique index on (booking_id) restricted to 'final' rows blocks both
-- INSERTs and UPDATEs that would create a second final schedule for the
-- same booking. NULL booking_id rows are ignored by the index, so unlinked
-- schedules are unaffected.
--
-- The app's PaymentScheduleForm also validates this before submit and shows
-- an inline error; this index is the authoritative backstop at the DB level.
--
-- NOTE: if this index creation fails because duplicates already exist in a
-- booking, resolve them first (delete or re-type the extra 'final' rows)
-- and re-run.
create unique index if not exists payment_schedules_one_final_per_booking_idx
  on public.payment_schedules (booking_id)
  where schedule_type = 'final';