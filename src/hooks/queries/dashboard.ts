import { useQuery } from "@tanstack/react-query";
import { startOfDay } from "date-fns";

import { supabase } from "@/lib/supabase";
import type { BookingWithClient } from "@/hooks/queries/bookings";
import type { ScheduleWithBooking } from "@/hooks/queries/payments";

export interface DashboardStats {
  totalClients: number;
  activeBookings: number;
  todayBookings: number;
  upcomingBookings: number;
  totalCollected: number;
  totalPending: number;
  overdueCount: number;
  recentBookings: BookingWithClient[];
  recentSchedules: ScheduleWithBooking[];
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async (): Promise<DashboardStats> => {
      const today = startOfDay(new Date()).toISOString().slice(0, 10);

      const [clientsRes, bookingsRes, schedulesRes] = await Promise.all([
        supabase.from("clients").select("id"),
        supabase
          .from("bookings")
          .select("*, clients(full_name, email, phone)")
          .order("booking_date", { ascending: false })
          .limit(100),
        supabase
          .from("payment_schedules")
          .select("*, bookings(title, event_type, booking_date, clients(full_name))")
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (bookingsRes.error) throw bookingsRes.error;
      if (schedulesRes.error) throw schedulesRes.error;

      const bookings = (bookingsRes.data ?? []) as BookingWithClient[];
      const schedules = (schedulesRes.data ?? []) as ScheduleWithBooking[];

      const activeStatuses = new Set(["pending", "confirmed", "in_progress"]);
      const activeBookings = bookings.filter((b) => activeStatuses.has(b.status));
      const todayBookings = activeBookings.filter((b) => b.booking_date === today);
      const upcomingBookings = activeBookings.filter(
        (b) => b.booking_date && b.booking_date >= today,
      ).length;

      const liveSchedules = schedules.filter((s) => s.status !== "cancelled");
      const totalCollected = liveSchedules.reduce(
        (sum, s) => sum + Number(s.paid_amount || 0),
        0,
      );
      const totalPending = liveSchedules.reduce(
        (sum, s) => sum + Math.max(Number(s.amount) - Number(s.paid_amount || 0), 0),
        0,
      );
      const overdueCount = liveSchedules.filter(
        (s) => s.status === "overdue" || (s.status !== "paid" && s.due_date && s.due_date < today),
      ).length;

      return {
        totalClients: clientsRes.data?.length ?? 0,
        activeBookings: activeBookings.length,
        todayBookings: todayBookings.length,
        upcomingBookings,
        totalCollected,
        totalPending,
        overdueCount,
        recentBookings: bookings.slice(0, 5),
        recentSchedules: schedules.slice(0, 5),
      };
    },
  });
}
