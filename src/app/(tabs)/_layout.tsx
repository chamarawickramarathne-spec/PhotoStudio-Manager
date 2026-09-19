import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { palette } from "@/theme";

const ICONS: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  index: ["home", "home-outline"],
  bookings: ["calendar", "calendar-outline"],
  clients: ["people", "people-outline"],
  payments: ["wallet", "wallet-outline"],
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.onSurfaceVariant,
        tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.outlineVariant },
        tabBarLabelStyle: { fontWeight: "600", fontSize: 11 },
      }}
    >
      {Object.entries(ICONS).map(([name, icons]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? icons[0] : icons[1]} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
