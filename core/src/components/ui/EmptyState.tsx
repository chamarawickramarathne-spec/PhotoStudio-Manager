import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Button } from "react-native-paper";

import { palette, spacing } from "@/theme";
import type { IconName } from "@/lib/icons";

interface EmptyStateProps {
  icon: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={40} color={palette.disabled} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Button mode="contained" onPress={onAction} style={styles.button} labelStyle={styles.buttonLabel}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: palette.surfaceVariant,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: palette.onBackground,
    textAlign: "center",
  },
  message: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: palette.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
  },
  button: {
    marginTop: spacing.xl,
    borderRadius: 999,
  },
  buttonLabel: { paddingHorizontal: 8 },
});
