import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

import { palette, radius, spacing } from "@/theme";
import { BOOKING_STATUS_MAP, EVENT_TYPE_MAP } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";
import type { BookingWithClient } from "@/hooks/queries/bookings";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface BookingCardProps {
  booking: BookingWithClient;
  currency: string;
  onPress: () => void;
}

export function BookingCard({ booking, currency, onPress }: BookingCardProps) {
  const event = EVENT_TYPE_MAP[booking.event_type] ?? EVENT_TYPE_MAP.Other;
  const status = BOOKING_STATUS_MAP[booking.status] ?? { label: booking.status, color: "#6B7280" };

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.iconWrap, { backgroundColor: `${event.color}14` }]}>
        <Ionicons name={event.icon} size={22} color={event.color} />
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {booking.title}
          </Text>
          <StatusBadge label={status.label} color={status.color} subtle />
        </View>
        <Text style={styles.client} numberOfLines={1}>
          {booking.clients?.full_name ?? "Unknown client"}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color={palette.onSurfaceVariant} />
          <Text style={styles.metaText}>{formatDate(booking.booking_date)}</Text>
          {booking.total_amount != null ? (
            <>
              <View style={styles.dot} />
              <Ionicons name="cash-outline" size={13} color={palette.onSurfaceVariant} />
              <Text style={styles.metaText}>{formatMoney(booking.total_amount, currency)}</Text>
            </>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={palette.outline} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pressed: { opacity: 0.7 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 2 },
  topRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { fontSize: 15, fontWeight: "700", color: palette.onBackground, flexShrink: 1 },
  client: { fontSize: 13, color: palette.onSurfaceVariant },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  metaText: { fontSize: 12, color: palette.onSurfaceVariant },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: palette.outline, marginHorizontal: 4 },
});
