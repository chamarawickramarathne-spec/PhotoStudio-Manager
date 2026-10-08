import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

import { Screen } from "@/components/ui/Screen";
import { EmptyState } from "@/components/ui/EmptyState";
import { RevenueChart } from "@/components/ui/RevenueChart";
import { SummaryTile } from "@/components/ui/SummaryTile";
import { useReports } from "@/hooks/queries/reports";
import { useAuth } from "@/hooks/useAuth";
import {
  BOOKING_STATUS_MAP,
  EVENT_TYPE_MAP,
  PAYMENT_METHODS,
  type EventType,
} from "@/lib/constants";
import type { IconName } from "@/lib/icons";
import { formatMoney, formatMoneyCompact } from "@/lib/format";
import { palette, radius, spacing } from "@/theme";

export default function ReportsTab() {
  const { data, isLoading, isRefetching, refetch } = useReports();
  const { currency } = useAuth();

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={palette.primary} />
        </View>
      </Screen>
    );
  }
  if (!data) {
    return (
      <Screen>
        <EmptyState icon="cloud-offline-outline" title="Could not load reports" />
      </Screen>
    );
  }

  const maxEvent = Math.max(...data.eventRevenue.map((r) => r.amount), 1);
  const maxMethod = Math.max(...data.methods.map((r) => r.amount), 1);
  const maxClient = Math.max(...data.topClients.map((r) => r.amount), 1);

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={palette.primary} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Reports</Text>
        <Text style={styles.subtitle}>Revenue, collections and clients at a glance</Text>
      </View>

      <RevenueChart series={data.revenueSeries} currency={currency} />

      <View style={styles.tileRow}>
        <SummaryTile label="Collected" value={formatMoney(data.collected, currency)} color={palette.success} icon="checkmark-circle" />
        <SummaryTile label="Outstanding" value={formatMoney(data.outstanding, currency)} color={palette.warning} icon="time" />
      </View>
      <View style={styles.tileRow}>
        <SummaryTile label="Overdue" value={String(data.overdueCount)} color={palette.danger} icon="warning" />
        <SummaryTile label="Deposits collected" value={formatMoneyCompact(data.depositCollected, currency)} color={palette.info} icon="shield-checkmark" />
      </View>

      <ReportCard title="Revenue by type">
        {data.eventRevenue.length === 0 ? (
          <Text style={styles.empty}>No revenue recorded yet.</Text>
        ) : (
          data.eventRevenue.map((r) => {
            const info = EVENT_TYPE_MAP[r.eventType as EventType] ?? EVENT_TYPE_MAP.Other;
            return (
              <BarRow
                key={r.eventType}
                label={info.label}
                value={formatMoney(r.amount, currency)}
                pct={r.amount / maxEvent}
                color={info.color}
                icon={info.icon}
              />
            );
          })
        )}
      </ReportCard>

      <ReportCard title="Payment methods">
        {data.methods.length === 0 ? (
          <Text style={styles.empty}>No payment methods recorded yet.</Text>
        ) : (
          data.methods.map((r) => {
            const info = PAYMENT_METHODS.find((m) => m.value === r.method);
            return (
              <BarRow
                key={r.method}
                label={info?.label ?? "Other"}
                value={formatMoney(r.amount, currency)}
                pct={r.amount / maxMethod}
                color={palette.primary}
                icon={info?.icon ?? "ellipsis-horizontal"}
              />
            );
          })
        )}
      </ReportCard>

      <ReportCard title="Top clients">
        {data.topClients.length === 0 ? (
          <Text style={styles.empty}>No client payments yet.</Text>
        ) : (
          data.topClients.map((r, idx) => (
            <BarRow
              key={r.name}
              label={`${idx + 1}. ${r.name}`}
              value={formatMoney(r.amount, currency)}
              pct={r.amount / maxClient}
              color={palette.secondary}
              icon="person"
            />
          ))
        )}
      </ReportCard>

      <ReportCard title="Bookings pipeline">
        {data.totalBookings === 0 ? (
          <Text style={styles.empty}>No bookings yet.</Text>
        ) : (
          data.pipeline.map((r) => {
            const info = BOOKING_STATUS_MAP[r.status] ?? BOOKING_STATUS_MAP.pending;
            return (
              <BarRow
                key={r.status}
                label={info.label}
                value={String(r.count)}
                pct={r.count / data.totalBookings}
                color={info.color}
                icon={info.icon}
              />
            );
          })
        )}
      </ReportCard>
    </Screen>
  );
}

function ReportCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function BarRow({
  label,
  value,
  pct,
  color,
  icon,
}: {
  label: string;
  value: string;
  pct: number;
  color: string;
  icon?: IconName;
}) {
  const width = `${Math.round(Math.min(pct, 1) * 100)}%` as `${number}%`;
  return (
    <View style={styles.barRow}>
      <View style={styles.barTop}>
        {icon ? <Ionicons name={icon} size={14} color={color} style={styles.barIcon} /> : null}
        <Text style={styles.barLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.barValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 64, alignItems: "center" },
  header: { marginBottom: spacing.lg },
  greeting: { fontSize: 26, fontWeight: "800", color: palette.onBackground },
  subtitle: { fontSize: 14, color: palette.onSurfaceVariant, marginTop: 2 },
  tileRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: "800", color: palette.onBackground, marginBottom: spacing.sm },
  barRow: { gap: spacing.xs, paddingVertical: spacing.xs },
  barTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  barIcon: { marginRight: 0 },
  barLabel: { flex: 1, fontSize: 13, color: palette.onSurface, fontWeight: "600" },
  barValue: { fontSize: 13, fontWeight: "700", color: palette.onSurfaceVariant },
  barTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceVariant,
    overflow: "hidden",
  },
  barFill: { height: 6, borderRadius: radius.pill },
  empty: { fontSize: 13, color: palette.onSurfaceVariant, paddingVertical: spacing.sm },
});