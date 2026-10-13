import { supabase } from "@/lib/supabase";

export async function deleteBookingDetails(bookingIds: string[]): Promise<void> {
  if (bookingIds.length === 0) return;

  const { data: schedules, error: schedErr } = await supabase
    .from("payment_schedules")
    .select("id")
    .in("booking_id", bookingIds);
  if (schedErr) throw schedErr;

  const scheduleIds = (schedules ?? []).map((s) => s.id);

  if (scheduleIds.length > 0) {
    const { error: instErr } = await supabase
      .from("payment_installments")
      .delete()
      .in("schedule_id", scheduleIds);
    if (instErr) throw instErr;

    const { error: delErr } = await supabase
      .from("payment_schedules")
      .delete()
      .in("booking_id", bookingIds);
    if (delErr) throw delErr;
  }

  const { error: bookingErr } = await supabase
    .from("bookings")
    .delete()
    .in("id", bookingIds);
  if (bookingErr) throw bookingErr;
}