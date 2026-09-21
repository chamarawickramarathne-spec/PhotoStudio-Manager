import { useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from "react-native";
import { FAB, Searchbar, Text as PaperText } from "react-native-paper";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "@/navigation/router";

import { Screen } from "@/components/ui/Screen";
import { ClientCard } from "@/components/ui/ClientCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useClients } from "@/hooks/queries/clients";
import { palette, radius, spacing } from "@/theme";

export default function ClientsTab() {
  const { data: clients, isLoading, isRefetching, refetch } = useClients();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!clients) return [];
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q),
    );
  }, [clients, query]);

  return (
    <>
      <Screen
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={palette.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Clients</Text>
          <PaperText style={styles.subtitle}>
            {clients?.length ? `${clients.length} client${clients.length > 1 ? "s" : ""} in your directory` : "Manage your client contacts"}
          </PaperText>
        </View>

        <Searchbar
          placeholder="Search name, phone or email"
          value={query}
          onChangeText={setQuery}
          style={styles.search}
          inputStyle={styles.searchInput}
        />

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={palette.primary} />
          </View>
        ) : filtered.length === 0 ? (
          clients && clients.length > 0 ? (
            <EmptyState icon="search" title="No matches" message="No clients match your search." />
          ) : (
            <EmptyState
              icon="people-outline"
              title="No clients yet"
              message="Add your first client to start managing your contacts."
              actionLabel="Add Client"
              onAction={() => router.push("/client/new")}
            />
          )
        ) : (
          <View style={styles.list}>
            {filtered.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onPress={() => router.push(`/client/${client.id}`)}
              />
            ))}
          </View>
        )}
      </Screen>

      <FAB
        icon={() => <Ionicons name="add" size={24} color={palette.white} />}
        style={styles.fab}
        color={palette.white}
        onPress={() => router.push("/client/new")}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.lg },
  greeting: { fontSize: 26, fontWeight: "800", color: palette.onBackground },
  subtitle: { fontSize: 14, color: palette.onSurfaceVariant, marginTop: 2 },
  search: {
    marginBottom: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
    elevation: 1,
  },
  searchInput: { fontSize: 14 },
  center: { paddingVertical: 64, alignItems: "center" },
  list: { gap: spacing.md },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    borderRadius: 28,
    backgroundColor: palette.primary,
  },
});
