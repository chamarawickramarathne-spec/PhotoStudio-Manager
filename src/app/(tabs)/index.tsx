import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "@/navigation/router";

import { Screen } from "@/components/ui/Screen";
import { SummaryTile } from "@/components/ui/SummaryTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RevenueChart } from "@/components/ui/RevenueChart";
import { HeroHeader } from "@/components/dashboard/HeroHeader";
import { PaymentsList, buildPaymentsDue } from "@/components/dashboard/PaymentsList";
import { useDashboard, type DashboardStats } from "@/hooks/queries/dashboard";
import { useAuth } from "@/hooks/useAuth";
import { useDesktopUpdater } from "@/hooks/useDesktopUpdater";
import { useProfileAvatar } from "@/hooks/useProfileAvatar";
import { BOOKING_STATUS_MAP, EVENT_TYPE_MAP, type EventTypeInfo } from "@/lib/constants";
import type { IconName } from "@/lib/icons";
import { APP_VERSION } from "@/lib/version";
import { formatDate, formatMoney } from "@/lib/format";
import { palette, radius, spacing } from "@/theme";

export default function DashboardTab() {
  const { data: stats, isLoading, isRefetching, refetch } = useDashboard();
  const { profile, currency, signOut } = useAuth();
  const { isDesktop, getVersion, checkForUpdates } = useDesktopUpdater();
  const { width } = useWindowDimensions();
  const [desktopVersion, setDesktopVersion] = useState("");
  const [signOutOpen, setSignOutOpen] = useState(false);
  const isWide = width >= 700;

  useEffect(() => {
    let mounted = true;
    if (!isDesktop) return;
    getVersion()
      .then((v) => {
        if (mounted) setDesktopVersion(v);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [isDesktop, getVersion]);

  const version = desktopVersion || APP_VERSION || "";
  const todayLabel = formatDate(new Date(), "EEE, MMM d");

  const avatar = useProfileAvatar();

  const heroContext = [
    stats?.todayCount ? `${stats.todayCount} shoot${stats.todayCount === 1 ? "" : "s"} today` : "",
    stats?.overdueCount ? `${stats.overdueCount} payment${stats.overdueCount === 1 ? "" : "s"} overdue` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const { overdue, pending } = buildPaymentsDue(stats?.recentSchedules ?? []);

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={palette.primary} />
      }
    >
      <HeroHeader
        name={profile?.full_name?.split(" ")[0] ?? "Photographer"}
        version={version}
        context={heroContext}
        dateLabel={todayLabel}
        avatarUri={avatar}
        onSignOut={() => setSignOutOpen(true)}
        onCheckUpdates={isDesktop ? () => void checkForUpdates() : undefined}
      />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : !stats ? (
        <EmptyState icon="cloud-offline-outline" title="Could not load dashboard" />
      ) : (
        <>
          {isWide ? (
            <View style={styles.statsRow}>
              <SummaryTile label="Total Bookings" value={String(stats.totalBookings)} color={palette.primary} icon="calendar" trend={stats.bookingsTrend} />
              <SummaryTile label="Active Bookings" value={String(stats.activeBookings)} color={palette.tertiary} icon="camera" />
              <SummaryTile label="Active Clients" value={String(stats.totalClients)} color={palette.info} icon="people" trend={stats.clientsTrend} />
              <SummaryTile label="Monthly Revenue" value={formatMoney(stats.monthlyRevenue, currency)} color={palette.gold} icon="wallet" trend={stats.revenueTrend} />
              <SummaryTile label="Outstanding" value={formatMoney(stats.outstanding, currency)} color={palette.warning} icon="time" />
            </View>
          ) : (
            <>
              <View style={styles.statsRow}>
                <SummaryTile label="Total Bookings" value={String(stats.totalBookings)} color={palette.primary} icon="calendar" trend={stats.bookingsTrend} />
                <SummaryTile label="Active Bookings" value={String(stats.activeBookings)} color={palette.tertiary} icon="camera" />
              </View>

              <View style={styles.statsRow}>
                <SummaryTile label="Active Clients" value={String(stats.totalClients)} color={palette.info} icon="people" trend={stats.clientsTrend} />
                <SummaryTile label="Monthly Revenue" value={formatMoney(stats.monthlyRevenue, currency)} color={palette.gold} icon="wallet" trend={stats.revenueTrend} />
              </View>

              <View style={styles.statsRow}>
                <SummaryTile label="Outstanding" value={formatMoney(stats.outstanding, currency)} color={palette.warning} icon="time" />
              </View>
            </>
          )}

          <View style={styles.actions}>
            <ActionPill icon="calendar" label="New Booking" color={palette.primary} onPress={() => router.push("/booking/new")} />
            <ActionPill icon="person-add" label="Add Client" color={palette.info} onPress={() => router.push("/client/new")} />
            <ActionPill icon="card" label="New Payment" color={palette.success} onPress={() => router.push("/payment/new")} />
          </View>

          <RevenueChart series={stats.revenueSeries} currency={currency} />

          <Text style={styles.sectionTitle}>Next Shoots</Text>
          <UpcomingStrip bookings={stats.upcomingBookings} />

          <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
            Payments Due{overdue.length + pending.length ? ` (${overdue.length + pending.length})` : ""}
          </Text>
          <PaymentsList overdue={overdue} pending={pending} currency={currency} />
        </>
      )}

      <ConfirmDialog
        visible={signOutOpen}
        title="Sign Out?"
        message="You will need your password to sign back in."
        confirmLabel="Sign Out"
        onCancel={() => setSignOutOpen(false)}
        onConfirm={() => void signOut()}
      />
    </Screen>
  );
}

function ActionPill({
  icon,
  label,
  color,
  onPress,
}: {
  icon: IconName;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.pill, pressed && styles.pressed]} onPress={onPress}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={styles.pillLabel}>{label}</Text>
    </Pressable>
  );
}

function UpcomingStrip({ bookings }: { bookings: DashboardStats["upcomingBookings"] }) {
  if (bookings.length === 0) {
    return (
      <EmptyState
        icon="calendar-outline"
        title="No upcoming bookings"
        message="Upcoming shoots will appear here."
        actionLabel="New Booking"
        onAction={() => router.push("/booking/new")}
      />
    );
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
      {bookings.map((b) => {
        const event = EVENT_TYPE_MAP[b.event_type] ?? EVENT_TYPE_MAP.Other;
        const status = BOOKING_STATUS_MAP[b.status];
        return (
          <Pressable
            key={b.id}
            style={({ pressed }) => [styles.shootCard, pressed && styles.pressed]}
            onPress={() => router.push(`/booking/${b.id}`)}
          >
            <View style={styles.shootDate}>
              <Text style={styles.shootDateDay}>{formatDate(b.booking_date, "dd")}</Text>
              <Text style={styles.shootDateMonth}>{formatDate(b.booking_date, "MMM")}</Text>
            </View>
            <View style={styles.shootBody}>
              <Text style={styles.shootTitle} numberOfLines={1}>
                {b.title}
              </Text>
              <Text style={styles.shootMeta} numberOfLines={1}>
                {b.clients?.full_name ?? "Unknown client"}
              </Text>
              <View style={styles.shootMetaRow}>
                <EventDot event={event} />
                {status ? <StatusBadge label={status.label} color={status.color} subtle /> : null}
              </View>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function EventDot({ event }: { event: EventTypeInfo }) {
  return (
    <View style={[styles.eventDot, { backgroundColor: `${event.color}14` }]}>
      <Ionicons name={event.icon} size={12} color={event.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 64, alignItems: "center" },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.xl },
  pill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: palette.surface,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
  },
  pillLabel: { fontSize: 12, fontWeight: "700", color: palette.onBackground },
  pressed: { opacity: 0.7 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: palette.onBackground, marginBottom: spacing.md },
  sectionTitleSpaced: { marginTop: spacing.xl },
  strip: { gap: spacing.md, paddingHorizontal: 1, paddingBottom: spacing.md },
  shootCard: {
    width: 220,
    flexDirection: "row",
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
  shootDate: { alignItems: "center", justifyContent: "center", width: 46 },
  shootDateDay: { fontSize: 20, fontWeight: "800", color: palette.secondary },
  shootDateMonth: { fontSize: 11, fontWeight: "700", color: palette.onSurfaceVariant, textTransform: "uppercase" },
  shootBody: { flex: 1, gap: 2 },
  shootTitle: { fontSize: 14, fontWeight: "700", color: palette.onBackground },
  shootMeta: { fontSize: 12, color: palette.onSurfaceVariant },
  shootMetaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: 2 },
  eventDot: { width: 22, height: 22, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
});