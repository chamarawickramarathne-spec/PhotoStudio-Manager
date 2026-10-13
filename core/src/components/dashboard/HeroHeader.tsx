import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "@/navigation/router";

import { palette, radius, spacing } from "@/theme";

interface HeroHeaderProps {
  name: string;
  version: string;
  context: string;
  dateLabel: string;
  avatarUri?: string | null;
  onSignOut: () => void;
  onCheckUpdates?: () => void;
}

export function HeroHeader({ name, version, context, dateLabel, avatarUri, onSignOut, onCheckUpdates }: HeroHeaderProps) {
  return (
    <View style={styles.hero}>
      <View style={styles.actions}>
        {onCheckUpdates ? (
          <Pressable style={[styles.iconBtn, styles.updateBtn]} onPress={onCheckUpdates} hitSlop={8}>
            <Ionicons name="cloud-download-outline" size={18} color={palette.secondary} />
          </Pressable>
        ) : null}
        <Pressable style={[styles.iconBtn, styles.signOutBtn]} onPress={onSignOut} hitSlop={8}>
          <Ionicons name="log-out-outline" size={18} color={palette.danger} />
        </Pressable>
        <Pressable style={styles.avatarBtn} onPress={() => router.push("/profile")} hitSlop={8}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Ionicons name="person" size={20} color={palette.primary} />
          )}
        </Pressable>
      </View>
      <Text style={styles.greeting}>Hello, {name}</Text>
      <Text style={styles.metaLine}>
        {dateLabel}
        {context ? ` · ${context}` : ""}
      </Text>
      <View style={styles.heroFooter}>
        <View style={styles.goldHairline} />
        <View style={styles.versionPill}>
          <Text style={styles.versionText}>v{version}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: palette.backgroundGold,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  actions: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.surface,
  },
  updateBtn: { borderWidth: 1, borderColor: palette.outlineVariant },
  signOutBtn: { borderWidth: 1, borderColor: `${palette.danger}33` },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.surface,
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  greeting: { fontSize: 26, fontWeight: "800", color: palette.onBackground, marginRight: 128 },
  metaLine: { fontSize: 13, color: palette.onSurfaceVariant, marginTop: 4 },
  heroFooter: { flexDirection: "row", alignItems: "center", marginTop: spacing.md },
  goldHairline: { flex: 1, height: 2, borderRadius: 1, backgroundColor: palette.gold },
  versionPill: {
    marginLeft: spacing.sm,
    backgroundColor: palette.gold,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
  },
  versionText: { color: palette.white, fontSize: 11, fontWeight: "800" },
});