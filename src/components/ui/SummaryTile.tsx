import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ProgressBar as PaperProgressBar } from "react-native-paper";

import { palette, radius, spacing } from "@/theme";

interface SummaryTileProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export function SummaryTile({ label, value, icon, color }: SummaryTileProps) {
  return (
    <View style={[styles.tile, { borderTopColor: color }]}>
      <Ionicons name={icon} size={18} color={color} />
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
