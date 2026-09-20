import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Chip } from "react-native-paper";

import type { RevenueBucket } from "@/hooks/queries/dashboard";
import { REVENUE_RANGES } from "@/lib/constants";
import { formatMoneyCompact } from "@/lib/format";
import { palette, radius, spacing } from "@/theme";

interface RevenueChartProps {
  series: RevenueBucket[];
  currency: string;
}

const BAR_AREA_HEIGHT = 128;
const BAR_LABEL_HEIGHT = 18;
const MIN_BAR = 3;

export function RevenueChart({ series, currency }: RevenueChartProps) {
  const [rangeKey, setRangeKey] = useState(REVENUE_RANGES[0].key);
  const range = REVENUE_RANGES.find((r) => r.key === rangeKey) ?? REVENUE_RANGES[0];

  const shown = series.slice(-range.months);
  const total = shown.reduce((sum, b) => sum + b.amount, 0);
  const max = Math.max(...shown.map((b) => b.amount), 1);
  const hasRevenue = shown.some((b) => b.amount > 0);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>Revenue</Text>
        <Text
          style={styles.total}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {formatMoneyCompact(total, currency)}
        </Text>
      </View>

      <View style={styles.chips}>
        {REVENUE_RANGES.map((r) => (
          <Chip
            key={r.key}
            compact
            selected={r.key === range.key}
            onPress={() => setRangeKey(r.key)}
            style={styles.chip}
            textStyle={styles.chipLabel}
          >
            {r.label}
          </Chip>
        ))}
      </View>

      {!hasRevenue ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No payments yet</Text>
          <Text style={styles.emptyMessage}>
            Your revenue appears here once you record payments.
          </Text>
        </View>
      ) : (
        <View style={styles.chart}>
          {shown.map((bucket, idx) => {
            const isLatest = idx === shown.length - 1;
            const hasAmount = bucket.amount > 0;
            const height = hasAmount
              ? Math.max((bucket.amount / max) * BAR_AREA_HEIGHT, MIN_BAR)
              : 2;
            const barColor = !hasAmount
              ? palette.surfaceVariant
              : isLatest
                ? palette.primary
                : `${palette.primary}59`;
            return (
              <View key={bucket.key} style={styles.barCol}>
                <View style={styles.barArea}>
                  <View style={[styles.bar, { height, backgroundColor: barColor }]} />
                </View>
                <Text
                  style={[
                    styles.barLabel,
                    { color: isLatest ? palette.onBackground : palette.onSurfaceVariant },
                  ]}
                >
                  {bucket.label}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: palette.onBackground },
  total: { flex: 1, fontSize: 20, fontWeight: "800", color: palette.secondary, textAlign: "right" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  chip: { height: 32 },
  chipLabel: { fontSize: 12 },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    marginTop: spacing.lg,
  },
  barCol: { flex: 1, alignItems: "center" },
  barArea: {
    height: BAR_AREA_HEIGHT,
    width: "100%",
    justifyContent: "flex-end",
    borderRadius: radius.sm,
  },
  bar: {
    width: "100%",
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  barLabel: { height: BAR_LABEL_HEIGHT, fontSize: 10, fontWeight: "700", marginTop: 4 },
  empty: {
    paddingVertical: spacing.xl,
    alignItems: "center",
    gap: spacing.xs,
  },
  emptyTitle: { fontSize: 14, fontWeight: "700", color: palette.onBackground },
  emptyMessage: { fontSize: 12, color: palette.onSurfaceVariant, textAlign: "center" },
});