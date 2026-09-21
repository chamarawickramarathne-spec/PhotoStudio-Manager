import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router, usePathname } from "@/navigation/router";

import { palette, radius, spacing } from "@/theme";
import type { IconName } from "@/lib/icons";

const NAV_ITEMS: {
  route: "/" | "/bookings" | "/clients" | "/payments";
  label: string;
  icon: IconName;
  activeIcon: IconName;
}[] = [
  { route: "/", label: "Dashboard", icon: "home-outline", activeIcon: "home" },
  { route: "/bookings", label: "Bookings", icon: "calendar-outline", activeIcon: "calendar" },
  { route: "/clients", label: "Clients", icon: "people-outline", activeIcon: "people" },
  { route: "/payments", label: "Payments", icon: "wallet-outline", activeIcon: "wallet" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Ionicons name="camera" size={18} color={palette.white} />
        </View>
        <View style={styles.brandText}>
          <Text style={styles.brandTitle}>PhotoStudio</Text>
          <Text style={styles.brandSub}>Manager</Text>
        </View>
      </View>

      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.route;
          return (
            <Pressable
              key={item.route}
              onPress={() => router.push(item.route)}
              style={({ pressed }) => [styles.navItem, active && styles.navItemActive, pressed && styles.pressed]}
            >
              <Ionicons name={active ? item.activeIcon : item.icon} size={18} color={active ? palette.primary : palette.onSurfaceVariant} />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>PhotoStudio Manager</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 220,
    backgroundColor: palette.surface,
    borderRightWidth: 1,
    borderRightColor: palette.outlineVariant,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.sm, marginBottom: spacing.xl },
  logo: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.primary,
  },
  brandText: { flex: 1 },
  brandTitle: { fontSize: 15, fontWeight: "800", color: palette.onBackground, lineHeight: 17 },
  brandSub: { fontSize: 11, fontWeight: "600", color: palette.onSurfaceVariant, letterSpacing: 1, textTransform: "uppercase" },
  nav: { flex: 1, gap: spacing.xs },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  navItemActive: { backgroundColor: `${palette.primary}14` },
  navLabel: { fontSize: 13, fontWeight: "600", color: palette.onSurfaceVariant },
  navLabelActive: { color: palette.primary, fontWeight: "800" },
  pressed: { opacity: 0.7 },
  footer: { paddingHorizontal: spacing.sm, paddingTop: spacing.lg },
  footerText: { fontSize: 10, color: palette.disabled, textAlign: "center" },
});