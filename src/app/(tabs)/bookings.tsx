import { useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Chip, FAB, Searchbar, Text as PaperText } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { Screen } from "@/components/ui/Screen";
import { BookingCard } from "@/components/ui/BookingCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useBookings } from "@/hooks/queries/bookings";
import { useAuth } from "@/hooks/useAuth";
import { BOOKING_STATUSES } from "@/lib/constants";
import type { BookingStatus } from "@/lib/constants";
import { palette, radius, spacing } from "@/theme";

const FILTERS: { value: BookingStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  ...BOOKING_STATUSES.map((s) => ({ value: s.value as BookingStatus, label: s.label })),
];

export default function BookingsTab() {
  const { data: bookings, isLoading, isRefetching, refetch } = useBookings();
  const { currency } = useAuth();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<BookingStatus | "all">("all");

  const filtered = useMemo(() => {
    if (!bookings) return [];
    const q = query.trim().toLowerCase();
    return bookings.filter((b) => {
      const matchesStatus = filter === "all" || b.status === filter;
      const matchesQuery =
        !q ||
        b.title.toLowerCase().includes(q) ||
        (b.clients?.full_name ?? "").toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [bookings, query, filter]);

  return (
    <>
      <Screen
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={palette.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Bookings</Text>
          <PaperText style={styles.subtitle}>
            {bookings?.length ? `${bookings.length} booking${bookings.length > 1 ? "s" : ""}` : "Track every session"}
          </PaperText>
        </View>

        <Searchbar
          placeholder="Search title or client"
          value={query}
          onChangeText={setQuery}
          style={styles.search}
          inputStyle={styles.searchInput}
        />

        <ScrollViewFilterRow filters={FILTERS} active={filter} onSelect={setFilter} />

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={palette.primary} />
          </View>
        ) : filtered.length === 0 ? (
          bookings && bookings.length > 0 ? (
            <EmptyState icon="search" title="No matches" message="No bookings match your filters." />
          ) : (
            <EmptyState
              icon="calendar-outline"
              title="No bookings yet"
              message="Create your first booking and start managing sessions."
              actionLabel="New Booking"
              onAction={() => router.push("/booking/new")}
            />
          )
        ) : (
          <View style={styles.list}>
            {filtered.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                currency={currency}
                onPress={() => router.push(`/booking/${booking.id}`)}
              />
            ))}
          </View>
        )}
      </Screen>

      <FAB
        icon={() => <Ionicons name="add" size={24} color={palette.white} />}
        style={styles.fab}
        color={palette.white}
        onPress={() => router.push("/booking/new")}
      />
    </>
  );
}

function ScrollViewFilterRow({
  filters,
  active,
  onSelect,
}: {
  filters: { value: string; label: string }[];
  active: string;
  onSelect: (v: any) => void;
}) {
  return (
    <View style={styles.filters}>
      {filters.map((f) => {
        const isActive = active === f.value;
        return (
          <Chip
            key={f.value}
            selected={isActive}
            onPress={() => onSelect(f.value)}
            style={[styles.filterChip, isActive && styles.filterChipActive]}
            textStyle={styles.filterChipText}
          >
            {f.label}
          </Chip>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.lg },
  greeting: { fontSize: 26, fontWeight: "800", color: palette.onBackground },
  subtitle: { fontSize: 14, color: palette.onSurfaceVariant, marginTop: 2 },
  search: {
    marginBottom: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
    elevation: 1,
  },
  searchInput: { fontSize: 14 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  filterChip: { backgroundColor: palette.surface, borderColor: palette.outline },
  filterChipActive: { backgroundColor: palette.primary },
  filterChipText: { fontSize: 12, fontWeight: "600" },
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
