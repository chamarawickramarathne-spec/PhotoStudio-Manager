import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { palette, radius, spacing } from "@/theme";

interface FormSectionProps {
  title?: string;
  children: ReactNode;
}

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <View style={styles.box}>
      {title ? (
        <View style={styles.titleRow}>
          <View style={styles.accent} />
          <Text style={styles.title}>{title}</Text>
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  accent: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: palette.gold,
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});