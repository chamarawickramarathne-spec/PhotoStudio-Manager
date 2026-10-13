import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { palette, radius, spacing } from "@/theme";

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.hairline} />
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  hairline: { height: 4, backgroundColor: palette.primary },
  body: { padding: spacing.xl, gap: spacing.lg },
});