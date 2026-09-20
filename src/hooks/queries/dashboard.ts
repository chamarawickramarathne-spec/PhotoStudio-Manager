import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, subMonths } from "date-fns";

import { supabase } from "@/lib/supabase";
import type { BookingWithClient } from "@/hooks/queries/bookings";
import type { ScheduleWithBooking } from "@/hooks/queries/payments";

export interface RevenueBucket {
  key: string;
  label: string;
  amount: number;
}

export interface DashboardStats {
  totalClients: number;
  totalBookings: number;
  outstanding: number;
  monthlyRevenue: number;
  revenueSeries: RevenueBucket[];
  recentBookings: BookingWithClient[];
  recentSchedules: ScheduleWithBooking[];
}

const SERIES_MONTHS = 12;

function buildRevenueSeries(installments: { amount: number; paid_date: string }[]): {
  series: RevenueBucket[];
  byKey: Map<string, RevenueBucket>;
} {
  const series: RevenueBucket[] = [];
  for (let i = SERIES_MONTHS - 1; i >= 0; i -= 1) {
    const monthStart = startOfMonth(subMonths(new Date(), i));
    series.push({ key: format(monthStart, "yyyy-MM"), label: format(monthStart, "MMM"), amount: 0 });
  }
  const byKey = new Map(series.map((b) => [b.key, b]));
  for (const inst of installments) {
    const key = inst.paid_date.slice(0, 7);
    const bucket = byKey.get(key);
    if (bucket) bucket.amount += Number(inst.amount || 0);
  }
  return { series, byKey };
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async (): Promise<DashboardStats> => {
      const seriesStart = startOfMonth(subMonths(new Date(), SERIES_MONTHS - 1))
        .toISOString()
        .slice(0, 10);

      const [clientsRes, bookingsCountRes, recentBookingsRes, schedulesRes, installmentsRes] =
        await Promise.all([
          supabase.from("clients").select("id", { count: "exact", head: true }),
          supabase.from("bookings").select("id", { count: "exact", head: true }),
          supabase
            .from("bookings")
            .select("*, clients(full_name, email, phone)")
            .order("booking_date", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })
            .range(0, 4),
          supabase.from("payment_schedules").select(
            "*, bookings(title, event_type, booking_date, clients(full_name))",
          ),
          supabase
            .from("payment_installments")
            .select("amount, paid_date")
            .gte("paid_date", seriesStart)
            .order("paid_date", { ascending: true }),
        ]);

      if (clientsRes.error) throw clientsRes.error;
      if (bookingsCountRes.error) throw bookingsCountRes.error;
      if (recentBookingsRes.error) throw recentBookingsRes.error;
      if (schedulesRes.error) throw schedulesRes.error;
      if (installmentsRes.error) throw installmentsRes.error;

      const schedules = (schedulesRes.data ?? []) as ScheduleWithBooking[];
      const liveSchedules = schedules.filter((s) => s.status !== "cancelled");
      const outstanding = liveSchedules.reduce(
        (sum, s) => sum + Math.max(Number(s.amount) - Number(s.paid_amount || 0), 0),
        0,
      );

      const { series, byKey } = buildRevenueSeries(installmentsRes.data ?? []);
      const currentKey = format(new Date(), "yyyy-MM");

      return {
        totalClients: clientsRes.count ?? 0,
        totalBookings: bookingsCountRes.count ?? 0,
        outstanding,
        monthlyRevenue: byKey.get(currentKey)?.amount ?? 0,
        revenueSeries: series,
        recentBookings: (recentBookingsRes.data ?? []) as BookingWithClient[],
        recentSchedules: schedules,
      };
    },
  });
}