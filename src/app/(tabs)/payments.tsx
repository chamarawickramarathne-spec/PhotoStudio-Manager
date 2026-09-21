import { useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Chip, FAB, Searchbar, Text as PaperText } from "react-native-paper";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "@/navigation/router";

import { Screen } from "@/components/ui/Screen";
import { ScheduleCard } from "@/components/ui/ScheduleCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SummaryTile } from "@/components/ui/SummaryTile";
import { usePaymentSchedules } from "@/hooks/queries/payments";
import { useAuth } from "@/hooks/useAuth";
import type { PaymentStatus } from "@/lib/constants";
import { todayISO, formatMoney } from "@/lib/format";
import { palette, radius, spacing } from "@/theme";

const FILTERS: { value: PaymentStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
];

export default function PaymentsTab() {
  const { data: schedules, isLoading, isRefetching, refetch } = usePaymentSchedules();
  const { currency } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 700;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PaymentStatus | "all">("all");
  const today = todayISO();

  const stats = useMemo(() => {
    const live = (schedules ?? []).filter((s) => s.status !== "cancelled");
    const collected = live.reduce((sum, s) => sum + Number(s.paid_amount || 0), 0);
    const outstanding = live.reduce(
      (sum, s) => sum + Math.max(Number(s.amount) - Number(s.paid_amount || 0), 0),
      0,
    );
    const overdue = live.filter((s) => s.status === "overdue" || (s.status !== "paid" && s.due_date && s.due_date < today)).length;
    return { collected, outstanding, overdue, total: live.length };
  }, [schedules, today]);

  const effectiveStatus = (status: PaymentStatus, dueDate: string | null): PaymentStatus => {
    if (status === "paid" || status === "cancelled") return status;
    if (dueDate && dueDate < today) return "overdue";
    return "pending";
  };

  const filtered = useMemo(() => {
    if (!schedules) return [];
    const q = query.trim().toLowerCase();
    return schedules.filter((s) => {
      const effStatus = s.status === "paid" || s.status === "cancelled"
        ? s.status
        : s.due_date && s.due_date < today
          ? "overdue"
          : "pending";
      const matchesFilter = filter === "all" || effStatus === filter;
      const matchesQuery =
        !q ||
        (s.name ?? "").toLowerCase().includes(q) ||
        (s.bookings?.title ?? "").toLowerCase().includes(q) ||
        (s.bookings?.clients?.full_name ?? "").toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [schedules, query, filter, today]);

  return (
    <>
      <Screen
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={palette.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Payments</Text>
          <PaperText style={styles.subtitle}>Schedules, installments and balances</PaperText>
        </View>

        {isWide ? (
          <View style={styles.statsRow}>
            <SummaryTile label="Collected" value={formatMoney(stats.collected, currency)} color={palette.success} icon="checkmark-circle" />
            <SummaryTile label="Outstanding" value={formatMoney(stats.outstanding, currency)} color={palette.warning} icon="time" />
            <SummaryTile label="Overdue" value={String(stats.overdue)} color={palette.danger} icon="warning" />
            <SummaryTile label="Schedules" value={String(stats.total)} color={palette.info} icon="list" />
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <SummaryTile label="Collected" value={formatMoney(stats.collected, currency)} color={palette.success} icon="checkmark-circle" />
              <SummaryTile label="Outstanding" value={formatMoney(stats.outstanding, currency)} color={palette.warning} icon="time" />
            </View>

            <View style={styles.statsRow}>
              <SummaryTile label="Overdue" value={String(stats.overdue)} color={palette.danger} icon="warning" />
              <SummaryTile label="Schedules" value={String(stats.total)} color={palette.info} icon="list" />
            </View>
          </>
        )}

        <Searchbar
          placeholder="Search client or booking"
          value={query}
          onChangeText={setQuery}
          style={styles.search}
          inputStyle={styles.searchInput}
        />

        <View style={styles.filters}>
          {FILTERS.map((f) => {
            const isActive = filter === f.value;
            return (
              <Chip
                key={f.value}
                selected={isActive}
                onPress={() => setFilter(f.value)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                textStyle={styles.filterChipText}
              >
                {f.label}
              </Chip>
            );
          })}
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={palette.primary} />
          </View>
        ) : filtered.length === 0 ? (
          schedules && schedules.length > 0 ? (
            <EmptyState icon="search" title="No matches" message="No payments match your filters." />
          ) : (
            <EmptyState
              icon="wallet-outline"
              title="No payment schedules"
              message="Create a payment schedule for a booking to start tracking."
              actionLabel="New Schedule"
              onAction={() => router.push("/payment/new")}
            />
          )
        ) : (
          <View style={styles.list}>
            {filtered.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                currency={currency}
                row={isWide}
                statusOverride={effectiveStatus(schedule.status, schedule.due_date)}
                onPress={() => router.push(`/payment/${schedule.id}`)}
              />
            ))}
          </View>
        )}
      </Screen>

      <FAB
        icon={() => <Ionicons name="add" size={24} color={palette.white} />}
        style={styles.fab}
        color={palette.white}
        onPress={() => router.push("/payment/new")}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.lg },
  greeting: { fontSize: 26, fontWeight: "800", color: palette.onBackground },
  subtitle: { fontSize: 14, color: palette.onSurfaceVariant, marginTop: 2 },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  search: {
    marginBottom: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
    elevation: 1,
  },
  searchInput: { fontSize: 14 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  filterChip: { backgroundColor: palette.surface, borderColor: palette.outline },
  filterChipActive: { backgroundColor: palette.primary },
  filterChipText: { fontSize: 12, fontWeight: "600" },
  center: { paddingVertical: 64, alignItems: "center" },
  list: { gap: spacing.md },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    borderRadius: 28,
    backgroundColor: palette.primary,
  },
});
