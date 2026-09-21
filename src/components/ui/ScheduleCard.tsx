import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

import { palette, radius, spacing } from "@/theme";
import { PAYMENT_STATUS_INFO, SCHEDULE_TYPE_LABEL } from "@/lib/constants";
import type { PaymentStatus } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";
import type { ScheduleWithBooking } from "@/hooks/queries/payments";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PaymentProgress } from "@/components/ui/SummaryTile";

interface ScheduleCardProps {
  schedule: ScheduleWithBooking;
  currency: string;
  onPress: () => void;
  statusOverride?: PaymentStatus;
  row?: boolean;
}

export function ScheduleCard({ schedule, currency, onPress, statusOverride, row }: ScheduleCardProps) {
  const effectiveStatus = statusOverride ?? schedule.status;
  const status = PAYMENT_STATUS_INFO[effectiveStatus] ?? {
    label: effectiveStatus,
    color: "#6B7280",
  };
  const paid = Number(schedule.paid_amount || 0);
  const remaining = Math.max(Number(schedule.amount) - paid, 0);
  const name = schedule.name ?? SCHEDULE_TYPE_LABEL[schedule.schedule_type] ?? "Payment";
  const bookingTitle = schedule.bookings?.title ?? "General payment";
  const clientName = schedule.bookings?.clients?.full_name;

  if (row) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.rowCard, pressed && styles.pressed]}>
        <View style={[styles.rowIcon, { backgroundColor: `${status.color}14` }]}>
          <Ionicons name="wallet" size={16} color={status.color} />
        </View>
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={styles.rowName} numberOfLines={1}>
              {name}
            </Text>
            <StatusBadge label={status.label} color={status.color} subtle />
          </View>
          <Text style={styles.rowRef} numberOfLines={1}>
            {bookingTitle}
            {clientName ? ` · ${clientName}` : ""} · Due {formatDate(schedule.due_date, "MMM d")}
          </Text>
        </View>
        <View style={styles.rowAmounts}>
          <Text style={[styles.rowPaidAmount, { color: remaining > 0 ? palette.warning : palette.success }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
            {formatMoney(paid, currency)}
          </Text>
          <Text style={styles.rowAmountLabel}>of {formatMoney(schedule.amount, currency)}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.reference} numberOfLines={1}>
            {bookingTitle}
          </Text>
        </View>
        <StatusBadge label={status.label} color={status.color} subtle />
      </View>

      <View style={styles.amountRow}>
        <View>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amount}>{formatMoney(schedule.amount, currency)}</Text>
        </View>
        <View style={styles.rightBlock}>
          <Text style={styles.amountLabel}>Paid</Text>
          <Text style={[styles.amount, { color: remaining > 0 ? palette.warning : palette.success }]}>
            {formatMoney(paid, currency)}
          </Text>
        </View>
      </View>

      <PaymentProgress amount={Number(schedule.amount)} paid={paid} />

      <View style={styles.metaRow}>
        <Ionicons name="calendar-outline" size={13} color={palette.onSurfaceVariant} />
        <Text style={styles.metaText}>Due {formatDate(schedule.due_date)}</Text>
        {clientName ? (
          <>
            <View style={styles.dot} />
            <Ionicons name="person-outline" size={13} color={palette.onSurfaceVariant} />
            <Text style={styles.metaText} numberOfLines={1}>
              {clientName}
            </Text>
          </>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pressed: { opacity: 0.7 },
  topRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  titleBlock: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: "700", color: palette.onBackground },
  reference: { fontSize: 12, color: palette.onSurfaceVariant },
  amountRow: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm },
  amountLabel: { fontSize: 11, color: palette.onSurfaceVariant, textTransform: "uppercase" },
  amount: { fontSize: 18, fontWeight: "800", color: palette.onBackground, marginTop: 2 },
  rightBlock: { alignItems: "flex-end" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.sm },
  metaText: { fontSize: 12, color: palette.onSurfaceVariant, flexShrink: 1 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: palette.outline, marginHorizontal: 4 },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rowIcon: { width: 38, height: 38, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  rowBody: { flex: 1, gap: 3, minWidth: 0 },
  rowTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rowName: { fontSize: 14, fontWeight: "700", color: palette.onBackground, flexShrink: 1 },
  rowRef: { fontSize: 12, color: palette.onSurfaceVariant },
  rowAmounts: { alignItems: "flex-end", maxWidth: 180 },
  rowPaidAmount: { fontSize: 15, fontWeight: "800" },
  rowAmountLabel: { fontSize: 11, color: palette.onSurfaceVariant, marginTop: 2 },
});