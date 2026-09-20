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
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ProgressBar as PaperProgressBar } from "react-native-paper";
import Constants from "expo-constants";

import { Screen } from "@/components/ui/Screen";
import { SummaryTile } from "@/components/ui/SummaryTile";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { RevenueChart } from "@/components/ui/RevenueChart";
import { useDashboard, type DashboardStats } from "@/hooks/queries/dashboard";
import { useAuth } from "@/hooks/useAuth";
import { BOOKING_STATUS_MAP, EVENT_TYPE_MAP, type EventTypeInfo } from "@/lib/constants";
import { formatDate, formatMoney, todayISO } from "@/lib/format";
import { getDesktopBridge } from "@/lib/desktop";
import { palette, radius, spacing } from "@/theme";

type DueSchedule = DashboardStats["recentSchedules"][number] & { isOverdue: boolean };

export default function DashboardTab() {
  const { data: stats, isLoading, isRefetching, refetch } = useDashboard();
  const { profile, currency } = useAuth();
  const { width } = useWindowDimensions();
  const [desktopVersion, setDesktopVersion] = useState("");
  const isWide = width >= 700;

  useEffect(() => {
    let mounted = true;
    const bridge = getDesktopBridge();
    if (bridge) {
      bridge
        .getVersion()
        .then((v) => {
          if (mounted) setDesktopVersion(v);
        })
        .catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, []);

  const version = desktopVersion || Constants.expoConfig?.version || "";
  const todayLabel = formatDate(new Date(), "EEE, MMM d");

  const heroContext = [
    stats?.todayCount ? `${stats.todayCount} shoot${stats.todayCount === 1 ? "" : "s"} today` : "",
    stats?.overdueCount ? `${stats.overdueCount} payment${stats.overdueCount === 1 ? "" : "s"} overdue` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const paymentsDue = (stats?.recentSchedules ?? [])
    .filter((s) => s.status !== "paid" && s.status !== "cancelled")
    .map((s) => ({ ...s, isOverdue: s.status === "overdue" || (s.due_date != null && s.due_date < todayISO()) }))
    .sort((a, b) => (a.due_date ?? "") < (b.due_date ?? "") ? -1 : 1);
  const overdue = paymentsDue.filter((s) => s.isOverdue);
  const pending = paymentsDue.filter((s) => !s.isOverdue);

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={palette.primary} />
      }
    >
      <HeroHeader name={profile?.full_name?.split(" ")[0] ?? "Photographer"} version={version} context={heroContext} dateLabel={todayLabel} />

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
              <SummaryTile label="Active Clients" value={String(stats.totalClients)} color={palette.info} icon="people" trend={stats.clientsTrend} />
              <SummaryTile label="Monthly Revenue" value={formatMoney(stats.monthlyRevenue, currency)} color={palette.gold} icon="wallet" trend={stats.revenueTrend} />
              <SummaryTile label="Outstanding" value={formatMoney(stats.outstanding, currency)} color={palette.warning} icon="time" />
            </View>
          ) : (
            <>
              <View style={styles.statsRow}>
                <SummaryTile label="Total Bookings" value={String(stats.totalBookings)} color={palette.primary} icon="calendar" trend={stats.bookingsTrend} />
                <SummaryTile label="Active Clients" value={String(stats.totalClients)} color={palette.info} icon="people" trend={stats.clientsTrend} />
              </View>

              <View style={styles.statsRow}>
                <SummaryTile label="Monthly Revenue" value={formatMoney(stats.monthlyRevenue, currency)} color={palette.gold} icon="wallet" trend={stats.revenueTrend} />
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
            Payments Due{paymentsDue.length ? ` (${paymentsDue.length})` : ""}
          </Text>
          <PaymentsList overdue={overdue} pending={pending} currency={currency} />
        </>
      )}
    </Screen>
  );
}

function HeroHeader({
  name,
  version,
  context,
  dateLabel,
}: {
  name: string;
  version: string;
  context: string;
  dateLabel: string;
}) {
  return (
    <View style={styles.hero}>
      <Pressable style={styles.avatarBtn} onPress={() => router.push("/profile")} hitSlop={8}>
        <Ionicons name="person" size={20} color={palette.primary} />
      </Pressable>
      <Text style={styles.greeting}>Hello, {name}</Text>
      <Text style={styles.metaLine}>
        {dateLabel}
        {context ? ` · ${context}` : ""}
      </Text>
      <View style={styles.heroFooter}>
        <View style={styles.goldHairline} />
        <View style={styles.versionPill}>
          <Text style={styles.versionText}>v{version}</Text>
        </View>
      </View>
    </View>
  );
}

function ActionPill({
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

function PaymentsList({
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
  center: { paddingVertical: 64, alignItems: "center" },
  hero: {
    backgroundColor: palette.backgroundGold,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  avatarBtn: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.surface,
  },
  greeting: { fontSize: 26, fontWeight: "800", color: palette.onBackground, marginRight: 48 },
  metaLine: { fontSize: 13, color: palette.onSurfaceVariant, marginTop: 4 },
  heroFooter: { flexDirection: "row", alignItems: "center", marginTop: spacing.md },
  goldHairline: { flex: 1, height: 2, borderRadius: 1, backgroundColor: palette.gold },
  versionPill: {
    marginLeft: spacing.sm,
    backgroundColor: palette.gold,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
  },
  versionText: { color: palette.white, fontSize: 11, fontWeight: "800" },
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
  paymentTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  paymentIcon: { width: 34, height: 34, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  paymentBody: { flex: 1, gap: 2 },
  paymentTitle: { fontSize: 14, fontWeight: "700", color: palette.onBackground },
  paymentMeta: { fontSize: 12, color: palette.onSurfaceVariant },
  paymentAmount: { fontSize: 14, fontWeight: "800" },
  progress: { height: 6, borderRadius: radius.pill, backgroundColor: palette.surfaceVariant },
});