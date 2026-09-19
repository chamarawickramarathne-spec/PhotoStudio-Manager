import { useMemo } from "react";
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { Screen } from "@/components/ui/Screen";
import { SummaryTile } from "@/components/ui/SummaryTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDashboard } from "@/hooks/queries/dashboard";
import { useAuth } from "@/hooks/useAuth";
import { BOOKING_STATUS_MAP, EVENT_TYPE_MAP } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";
import { palette, radius, spacing } from "@/theme";

export default function DashboardTab() {
  const { data: stats, isLoading, isRefetching, refetch } = useDashboard();
  const { profile } = useAuth();

  const upcoming = useMemo(() => {
    if (!stats) return [];
    return stats.recentBookings
      .filter((b) => b.booking_date && !["completed", "cancelled"].includes(b.status))
      .sort((a, b) => (a.booking_date! < b.booking_date! ? -1 : 1))
      .slice(0, 5);
  }, [stats]);

  const today = new Date().toDateString();

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={palette.primary} />}
    >
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Hello, {profile?.full_name?.split(" ")[0] ?? "Photographer"}</Text>
            <Text style={styles.date}>{today}</Text>
          </View>
          <Pressable style={styles.avatarBtn} onPress={() => router.push("/profile")}>
            <Ionicons name="person" size={20} color={palette.primary} />
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : !stats ? (
        <EmptyState icon="cloud-offline-outline" title="Could not load dashboard" />
      ) : (
        <>
          <View style={styles.statsRow}>
            <SummaryTile label="Clients" value={String(stats.totalClients)} color={palette.primary} icon="people" />
            <SummaryTile label="Active" value={String(stats.activeBookings)} color={palette.info} icon="calendar" />
          </View>

          <View style={styles.statsRow}>
            <SummaryTile label="Today" value={String(stats.todayBookings)} color={palette.secondary} icon="today" />
            <SummaryTile label="Collected" value={formatMoney(stats.totalCollected)} color={palette.success} icon="wallet" />
          </View>

          <View style={styles.statsRow}>
            <SummaryTile label="Outstanding" value={formatMoney(stats.totalPending)} color={palette.warning} icon="time" />
            <SummaryTile label="Overdue" value={String(stats.overdueCount)} color={palette.danger} icon="warning" />
          </View>

          <QuickActions />

          <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
          {upcoming.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="Nothing scheduled"
              message="Create a booking to see it here."
              actionLabel="New Booking"
              onAction={() => router.push("/booking/new")}
            />
          ) : (
            <View style={styles.list}>
              {upcoming.map((booking) => {
                const event = EVENT_TYPE_MAP[booking.event_type] ?? EVENT_TYPE_MAP.Other;
                const status = BOOKING_STATUS_MAP[booking.status];
                return (
                  <Pressable
                    key={booking.id}
                    style={({ pressed }) => [styles.bookingCard, pressed && styles.pressed]}
                    onPress={() => router.push(`/booking/${booking.id}`)}
                  >
                    <View style={[styles.bookingIcon, { backgroundColor: `${event.color}14` }]}>
                      <Ionicons name={event.icon} size={18} color={event.color} />
                    </View>
                    <View style={styles.bookingBody}>
                      <Text style={styles.bookingTitle} numberOfLines={1}>
                        {booking.title}
                      </Text>
                      <Text style={styles.bookingMeta} numberOfLines={1}>
                        {booking.clients?.full_name ?? "Unknown client"} · {formatDate(booking.booking_date)}
                      </Text>
                    </View>
                    {status ? <StatusBadge label={status.label} color={status.color} subtle /> : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

function QuickActions() {
  return (
    <View style={styles.actions}>
      <QuickAction
        icon="calendar"
        label="New Booking"
        color={palette.primary}
        onPress={() => router.push("/booking/new")}
      />
      <QuickAction
        icon="person-add"
        label="Add Client"
        color={palette.info}
        onPress={() => router.push("/client/new")}
      />
      <QuickAction
        icon="card"
        label="New Payment"
        color={palette.success}
        onPress={() => router.push("/payment/new")}
      />
    </View>
  );
}

function QuickAction({
  icon,
  label,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.action, pressed && styles.pressed]} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: `${color}14` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.lg },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerText: { flex: 1 },
  greeting: { fontSize: 26, fontWeight: "800", color: palette.onBackground },
  date: { fontSize: 14, color: palette.onSurfaceVariant, marginTop: 2 },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.surface,
  },
  center: { paddingVertical: 64, alignItems: "center" },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  actions: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.xl },
  action: { flex: 1, alignItems: "center", gap: spacing.sm, backgroundColor: palette.surface, borderRadius: radius.md, padding: spacing.lg },
  actionIcon: { width: 44, height: 44, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 12, fontWeight: "700", color: palette.onBackground },
  pressed: { opacity: 0.7 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: palette.onBackground, marginBottom: spacing.md },
  list: { gap: spacing.md },
  bookingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  bookingIcon: { width: 40, height: 40, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  bookingBody: { flex: 1, gap: 2 },
  bookingTitle: { fontSize: 14, fontWeight: "700", color: palette.onBackground },
  bookingMeta: { fontSize: 12, color: palette.onSurfaceVariant },
});
