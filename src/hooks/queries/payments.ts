import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { Inserts, Tables } from "@/lib/types";

export type ScheduleRow = Tables<"payment_schedules">;
export type InstallmentRow = Tables<"payment_installments">;
export type ScheduleInput = Inserts<"payment_schedules">;
export type InstallmentInput = Inserts<"payment_installments">;

export interface ScheduleWithBooking extends ScheduleRow {
  bookings: {
    title: string;
    event_type: string;
    booking_date: string | null;
    clients: { full_name: string } | null;
  } | null;
}

const schedulesKey = ["payment_schedules"] as const;

export function usePaymentSchedules() {
  return useQuery({
    queryKey: schedulesKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_schedules")
        .select("*, bookings(title, event_type, booking_date, clients(full_name))")
        .order("due_date", { ascending: true, nullsFirst: true });
      if (error) throw error;
      return (data ?? []) as ScheduleWithBooking[];
    },
  });
}

export function useSchedule(id: string | undefined) {
  return useQuery({
    queryKey: [...schedulesKey, id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_schedules")
        .select("*, bookings(title, event_type, booking_date, clients(full_name))")
        .eq("id", id as string)
        .single();
      if (error) throw error;
      return data as ScheduleWithBooking;
    },
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ScheduleInput) => {
      const { data, error } = await supabase
        .from("payment_schedules")
        .insert([input])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: schedulesKey });
      void qc.invalidateQueries({ queryKey: ["bookings"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ScheduleRow> }) => {
      const { data, error } = await supabase
        .from("payment_schedules")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: schedulesKey });
      void qc.invalidateQueries({ queryKey: [...schedulesKey, vars.id] });
      void qc.invalidateQueries({ queryKey: ["bookings"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: schedulesKey });
      void qc.invalidateQueries({ queryKey: ["bookings"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useInstallments(scheduleId: string | undefined) {
  return useQuery({
    queryKey: ["payment_installments", scheduleId],
    enabled: !!scheduleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_installments")
        .select("*")
        .eq("schedule_id", scheduleId as string)
        .order("paid_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as InstallmentRow[];
    },
  });
}

export function useAddInstallment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: InstallmentInput) => {
      const { data, error } = await supabase
        .from("payment_installments")
        .insert([input])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ["payment_installments", vars.schedule_id] });
      void qc.invalidateQueries({ queryKey: schedulesKey });
      void qc.invalidateQueries({ queryKey: [...schedulesKey, vars.schedule_id] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
