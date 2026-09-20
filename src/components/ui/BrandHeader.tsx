import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { palette, spacing } from "@/theme";

export function BrandHeader({ subtitle = "Your studio in your pocket" }: { subtitle?: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <Ionicons name="camera" size={40} color={palette.white} />
      </View>
      <Text style={styles.title}>PhotoStudio Manager</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.goldLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: palette.onBackground,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: palette.onSurfaceVariant,
  },
  goldLine: {
    width: 44,
    height: 3,
    borderRadius: 2,
    backgroundColor: palette.gold,
    marginTop: spacing.md,
  },
});
