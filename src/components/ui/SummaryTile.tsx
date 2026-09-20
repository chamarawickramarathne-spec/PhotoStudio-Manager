import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ProgressBar as PaperProgressBar } from "react-native-paper";

import { palette, radius, spacing } from "@/theme";

interface SummaryTileProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  trend?: number;
}

export function SummaryTile({ label, value, icon, color, trend }: SummaryTileProps) {
  const up = (trend ?? 0) > 0;
  const down = (trend ?? 0) < 0;
  const trendColor =
    trend === undefined ? palette.onSurfaceVariant : up ? palette.success : down ? palette.danger : palette.disabled;
  const badge =
    trend === undefined ? null : (
      <View style={[styles.trendBadge, { backgroundColor: `${trendColor}1A` }]}>
        <Ionicons
          name={up ? "arrow-up" : down ? "arrow-down" : "remove"}
          size={10}
          color={trendColor}
        />
        <Text style={[styles.trendText, { color: trendColor }]}>{Math.abs(trend)}%</Text>
      </View>
    );

  return (
    <View style={[styles.tile, { borderTopColor: color }]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconChip, { backgroundColor: `${color}14` }]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        {badge}
      </View>
      <Text
        style={[styles.value, { color }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

interface PaymentProgressProps {
  amount: number;
  paid: number;
}

export function PaymentProgress({ amount, paid }: PaymentProgressProps) {
  const pct = amount > 0 ? Math.min(paid / amount, 1) : 0;
  const remaining = Math.max(amount - paid, 0);
  return (
    <View>
      <PaperProgressBar
        progress={pct}
        color={pct >= 1 ? palette.success : palette.secondary}
        style={styles.progress}
      />
      <Text style={styles.progressLabel}>
        {remaining > 0 ? `${(pct * 100).toFixed(0)}% paid · ${remaining.toLocaleString()} remaining` : "Fully paid"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderTopWidth: 3,
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
    gap: spacing.sm,
  },
  iconChip: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  trendText: { fontSize: 10, fontWeight: "800" },
  value: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: spacing.sm,
  },
  label: {
    fontSize: 12,
    color: palette.onSurfaceVariant,
    marginTop: 2,
  },
  progress: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceVariant,
    marginTop: spacing.md,
  },
  progressLabel: {
    fontSize: 12,
    color: palette.onSurfaceVariant,
    marginTop: spacing.xs,
  },
});