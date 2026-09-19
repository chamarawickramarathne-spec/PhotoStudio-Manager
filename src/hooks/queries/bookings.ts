import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { Inserts, Tables } from "@/lib/types";

export type BookingRow = Tables<"bookings">;
export type BookingInput = Inserts<"bookings">;

export interface BookingWithClient extends BookingRow {
  clients: {
    full_name: string;
    email: string | null;
    phone: string | null;
  } | null;
}

const baseKey = ["bookings"] as const;

export function useBookings() {
  return useQuery({
    queryKey: baseKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, clients(full_name, email, phone)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BookingWithClient[];
    },
  });
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: [...baseKey, id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, clients(full_name, email, phone)")
        .eq("id", id as string)
        .single();
      if (error) throw error;
      return data as BookingWithClient;
    },
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BookingInput) => {
      const { data, error } = await supabase
        .from("bookings")
        .insert([input])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: baseKey });
      void qc.invalidateQueries({ queryKey: ["clients"] });
      void qc.invalidateQueries({ queryKey: ["payment_schedules"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<BookingRow> }) => {
      const { data, error } = await supabase
        .from("bookings")
        .update(patch)
        .eq("id", id)
        .select("*, clients(full_name, email, phone)")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: baseKey });
      void qc.invalidateQueries({ queryKey: [...baseKey, vars.id] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bookings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: baseKey });
      void qc.invalidateQueries({ queryKey: ["payment_schedules"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
