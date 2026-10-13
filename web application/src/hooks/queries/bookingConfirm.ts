import { addDays, format } from "date-fns";

import { supabase } from "@/lib/supabase";
import { todayISO } from "@/lib/format";
import type { BookingRow } from "@/hooks/queries/bookings";
import type { ScheduleInput } from "@/hooks/queries/payments";

function dueDateStatus(dueDate: string | null): ScheduleInput["status"] {
  if (dueDate && dueDate < todayISO()) return "overdue";
  return "pending";
}

/**
 * When a booking is confirmed, create its baseline payment schedule:
 * - a Deposit for `deposit_amount` due 2 days from today (only when > 0)
 * - a Final Payment for the remaining balance due on the booking date
 *
 * Never runs when the booking already has any schedule, so it is safe to call
 * on every update and will not duplicate rows.
 */
export async function ensureBookingPaymentSchedules(booking: BookingRow): Promise<number> {
  const { data: existing, error: existingError } = await supabase
    .from("payment_schedules")
    .select("id")
    .eq("booking_id", booking.id)
    .limit(1);
  if (existingError) throw existingError;
  if ((existing ?? []).length > 0) return 0;

  const total = Number(booking.total_amount ?? 0);
  const deposit = Number(booking.deposit_amount ?? 0);
  const remaining = total - deposit;
  const rows: ScheduleInput[] = [];

  if (deposit > 0) {
    const dueDate = format(addDays(new Date(), 2), "yyyy-MM-dd");
    rows.push({
      user_id: booking.user_id,
      booking_id: booking.id,
      schedule_type: "deposit",
      name: "Deposit",
      amount: deposit,
      due_date: dueDate,
      status: dueDateStatus(dueDate),
    });
  }

  if (total > 0 && remaining > 0) {
    const dueDate = booking.booking_date ?? null;
    rows.push({
      user_id: booking.user_id,
      booking_id: booking.id,
      schedule_type: "final",
      name: "Final Payment",
      amount: remaining,
      due_date: dueDate,
      status: dueDateStatus(dueDate),
    });
  }

  if (rows.length === 0) return 0;

  const { error } = await supabase.from("payment_schedules").insert(rows);
  if (error) throw error;
  return rows.length;
}
