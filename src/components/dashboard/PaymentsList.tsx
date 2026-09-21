import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "@/navigation/router";
import { ProgressBar as PaperProgressBar } from "react-native-paper";

import { EmptyState } from "@/components/ui/EmptyState";
import type { DashboardStats } from "@/hooks/queries/dashboard";
import { formatDate, formatMoney, todayISO } from "@/lib/format";
import { palette, radius, spacing } from "@/theme";

export type DueSchedule = DashboardStats["recentSchedules"][number] & { isOverdue: boolean };

export function buildPaymentsDue(schedules: DashboardStats["recentSchedules"]): {
  overdue: DueSchedule[];
  pending: DueSchedule[];
} {
  const paymentsDue = (schedules ?? [])
    .filter((s) => s.status !== "paid" && s.status !== "cancelled")
    .map((s) => ({ ...s, isOverdue: s.status === "overdue" || (s.due_date != null && s.due_date < todayISO()) }))
    .sort((a, b) => (a.due_date ?? "") < (b.due_date ?? "") ? -1 : 1);
  return {
    overdue: paymentsDue.filter((s) => s.isOverdue),
    pending: paymentsDue.filter((s) => !s.isOverdue),
  };
}

export function PaymentsList({
  overdue,
  pending,
  currency,
}: {
  overdue: DueSchedule[];
  pending: DueSchedule[];
  currency: string;
}) {
  if (overdue.length === 0 && pending.length === 0) {
    return (
      <EmptyState icon="wallet-outline" title="Nothing due" message="Outstanding schedules will appear here." />
    );
  }
  return (
    <View style={styles.list}>
      {overdue.length > 0 ? (
        <>
          <Text style={styles.groupHeader}>Overdue</Text>
          {overdue.map((s) => (
            <PaymentRow key={s.id} schedule={s} currency={currency} danger />
          ))}
        </>
      ) : null}
      {pending.length > 0 ? (
        <>
          <Text style={styles.groupHeader}>Pending</Text>
          {pending.map((s) => (
            <PaymentRow key={s.id} schedule={s} currency={currency} />
          ))}
        </>
      ) : null}
    </View>
  );
}

function PaymentRow({ schedule: s, currency, danger }: { schedule: DueSchedule; currency: string; danger?: boolean }) {
  const remaining = Math.max(Number(s.amount) - Number(s.paid_amount || 0), 0);
  const pct = Number(s.amount) > 0 ? Math.min(Number(s.paid_amount || 0) / Number(s.amount), 1) : 0;
  return (
    <Pressable
      style={({ pressed }) => [styles.paymentCard, pressed && styles.pressed]}
      onPress={() => router.push(`/payment/${s.id}`)}
    >
      <View style={styles.paymentTop}>
        <View style={[styles.paymentIcon, { backgroundColor: `${danger ? palette.danger : palette.warning}14` }]}>
          <Ionicons name="wallet" size={16} color={danger ? palette.danger : palette.warning} />
        </View>
        <View style={styles.paymentBody}>
          <Text style={styles.paymentTitle} numberOfLines={1}>
            {s.name || s.bookings?.title || "Untitled payment"}
          </Text>
          <Text style={styles.paymentMeta} numberOfLines={1}>
            {s.bookings?.clients?.full_name ?? "Unknown client"} · Due {s.due_date ? formatDate(s.due_date, "MMM d") : "No date"}
          </Text>
        </View>
        <Text style={[styles.paymentAmount, { color: danger ? palette.danger : palette.secondary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          {formatMoney(remaining, currency)}
        </Text>
      </View>
      <PaperProgressBar progress={pct} color={danger ? palette.danger : palette.secondary} style={styles.progress} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  groupHeader: { fontSize: 12, fontWeight: "800", color: palette.onSurfaceVariant, textTransform: "uppercase", letterSpacing: 0.5 },
  paymentCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  pressed: { opacity: 0.7 },
  paymentTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  paymentIcon: { width: 34, height: 34, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  paymentBody: { flex: 1, gap: 2 },
  paymentTitle: { fontSize: 14, fontWeight: "700", color: palette.onBackground },
  paymentMeta: { fontSize: 12, color: palette.onSurfaceVariant },
  paymentAmount: { fontSize: 14, fontWeight: "800" },
  progress: { height: 6, borderRadius: radius.pill, backgroundColor: palette.surfaceVariant },
});