import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, subMonths } from "date-fns";

import { supabase } from "@/lib/supabase";
import { todayISO } from "@/lib/format";
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
  overdueCount: number;
  monthlyRevenue: number;
  todayCount: number;
  revenueTrend: number;
  bookingsTrend: number;
  clientsTrend: number;
  revenueSeries: RevenueBucket[];
  recentBookings: BookingWithClient[];
  upcomingBookings: BookingWithClient[];
  recentSchedules: ScheduleWithBooking[];
}

const SERIES_MONTHS = 12;

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : current > 0 ? 100 : -100;
  return Math.round(((current - previous) / previous) * 100);
}

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
      const today = todayISO();
      const thisMonth = startOfMonth(new Date());
      const lastMonth = subMonths(thisMonth, 1);
      const nextMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 1);
      const seriesStart = iso(subMonths(new Date(), SERIES_MONTHS - 1));

      const all = [
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase
          .from("clients")
          .select("id", { count: "exact", head: true })
          .gte("created_at", iso(thisMonth))
          .lt("created_at", iso(nextMonth)),
        supabase
          .from("clients")
          .select("id", { count: "exact", head: true })
          .gte("created_at", iso(lastMonth))
          .lt("created_at", iso(thisMonth)),
        supabase.from("bookings").select("id", { count: "exact", head: true }),
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .gte("booking_date", iso(thisMonth))
          .lt("booking_date", iso(nextMonth)),
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .gte("booking_date", iso(lastMonth))
          .lt("booking_date", iso(thisMonth)),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("booking_date", today),
        supabase
          .from("bookings")
          .select("*, clients(full_name, email, phone)")
          .gte("booking_date", today)
          .not("status", "eq", "cancelled")
          .order("booking_date", { ascending: true })
          .limit(3),
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
      ] as const;

      const settled = await Promise.all(all);
      for (const res of settled) {
        if (res.error) throw res.error;
      }

      const [clientsRes, clientsThisRes, clientsLastRes, bookingsRes, bookingsThisRes, bookingsLastRes, todayRes, upcomingRes, recentBookingsRes, schedulesRes, installmentsRes] = settled;

      const schedules = (schedulesRes.data ?? []) as ScheduleWithBooking[];
      const liveSchedules = schedules.filter((s) => s.status !== "cancelled");
      const outstanding = liveSchedules.reduce(
        (sum, s) => sum + Math.max(Number(s.amount) - Number(s.paid_amount || 0), 0),
        0,
      );
      const overdueCount = liveSchedules.filter(
        (s) => s.status !== "paid" && (s.status === "overdue" || (s.due_date && s.due_date < today)),
      ).length;

      const { series, byKey } = buildRevenueSeries(installmentsRes.data ?? []);
      const currentKey = format(new Date(), "yyyy-MM");
      const currentRevenue = byKey.get(currentKey)?.amount ?? 0;
      const prevRevenue = series.length >= 2 ? series[series.length - 2].amount : 0;

      return {
        totalClients: clientsRes.count ?? 0,
        totalBookings: bookingsRes.count ?? 0,
        outstanding,
        overdueCount,
        monthlyRevenue: currentRevenue,
        todayCount: todayRes.count ?? 0,
        revenueTrend: pctChange(currentRevenue, prevRevenue),
        bookingsTrend: pctChange(bookingsThisRes.count ?? 0, bookingsLastRes.count ?? 0),
        clientsTrend: pctChange(clientsThisRes.count ?? 0, clientsLastRes.count ?? 0),
        revenueSeries: series,
        recentBookings: (recentBookingsRes.data ?? []) as BookingWithClient[],
        upcomingBookings: (upcomingRes.data ?? []) as BookingWithClient[],
        recentSchedules: schedules,
      };
    },
  });
}