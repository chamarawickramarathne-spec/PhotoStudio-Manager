import { StyleSheet, Text, View } from "react-native";

import { palette } from "@/theme";
import { initials } from "@/lib/utils";

const AVATAR_COLORS = ["#2563EB", "#B45309", "#0F766E", "#7C3AED", "#DB2777", "#4F46E5"];

export function AppAvatar({
  name,
  size = 44,
}: {
  name: string | null | undefined;
  size?: number;
}) {
  const colorIndex = (name || "").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % AVATAR_COLORS.length;

  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: AVATAR_COLORS[colorIndex] },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: palette.white,
    fontWeight: "700",
  },
});
