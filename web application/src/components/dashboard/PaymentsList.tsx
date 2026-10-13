import { Pressable, StyleSheet, Text, View } from "react-native";
import { ProgressBar as PaperProgressBar } from "react-native-paper";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "@/navigation/router";

import { EmptyState } from "@/components/ui/EmptyState";
import { ResponsiveWrap } from "@/components/ui/ResponsiveWrap";
import { StatusBadge } from "@/components/ui/StatusBadge";
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
  const all = [...overdue, ...pending];
  return (
    <ResponsiveWrap minItemWidth={250} gap={spacing.md}>
      {all.map((s) => (
        <DueCard key={s.id} schedule={s} currency={currency} />
      ))}
    </ResponsiveWrap>
  );
}

function DueCard({ schedule: s, currency }: { schedule: DueSchedule; currency: string }) {
  const remaining = Math.max(Number(s.amount) - Number(s.paid_amount || 0), 0);
  const pct = Number(s.amount) > 0 ? Math.min(Number(s.paid_amount || 0) / Number(s.amount), 1) : 0;
  const color = s.isOverdue ? palette.danger : PAYMENT_PENDING_COLOR;
  const title = s.name || s.bookings?.title || "Untitled payment";
  const bookingTitle = s.bookings?.title ? `${s.bookings.title} · ` : "";
  const meta = s.bookings?.clients?.full_name ?? "General payment";
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push(`/payment/${s.id}`)}
    >
      <View style={styles.topRow}>
        <View style={styles.dateBlock}>
          <Text style={styles.dateDay}>{s.due_date ? formatDate(s.due_date, "dd") : "–"}</Text>
          <Text style={styles.dateMonth}>{s.due_date ? formatDate(s.due_date, "MMM") : "Due"}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {bookingTitle}
            {meta}
          </Text>
          {s.notes ? (
            <View style={styles.noteRow}>
              <Ionicons name="document-text-outline" size={12} color={palette.onSurfaceVariant} />
              <Text style={styles.noteText} numberOfLines={1}>
                {s.notes}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.footRow}>
        <View style={styles.footLeft}>
          <Text style={[styles.amount, { color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
            {formatMoney(remaining, currency)} due
          </Text>
          <PaperProgressBar progress={pct} color={color} style={styles.progress} />
        </View>
        <StatusBadge label={s.isOverdue ? "Overdue" : "Pending"} color={color} subtle />
      </View>
    </Pressable>
  );
}

const PAYMENT_PENDING_COLOR = "#D97706";

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pressed: { opacity: 0.7 },
  topRow: { flexDirection: "row", gap: spacing.md },
  dateBlock: { alignItems: "center", justifyContent: "center", width: 44 },
  dateDay: { fontSize: 20, fontWeight: "800", color: palette.secondary },
  dateMonth: { fontSize: 11, fontWeight: "700", color: palette.onSurfaceVariant, textTransform: "uppercase" },
  body: { flex: 1, gap: 2, justifyContent: "center", minWidth: 0 },
  title: { fontSize: 14, fontWeight: "700", color: palette.onBackground },
  meta: { fontSize: 12, color: palette.onSurfaceVariant },
  noteRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2, minWidth: 0 },
  noteText: { fontSize: 12, color: palette.onSurfaceVariant, fontStyle: "italic", flexShrink: 1 },
  footRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  footLeft: { flex: 1, gap: spacing.xs, minWidth: 0 },
  amount: { fontSize: 13, fontWeight: "800" },
  progress: { height: 6, borderRadius: radius.pill, backgroundColor: palette.surfaceVariant },
});