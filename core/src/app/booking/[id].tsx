import { useMemo, useState } from "react";
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { ActivityIndicator, Button, Divider, IconButton, Modal, Text as PaperText } from "react-native-paper";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router, useLocalSearchParams } from "@/navigation/router";

import { AppHeader, Screen } from "@/components/ui/Screen";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAppToast } from "@/components/ui/ToastProvider";
import { useBackIntercept } from "@/components/ui/BackHandlerProvider";
import { ScheduleCard } from "@/components/ui/ScheduleCard";
import { PackageDetails } from "@/components/booking/PackageDetails";
import { BookingForm } from "@/forms/BookingForm";
import { useBooking, useDeleteBooking, useUpdateBooking } from "@/hooks/queries/bookings";
import { usePaymentSchedules } from "@/hooks/queries/payments";
import { useAuth } from "@/hooks/useAuth";
import {
  BOOKING_STATUS_FLOW,
  BOOKING_STATUS_MAP,
  EVENT_TYPE_MAP,
  isValidStatusTransition,
  nextBookingStatus,
} from "@/lib/constants";
import type { BookingStatus } from "@/lib/constants";
import { orderSchedules } from "@/lib/scheduleOrder";
import { getErrorMessage } from "@/lib/utils";
import { palette, radius, spacing } from "@/theme";

const FLOW = BOOKING_STATUS_FLOW;

export default function BookingDetailScreen() {
  const { height, width } = useWindowDimensions();
  const sheetMaxHeight = Math.round(height * 0.92);
  const sheetDialogRound = Platform.OS === "web" ? styles.sheetDialog : undefined;
  const isWide = Platform.OS === "web" && width >= 900;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currency } = useAuth();
  const toast = useAppToast();
  const { data: booking, isLoading, isRefetching, refetch } = useBooking(id);
  const { data: schedules, refetch: refetchSchedules } = usePaymentSchedules();
  const updateBooking = useUpdateBooking();
  const deleteBooking = useDeleteBooking();

  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  useBackIntercept(editOpen, () => setEditOpen(false));

  const bookingSchedules = useMemo(
    () => orderSchedules((schedules ?? []).filter((s) => s.booking_id === id)),
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
  const depositSchedules = useMemo(
    () => bookingSchedules.filter((s) => s.schedule_type === "deposit"),
    [bookingSchedules],
  );
  const depositTotal = useMemo(
    () => depositSchedules.reduce((sum, s) => sum + Number(s.amount || 0), 0),
    [depositSchedules],
  );
  const depositPaid = useMemo(
    () => depositSchedules.reduce((sum, s) => sum + Number(s.paid_amount || 0), 0),
    [depositSchedules],
  );
  const depositDue = Math.max(depositTotal - depositPaid, 0);

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
  const editable = booking.status === "pending";
  const canCancel = booking.status === "pending" || booking.status === "confirmed";
  const isCancelled = booking.status === "cancelled";
  const nextStatus = nextBookingStatus(booking.status);

  const setStatus = (next: BookingStatus) => {
    if (!isValidStatusTransition(booking.status, next)) return;
    updateBooking.mutate(
      { id: booking.id, patch: { status: next } },
      {
        onSuccess: () => {
          toast.show(
            next === "confirmed"
              ? "Booking confirmed — payment schedule created"
              : `Status changed to ${BOOKING_STATUS_MAP[next]?.label ?? next}`,
          );
        },
      },
    );
  };

  const handleDelete = async () => {
    await deleteBooking.mutateAsync(booking.id);
    toast.show("Booking deleted");
    router.back();
  };

  const currentFlowIndex = FLOW.indexOf(booking.status as BookingStatus);

  return (
    <>
      <AppHeader
        title="Booking"
        showBack
        right={
          <View style={styles.headerActions}>
            {editable ? (
              <IconButton
                icon="pencil"
                accessibilityLabel="Edit booking"
                onPress={() => setEditOpen(true)}
              />
            ) : null}
          </View>
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
              const enabled = step === nextStatus;
              const lockedFuture = i > currentFlowIndex && !enabled;
              return (
                <View key={step} style={styles.stepWrap}>
                  <Pressable
                    onPress={() => setStatus(step)}
                    disabled={!enabled}
                    accessibilityRole="button"
                    accessibilityLabel={`Mark as ${info.label}`}
                    accessibilityState={{ disabled: !enabled }}
                    style={[styles.step, reached && styles.stepActive, lockedFuture && styles.stepDisabled]}
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

        <View style={isWide ? styles.columns : undefined}>
          <View style={isWide ? styles.leftCol : undefined}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Schedule & Pricing</Text>
              <PackageDetails
                booking={booking}
                currency={currency}
                depositTotal={depositTotal}
                depositPaid={depositPaid}
                depositDue={depositDue}
                totalPaid={totalPaid}
                totalDue={totalDue}
              />
              {booking.notes ? (
                <>
                  <Divider style={styles.divider} />
                  <PaperText style={styles.notes}>{booking.notes}</PaperText>
                </>
              ) : null}
            </View>

            <View style={styles.actionGroup}>
              <Button
                mode="contained"
                icon="file-document-outline"
                style={styles.actionBtn}
                labelStyle={styles.actionBtnLabel}
                onPress={() => router.push(`/invoice/${booking.id}`)}
              >
                Create Invoice
              </Button>
              <Button
                mode="outlined"
                icon="card-plus"
                style={styles.actionBtn}
                labelStyle={styles.actionBtnLabel}
                onPress={() => router.push(`/payment/new?bookingId=${booking.id}`)}
              >
                Add Payment Schedule
              </Button>
              {canCancel ? (
                <Button
                  mode="text"
                  icon="close-circle-outline"
                  textColor={palette.danger}
                  style={styles.actionBtn}
                  labelStyle={styles.actionBtnLabel}
                  onPress={() => setCancelOpen(true)}
                >
                  Cancel Booking
                </Button>
              ) : null}
            </View>
          </View>

          <View style={isWide ? styles.rightCol : undefined}>
            <Text style={[styles.sectionTitle, !isWide && styles.sectionTitleSpaced]}>Payments</Text>
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
          </View>
        </View>

        {editable ? (
          <Button
            icon="trash-can-outline"
            mode="text"
            textColor={palette.danger}
            style={styles.deleteBtn}
            onPress={() => setDeleteOpen(true)}
          >
            Delete Booking
          </Button>
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
              onSuccess={() => {
                toast.show("Booking updated");
                setEditOpen(false);
              }}
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

const styles = StyleSheet.create({
  headerActions: { flexDirection: "row", alignItems: "center" },
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
  stepDisabled: { opacity: 0.4 },
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
  divider: { marginVertical: spacing.xs },
  notes: { fontSize: 13, color: palette.onSurfaceVariant, fontStyle: "italic" },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: palette.onBackground, marginBottom: spacing.md },
  sectionTitleSpaced: { marginTop: spacing.xl },
  columns: { flexDirection: "row", alignItems: "flex-start", gap: spacing.xl },
  leftCol: { flex: 1.3, minWidth: 0 },
  rightCol: { flex: 1, minWidth: 0 },
  list: { gap: spacing.md },
  actionGroup: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  actionBtn: { borderRadius: 999 },
  actionBtnLabel: { fontSize: 13 },
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
