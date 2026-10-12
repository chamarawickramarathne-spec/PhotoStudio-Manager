import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { Inserts, Tables } from "@/lib/types";

export type ClientRow = Tables<"clients">;
export type ClientInput = Inserts<"clients">;

const baseKey = ["clients"] as const;

export function useClients() {
  return useQuery({
    queryKey: baseKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ClientRow[];
    },
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: [...baseKey, id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id as string)
        .single();
      if (error) throw error;
      return data as ClientRow;
    },
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClientInput) => {
      const { data, error } = await supabase
        .from("clients")
        .insert([input])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: baseKey });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ClientRow> }) => {
      const { data, error } = await supabase
        .from("clients")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: baseKey });
      void qc.invalidateQueries({ queryKey: [...baseKey, vars.id] });
      void qc.invalidateQueries({ queryKey: ["bookings"] });
      void qc.invalidateQueries({ queryKey: ["payment_schedules"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: baseKey });
      void qc.invalidateQueries({ queryKey: ["bookings"] });
      void qc.invalidateQueries({ queryKey: ["payment_schedules"] });
      void qc.invalidateQueries({ queryKey: ["payment_installments"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
