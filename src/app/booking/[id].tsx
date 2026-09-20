import { useMemo, useState } from "react";
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { ActivityIndicator, Button, Divider, IconButton, Modal, Text as PaperText } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import { AppHeader, Screen } from "@/components/ui/Screen";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ScheduleCard } from "@/components/ui/ScheduleCard";
import { BookingForm } from "@/forms/BookingForm";
import { useBooking, useDeleteBooking, useUpdateBooking } from "@/hooks/queries/bookings";
import { usePaymentSchedules } from "@/hooks/queries/payments";
import { useAuth } from "@/hooks/useAuth";
import { BOOKING_STATUS_MAP, EVENT_TYPE_MAP } from "@/lib/constants";
import type { BookingStatus } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";
import { getErrorMessage } from "@/lib/utils";
import { palette, radius, spacing } from "@/theme";

const FLOW: BookingStatus[] = ["pending", "confirmed", "in_progress", "completed"];

export default function BookingDetailScreen() {
  const { height } = useWindowDimensions();
  const sheetMaxHeight = Math.round(height * 0.92);
  const sheetDialogRound = Platform.OS === "web" ? styles.sheetDialog : undefined;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currency } = useAuth();
  const { data: booking, isLoading, isRefetching, refetch } = useBooking(id);
  const { data: schedules, refetch: refetchSchedules } = usePaymentSchedules();
  const updateBooking = useUpdateBooking();
  const deleteBooking = useDeleteBooking();

  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const bookingSchedules = useMemo(
    () => (schedules ?? []).filter((s) => s.booking_id === id),
    [schedules, id],
  );
  const totalPaid = useMemo(
    () => bookingSchedules.reduce((sum, s) => sum + Number(s.paid_amount || 0), 0),
    [bookingSchedules],
  );
  const totalDue = useMemo(
    () => bookingSchedules.reduce((sum, s) => sum + Math.max(Number(s.amount) - Number(s.paid_amount || 0), 0), 0),
    [bookingSchedules],
  );

  if (isLoading) {
    return (
      <>
        <AppHeader title="Booking" showBack />
        <View style={styles.center}>
          <ActivityIndicator color={palette.primary} />
        </View>
      </>
    );
  }

  if (!booking) {
    return (
      <>
        <AppHeader title="Booking" showBack />
        <EmptyState icon="calendar-outline" title="Booking not found" />
      </>
    );
  }

  const event = EVENT_TYPE_MAP[booking.event_type] ?? EVENT_TYPE_MAP.Other;
  const status = BOOKING_STATUS_MAP[booking.status] ?? { label: booking.status, color: "#6B7280" };
  const isWedding = booking.event_type === "Wedding";
  const editable = booking.status === "pending";
  const isCancelled = booking.status === "cancelled";

  const setStatus = (next: BookingStatus) => {
    updateBooking.mutate({ id: booking.id, patch: { status: next } });
  };

  const handleDelete = async () => {
    await deleteBooking.mutateAsync(booking.id);
    router.back();
  };

  const currentFlowIndex = FLOW.indexOf(booking.status as BookingStatus);

  return (
    <>
      <AppHeader
        title="Booking"
        showBack
        right={
          editable ? (
            <IconButton icon="pencil" onPress={() => setEditOpen(true)} />
          ) : undefined
        }
      />

      <Screen
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
              void refetchSchedules();
            }}
            tintColor={palette.primary}
          />
        }
      >
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: `${event.color}14` }]}>
            <Ionicons name={event.icon} size={26} color={event.color} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.title}>{booking.title}</Text>
            <View style={styles.heroMeta}>
              <StatusBadge label={status.label} color={status.color} />
              <Text style={styles.eventLabel}>{event.label}</Text>
            </View>
          </View>
        </View>

        {isCancelled ? (
          <View style={[styles.notice, { borderColor: palette.danger }]}>
            <Ionicons name="close-circle-outline" size={18} color={palette.danger} />
            <PaperText style={{ color: palette.danger }}>This booking was cancelled.</PaperText>
          </View>
        ) : (
          <View style={styles.stepper}>
            {FLOW.map((step, i) => {
              const info = BOOKING_STATUS_MAP[step];
              const reached = currentFlowIndex >= i;
              const isCurrent = currentFlowIndex === i;
              return (
                <View key={step} style={styles.stepWrap}>
                  <Pressable
                    onPress={() => setStatus(step)}
                    style={[styles.step, reached && styles.stepActive]}
                  >
                    <Ionicons
                      name={reached ? "checkmark" : info.icon}
                      size={16}
                      color={reached ? palette.white : palette.onSurfaceVariant}
                    />
                  </Pressable>
                  {i < FLOW.length - 1 ? (
                    <View style={[styles.stepLine, currentFlowIndex > i && styles.stepLineActive]} />
                  ) : null}
                  <Text
                    style={[
                      styles.stepLabel,
                      isCurrent && { color: palette.primary, fontWeight: "800" },
                      reached && !isCurrent && { color: palette.onBackground },
                    ]}
                    numberOfLines={1}
                  >
                    {info.label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {booking.clients ? (
          <Pressable
            style={styles.clientCard}
            onPress={() => router.push(`/client/${booking.client_id}`)}
          >
            <View style={styles.clientAvatar}>
              <Ionicons name="person" size={18} color={palette.primary} />
            </View>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{booking.clients.full_name}</Text>
              {booking.clients.phone ? (
                <Text style={styles.clientSub}>{booking.clients.phone}</Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.outline} />
          </Pressable>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isWedding ? "Wedding Details" : "Schedule"}</Text>
          {isWedding ? (
            <>
              <DetailRow label="Wedding Date" value={formatDate(booking.wedding_date)} />
              <DetailRow label="Wedding Hotel" value={booking.wedding_hotel_name} />
              <DetailRow label="Homecoming" value={booking.homecoming_hotel_name} />
              <DetailRow label="Homecoming Date" value={formatDate(booking.homecoming_date)} />
              <DetailRow label="Wedding Album" value={booking.wedding_album ? "Yes" : "No"} />
              <DetailRow label="Pre-shoot Album" value={booking.pre_shoot_album ? "Yes" : "No"} />
              <DetailRow label="Family Album" value={booking.family_album ? "Yes" : "No"} />
              <DetailRow label="Group Photo Size" value={booking.group_photo_size} />
              <DetailRow label="Homecoming Size" value={booking.homecoming_photo_size} />
              <DetailRow
                label="Wedding Sizes"
                value={booking.wedding_photo_sizes?.length ? booking.wedding_photo_sizes.join(", ") : null}
              />
              <DetailRow
                label="Extra Thank You Cards"
                value={booking.extra_thank_you_cards_qty ? String(booking.extra_thank_you_cards_qty) : null}
              />
            </>
          ) : (
            <>
              <DetailRow label="Booking Date" value={formatDate(booking.booking_date)} />
              <DetailRow label="Time" value={[booking.start_time, booking.end_time].filter(Boolean).join(" – ")} />
              <DetailRow label="Location" value={booking.location} />
              <DetailRow label="Album" value={booking.album} />
            </>
          )}
          <DetailRow label="Package" value={booking.package_name} />
          <DetailRow label="Shoot Type" value={booking.shoot_type} />
          {booking.notes ? (
            <>
              <Divider style={styles.divider} />
              <PaperText style={styles.notes}>{booking.notes}</PaperText>
            </>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pricing</Text>
          <DetailRow label="Total Amount" value={booking.total_amount != null ? formatMoney(booking.total_amount, currency) : null} highlight />
          <DetailRow label="Deposit" value={booking.deposit_amount != null ? formatMoney(booking.deposit_amount, currency) : null} />
          <Divider style={styles.divider} />
          <DetailRow label="Collected" value={formatMoney(totalPaid, currency)} />
          <DetailRow label="Outstanding" value={formatMoney(totalDue, currency)} warn={totalDue > 0} />
        </View>

        <Text style={styles.sectionTitle}>Payments</Text>
        {bookingSchedules.length === 0 ? (
          <EmptyState
            icon="card-outline"
            title="No payment schedules"
            message="Set up deposit or milestone payments for this booking."
            actionLabel="Add Schedule"
            onAction={() => router.push(`/payment/new?bookingId=${booking.id}`)}
          />
        ) : (
          <View style={styles.list}>
            {bookingSchedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                currency={currency}
                onPress={() => router.push(`/payment/${schedule.id}`)}
              />
            ))}
          </View>
        )}

        <Button
          mode="outlined"
          icon="card-plus"
          style={styles.addBtn}
          onPress={() => router.push(`/payment/new?bookingId=${booking.id}`)}
        >
          Add Payment Schedule
        </Button>

        {editable ? (
          <>
            <Button
              icon="close-circle-outline"
              mode="text"
              textColor={palette.danger}
              style={styles.cancelBtn}
              onPress={() => setCancelOpen(true)}
            >
              Cancel Booking
            </Button>
            <Button
              icon="trash-can-outline"
              mode="text"
              textColor={palette.danger}
              style={styles.deleteBtn}
              onPress={() => setDeleteOpen(true)}
            >
              Delete Booking
            </Button>
          </>
        ) : null}
      </Screen>

      <Modal visible={editOpen} onDismiss={() => setEditOpen(false)}>
        <View style={[styles.sheet, { maxHeight: sheetMaxHeight }, sheetDialogRound]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Edit Booking</Text>
          <ScrollView contentContainerStyle={styles.sheetContent}>
            <BookingForm
              eventType={booking.event_type as BookingFormEventType}
              booking={booking}
              onSuccess={() => setEditOpen(false)}
              onCancel={() => setEditOpen(false)}
            />
          </ScrollView>
        </View>
      </Modal>

      <ConfirmDialog
        visible={cancelOpen}
        title="Cancel Booking?"
        message="The booking will be marked as cancelled. Payment schedules will be kept for reference."
        confirmLabel="Cancel Booking"
        loading={updateBooking.isPending}
        onCancel={() => setCancelOpen(false)}
        onConfirm={() => {
          setStatus("cancelled");
          setCancelOpen(false);
        }}
      />
      <ConfirmDialog
        visible={deleteOpen}
        danger
        title="Delete Booking?"
        message="This will permanently delete the booking and all of its payment schedules. This cannot be undone."
        confirmLabel="Delete"
        loading={deleteBooking.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
      />
      {updateBooking.error ? (
        <PaperText style={styles.error}>{getErrorMessage(updateBooking.error)}</PaperText>
      ) : null}
    </>
  );
}

type BookingFormEventType = import("@/lib/constants").EventType;

function DetailRow({
  label,
  value,
  highlight,
  warn,
}: {
  label: string;
  value: string | null | undefined;
  highlight?: boolean;
  warn?: boolean;
}) {
  if (value == null || value === "" || value === "Not set" || value === " – ") return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[
          styles.detailValue,
          highlight && styles.detailValueHighlight,
          warn && { color: palette.warning },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { flexDirection: "row", alignItems: "center", gap: spacing.lg, marginBottom: spacing.lg },
  heroIcon: { width: 52, height: 52, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  heroText: { flex: 1, gap: spacing.xs },
  title: { fontSize: 20, fontWeight: "800", color: palette.onBackground },
  heroMeta: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  eventLabel: { fontSize: 13, color: palette.onSurfaceVariant },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: `${palette.danger}0D`,
  },
  stepper: { flexDirection: "row", marginBottom: spacing.xl },
  stepWrap: { flex: 1, alignItems: "center" },
  step: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.surfaceVariant,
  },
  stepActive: { backgroundColor: palette.primary },
  stepLine: { position: "absolute", top: 17, left: "50%", width: "100%", height: 2, backgroundColor: palette.outline },
  stepLineActive: { backgroundColor: palette.primary },
  stepLabel: { fontSize: 10, color: palette.onSurfaceVariant, marginTop: 6, textAlign: "center" },
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  clientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${palette.primary}14`,
  },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 15, fontWeight: "700", color: palette.onBackground },
  clientSub: { fontSize: 12, color: palette.onSurfaceVariant },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: "800", color: palette.onBackground, marginBottom: spacing.xs },
  detailRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  detailLabel: { fontSize: 13, color: palette.onSurfaceVariant },
  detailValue: { fontSize: 13, fontWeight: "600", color: palette.onBackground, textAlign: "right", flexShrink: 1 },
  detailValueHighlight: { fontWeight: "800" },
  divider: { marginVertical: spacing.xs },
  notes: { fontSize: 13, color: palette.onSurfaceVariant, fontStyle: "italic" },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: palette.onBackground, marginBottom: spacing.md },
  list: { gap: spacing.md },
  addBtn: { borderRadius: 999, marginTop: spacing.md },
  cancelBtn: { marginTop: spacing.xl },
  deleteBtn: { marginBottom: spacing.lg },
  error: { color: palette.danger, textAlign: "center", marginTop: spacing.sm },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },
  sheetDialog: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
