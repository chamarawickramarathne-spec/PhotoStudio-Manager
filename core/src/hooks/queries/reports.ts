import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, subMonths } from "date-fns";

import { supabase } from "@/lib/supabase";
import { todayISO } from "@/lib/format";
import type { RevenueBucket } from "@/hooks/queries/dashboard";

export interface ReportsData {
  revenueSeries: RevenueBucket[];
  eventRevenue: { eventType: string; amount: number; count: number }[];
  methods: { method: string; amount: number; count: number }[];
  topClients: { name: string; amount: number }[];
  collected: number;
  outstanding: number;
  overdueCount: number;
  depositCollected: number;
  depositTotal: number;
  pipeline: { status: string; count: number }[];
  totalBookings: number;
}

const SERIES_MONTHS = 12;
const STATUS_ORDER = ["pending", "confirmed", "in_progress", "completed", "cancelled"] as const;

interface InstallmentLink {
  amount: number;
  paid_date: string;
  payment_method: "cash" | "e_transfer_bank" | "card_pay" | "other" | null;
  payment_schedules: {
    bookings: {
      event_type: string;
      clients: { full_name: string } | null;
    } | null;
  } | null;
}

interface ScheduleRef {
  amount: number;
  paid_amount: number;
  due_date: string | null;
  status: "pending" | "paid" | "overdue" | "cancelled";
  schedule_type: "deposit" | "milestone" | "final" | "custom";
}

function addAmount(
  map: Map<string, { amount: number; count: number }>,
  key: string,
  amount: number,
) {
  const current = map.get(key) ?? { amount: 0, count: 0 };
  current.amount += amount;
  current.count += 1;
  map.set(key, current);
}

export function useReports() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: async (): Promise<ReportsData> => {
      const [instRes, schedRes, bookingRes] = await Promise.all([
        supabase
          .from("payment_installments")
          .select("amount, paid_date, payment_method, payment_schedules(bookings(event_type, clients(full_name)))"),
        supabase
          .from("payment_schedules")
          .select("amount, paid_amount, due_date, status, schedule_type"),
        supabase.from("bookings").select("status"),
      ]);
      for (const res of [instRes, schedRes, bookingRes]) {
        if (res.error) throw res.error;
      }

      const installments = (instRes.data ?? []) as InstallmentLink[];
      const schedules = (schedRes.data ?? []) as ScheduleRef[];
      const bookings = (bookingRes.data ?? []) as { status: string }[];

      const series: RevenueBucket[] = [];
      for (let i = SERIES_MONTHS - 1; i >= 0; i -= 1) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        series.push({ key: format(monthStart, "yyyy-MM"), label: format(monthStart, "MMM"), amount: 0 });
      }
      const byKey = new Map(series.map((b) => [b.key, b]));
      const eventMap = new Map<string, { amount: number; count: number }>();
      const methodMap = new Map<string, { amount: number; count: number }>();
      const clientMap = new Map<string, number>();

      for (const inst of installments) {
        const amount = Number(inst.amount || 0);
        const bucket = byKey.get(inst.paid_date.slice(0, 7));
        if (bucket) bucket.amount += amount;

        const eventType = inst.payment_schedules?.bookings?.event_type;
        addAmount(eventMap, eventType || "Other", amount);

        const method = inst.payment_method ?? "other";
        addAmount(methodMap, method, amount);

        const name = inst.payment_schedules?.bookings?.clients?.full_name;
        const key = name || "Unknown client";
        clientMap.set(key, (clientMap.get(key) ?? 0) + amount);
      }

      const eventRevenue = [...eventMap.entries()]
        .map(([eventType, v]) => ({ eventType, amount: v.amount, count: v.count }))
        .sort((a, b) => b.amount - a.amount);
      const methods = [...methodMap.entries()]
        .map(([method, v]) => ({ method, amount: v.amount, count: v.count }))
        .sort((a, b) => b.amount - a.amount);
      const topClients = [...clientMap.entries()]
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      const today = todayISO();
      const live = schedules.filter((s) => s.status !== "cancelled");
      const collected = live.reduce((sum, s) => sum + Number(s.paid_amount || 0), 0);
      const outstanding = live.reduce(
        (sum, s) => sum + Math.max(Number(s.amount) - Number(s.paid_amount || 0), 0),
        0,
      );
      const overdueCount = live.filter(
        (s) => s.status !== "paid" && (s.status === "overdue" || (s.due_date && s.due_date < today)),
      ).length;
      const deposits = live.filter((s) => s.schedule_type === "deposit");
      const depositCollected = deposits.reduce((sum, s) => sum + Number(s.paid_amount || 0), 0);
      const depositTotal = deposits.reduce((sum, s) => sum + Number(s.amount), 0);

      const statusCount = new Map<string, number>();
      for (const b of bookings) {
        statusCount.set(b.status, (statusCount.get(b.status) ?? 0) + 1);
      }
      const pipeline = STATUS_ORDER.map((status) => ({
        status,
        count: statusCount.get(status) ?? 0,
      })).filter((r) => r.count > 0);

      return {
        revenueSeries: series,
        eventRevenue,
        methods,
        topClients,
        collected,
        outstanding,
        overdueCount,
        depositCollected,
        depositTotal,
        pipeline,
        totalBookings: bookings.length,
      };
    },
  });
}