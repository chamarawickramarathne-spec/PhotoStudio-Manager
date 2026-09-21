import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

import { palette, radius, spacing } from "@/theme";
import { CLIENT_STATUS_COLOR } from "@/lib/constants";
import type { ClientRow } from "@/hooks/queries/clients";
import { AppAvatar } from "@/components/ui/AppAvatar";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface ClientCardProps {
  client: ClientRow;
  onPress: () => void;
}

export function ClientCard({ client, onPress }: ClientCardProps) {
  const statusColor = CLIENT_STATUS_COLOR[client.status] ?? "#6B7280";
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <AppAvatar name={client.full_name} size={46} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {client.full_name}
          </Text>
          {client.status !== "active" && (
            <StatusBadge label={client.status} color={statusColor} subtle />
          )}
        </View>
        {client.phone ? (
          <View style={styles.metaRow}>
            <Ionicons name="call-outline" size={13} color={palette.onSurfaceVariant} />
            <Text style={styles.metaText}>{client.phone}</Text>
          </View>
        ) : null}
        {client.email ? (
          <View style={styles.metaRow}>
            <Ionicons name="mail-outline" size={13} color={palette.onSurfaceVariant} />
            <Text style={styles.metaText} numberOfLines={1}>
              {client.email}
            </Text>
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={palette.outline} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pressed: { opacity: 0.7 },
  body: { flex: 1, gap: 3 },
  topRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  name: { fontSize: 15, fontWeight: "700", color: palette.onBackground, flexShrink: 1 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13, color: palette.onSurfaceVariant },
});
