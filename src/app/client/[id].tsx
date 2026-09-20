import { useMemo, useState } from "react";
import { Linking, Platform, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { ActivityIndicator, Button, Divider, IconButton, Modal, Text as PaperText } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import { AppHeader, Screen } from "@/components/ui/Screen";
import { AppAvatar } from "@/components/ui/AppAvatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { BookingCard } from "@/components/ui/BookingCard";
import { ClientForm } from "@/forms/ClientForm";
import { useClient, useDeleteClient } from "@/hooks/queries/clients";
import { useBookings } from "@/hooks/queries/bookings";
import { usePaymentSchedules } from "@/hooks/queries/payments";
import { useAuth } from "@/hooks/useAuth";
import { CLIENT_STATUS_COLOR } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";
import { formatPhoneHref, formatEmailHref, getErrorMessage } from "@/lib/utils";
import { palette, radius, spacing } from "@/theme";

export default function ClientDetailScreen() {
  const { height } = useWindowDimensions();
  const sheetMaxHeight = Math.round(height * 0.92);
  const sheetModalStyle = Platform.OS === "web" ? ({ justifyContent: "flex-end" } as const) : undefined;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currency } = useAuth();
  const { data: client, isLoading, isRefetching, refetch } = useClient(id);
  const { data: allBookings, refetch: refetchBookings } = useBookings();
  const { data: schedules } = usePaymentSchedules();
  const deleteClient = useDeleteClient();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const bookings = useMemo(
    () => (allBookings ?? []).filter((b) => b.client_id === id),
    [allBookings, id],
  );

  const totalDue = useMemo(() => {
    const bookingIds = new Set(bookings.map((b) => b.id));
    const related = (schedules ?? []).filter(
      (s) => s.booking_id && bookingIds.has(s.booking_id),
    );
    return related.reduce((sum, s) => sum + Math.max(Number(s.amount) - Number(s.paid_amount || 0), 0), 0);
  }, [bookings, schedules]);

  if (isLoading) {
    return (
      <>
        <AppHeader title="Client" showBack />
        <View style={styles.center}>
          <ActivityIndicator color={palette.primary} />
        </View>
      </>
    );
  }

  if (!client) {
    return (
      <>
        <AppHeader title="Client" showBack />
        <EmptyState icon="person-remove-outline" title="Client not found" />
      </>
    );
  }

  const statusColor = CLIENT_STATUS_COLOR[client.status] ?? "#6B7280";

  const handleDelete = async () => {
    try {
      await deleteClient.mutateAsync(client.id);
      router.back();
    } catch {
      // error surfaced in dialog state
    }
  };

  const callHref = formatPhoneHref(client.phone);
  const mailHref = formatEmailHref(client.email);

  return (
    <>
      <AppHeader
        title="Client"
        showBack
        right={
          <IconButton icon="pencil" onPress={() => setEditOpen(true)} />
        }
      />

      <Screen
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
              void refetchBookings();
            }}
            tintColor={palette.primary}
          />
        }
      >
        <View style={styles.hero}>
          <AppAvatar name={client.full_name} size={64} />
          <View style={styles.heroText}>
            <Text style={styles.name}>{client.full_name}</Text>
            <View style={styles.heroMeta}>
              {client.status !== "active" ? (
                <StatusBadge label={client.status} color={statusColor} subtle />
              ) : (
                <StatusBadge label="Active" color={statusColor} subtle />
              )}
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          {callHref ? (
            <Button icon="phone" mode="outlined" style={styles.actionBtn} onPress={() => Linking.openURL(callHref)}>
              Call
            </Button>
          ) : null}
          {mailHref ? (
            <Button icon="email" mode="outlined" style={styles.actionBtn} onPress={() => Linking.openURL(mailHref)}>
              Email
            </Button>
          ) : null}
        </View>

        <View style={styles.card}>
          {client.phone ? (
            <View style={styles.row}>
              <Ionicons name="call-outline" size={17} color={palette.primary} />
              <PaperText style={styles.rowText}>{client.phone}</PaperText>
            </View>
          ) : null}
          {client.email ? (
            <View style={styles.row}>
              <Ionicons name="mail-outline" size={17} color={palette.primary} />
              <PaperText style={styles.rowText}>{client.email}</PaperText>
            </View>
          ) : null}
          {client.second_contact ? (
            <View style={styles.row}>
              <Ionicons name="person-outline" size={17} color={palette.primary} />
              <PaperText style={styles.rowText}>
                {client.second_contact}
                {client.second_phone ? ` · ${client.second_phone}` : ""}
              </PaperText>
            </View>
          ) : null}
          {client.address ? (
            <View style={styles.row}>
              <Ionicons name="location-outline" size={17} color={palette.primary} />
              <PaperText style={styles.rowText}>{client.address}</PaperText>
            </View>
          ) : null}
          {(client.city || client.country) ? (
            <View style={styles.row}>
              <Ionicons name="map-outline" size={17} color={palette.primary} />
              <PaperText style={styles.rowText}>
                {[client.city, client.state, client.zip_code, client.country].filter(Boolean).join(", ")}
              </PaperText>
            </View>
          ) : null}
          {client.notes ? (
            <View style={styles.row}>
              <Ionicons name="document-text-outline" size={17} color={palette.primary} />
              <PaperText style={styles.rowText}>{client.notes}</PaperText>
            </View>
          ) : null}
          <Divider style={styles.divider} />
          <View style={styles.metaBottom}>
            <PaperText style={styles.metaText}>Added {formatDate(client.created_at)}</PaperText>
            <PaperText style={[styles.metaText, { color: palette.warning, fontWeight: "700" }]}>
              Outstanding {formatMoney(totalDue, currency)}
            </PaperText>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Bookings</Text>
        {bookings.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No bookings yet"
            message="Book a session for this client to get started."
            actionLabel="New Booking"
            onAction={() => router.push(`/booking/new?clientId=${client.id}`)}
          />
        ) : (
          <View style={styles.list}>
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                currency={currency}
                onPress={() => router.push(`/booking/${booking.id}`)}
              />
            ))}
          </View>
        )}

        <Button
          icon="trash-can-outline"
          mode="text"
          textColor={palette.danger}
          style={styles.deleteBtn}
          onPress={() => setDeleteOpen(true)}
        >
          Delete Client
        </Button>
      </Screen>

      <Modal visible={editOpen} onDismiss={() => setEditOpen(false)} style={sheetModalStyle}>
        <View style={[styles.sheet, { maxHeight: sheetMaxHeight }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Edit Client</Text>
          <ScrollView contentContainerStyle={styles.sheetContent}>
            <ClientForm
              client={client}
              onSuccess={() => {
                setEditOpen(false);
              }}
              onCancel={() => {
                setEditOpen(false);
              }}
            />
          </ScrollView>
        </View>
      </Modal>

      <ConfirmDialog
        visible={deleteOpen}
        danger
        title="Delete Client"
        message={`This will permanently delete ${client.full_name} and all related bookings and payment schedules. This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteClient.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
      />
      {deleteClient.error ? (
        <PaperText style={styles.error}>{getErrorMessage(deleteClient.error)}</PaperText>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { flexDirection: "row", alignItems: "center", gap: spacing.lg, marginBottom: spacing.lg },
  heroText: { flex: 1, gap: spacing.xs },
  name: { fontSize: 22, fontWeight: "800", color: palette.onBackground },
  heroMeta: { flexDirection: "row" },
  actionsRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },
  actionBtn: { flex: 1, borderRadius: radius.pill },
  card: {
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
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  rowText: { flex: 1, fontSize: 14, color: palette.onBackground, lineHeight: 20 },
  divider: { marginVertical: spacing.xs },
  metaBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metaText: { fontSize: 12, color: palette.onSurfaceVariant },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: palette.onBackground, marginTop: spacing.xl, marginBottom: spacing.md },
  list: { gap: spacing.md },
  deleteBtn: { marginTop: spacing.xl, alignSelf: "center" },
  error: { color: palette.danger, textAlign: "center", marginTop: spacing.sm },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.outline,
    marginBottom: spacing.md,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: palette.onBackground, marginBottom: spacing.md, textAlign: "center" },
  sheetContent: { paddingBottom: spacing.xl },
});
