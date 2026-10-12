import { useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

import { palette, radius, spacing } from "@/theme";
import { BOOKING_STATUS_MAP, BOOKING_STATUSES, EVENT_TYPE_MAP } from "@/lib/constants";
import type { BookingStatus } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";
import type { BookingWithClient } from "@/hooks/queries/bookings";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface Anchor {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface BookingCardProps {
  booking: BookingWithClient;
  currency: string;
  onPress: () => void;
  onStatusChange?: (status: BookingStatus) => void;
}

export function BookingCard({ booking, currency, onPress, onStatusChange }: BookingCardProps) {
  const event = EVENT_TYPE_MAP[booking.event_type] ?? EVENT_TYPE_MAP.Other;
  const current = BOOKING_STATUS_MAP[booking.status] ?? { label: booking.status, color: "#6B7280" };
  const statuses = BOOKING_STATUSES as { value: BookingStatus; label: string; color: string; icon: string }[];

  const [menuOpen, setMenuOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const badgeRef = useRef<View>(null);

  const openMenu = () => {
    badgeRef.current?.measureInWindow((x, y, w, h) => {
      setAnchor({ x, y, w, h });
      setMenuOpen(true);
    });
  };

  const selectStatus = (status: BookingStatus) => {
    setMenuOpen(false);
    onStatusChange?.(status);
  };

  return (
    <View style={styles.card}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.main, pressed && styles.pressed]}>
        <View style={[styles.iconWrap, { backgroundColor: `${event.color}14` }]}>
          <Ionicons name={event.icon} size={22} color={event.color} />
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {booking.title}
          </Text>
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

      <Pressable
        ref={badgeRef}
        onPress={openMenu}
        style={styles.badgeWrap}
        accessibilityRole="button"
        accessibilityLabel={`Change status (currently ${current.label})`}
      >
        <StatusBadge label={current.label} color={current.color} />
        <Ionicons name="chevron-down" size={12} color={current.color} />
      </Pressable>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)} />
        {anchor ? (
          <View
            style={[
              styles.panel,
              {
                left: Math.max(anchor.x, 8),
                top: anchor.y + anchor.h + 4,
                width: Math.min(Math.max(anchor.w, 190), 260),
              },
            ]}
          >
            <ScrollView keyboardShouldPersistTaps="handled" style={styles.panelScroll} nestedScrollEnabled>
              {statuses.map((s) => {
                const isSelected = booking.status === s.value;
                return (
                  <Pressable
                    key={s.value}
                    style={[styles.item, isSelected ? styles.itemSelected : null]}
                    onPress={() => selectStatus(s.value)}
                  >
                    <Ionicons
                      name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                      size={17}
                      color={isSelected ? s.color : palette.outline}
                    />
                    <Text style={[styles.itemLabel, isSelected ? styles.itemLabelSelected : null]}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  main: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  pressed: { opacity: 0.7 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: "700", color: palette.onBackground, flexShrink: 1 },
  client: { fontSize: 13, color: palette.onSurfaceVariant },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  metaText: { fontSize: 12, color: palette.onSurfaceVariant },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: palette.outline, marginHorizontal: 4 },
  badgeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
    paddingVertical: 2,
  },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  panel: {
    position: "absolute",
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.outline,
    maxHeight: 260,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    overflow: "hidden",
  },
  panelScroll: { maxHeight: 260 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  itemSelected: { backgroundColor: palette.secondaryContainer },
  itemLabel: { flex: 1, fontSize: 14, color: palette.onSurface },
  itemLabelSelected: { fontWeight: "700", color: palette.onSecondaryContainer },
});