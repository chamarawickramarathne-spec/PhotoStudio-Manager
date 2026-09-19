import { StyleSheet, Text, View } from "react-native";

import { palette } from "@/theme";

interface StatusBadgeProps {
  label: string;
  color: string;
  subtle?: boolean;
}

export function StatusBadge({ label, color, subtle }: StatusBadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: subtle ? `${color}14` : color },
      ]}
    >
      <Text style={[styles.text, { color: subtle ? color : palette.white }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
});
