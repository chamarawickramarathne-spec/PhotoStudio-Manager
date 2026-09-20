import { useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { ActivityIndicator, Button, IconButton, List, Modal, Text as PaperText } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import { AppHeader, Screen } from "@/components/ui/Screen";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PaymentProgress } from "@/components/ui/SummaryTile";
import { PaymentScheduleForm } from "@/forms/PaymentScheduleForm";
import { TextFormField } from "@/components/form/TextFormField";
import { SelectFormField } from "@/components/form/SelectFormField";
import { DateFormField } from "@/components/form/DateFormField";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormActions } from "@/components/form/FormActions";
import { moneyPositive, required } from "@/forms/validation";

import {
  useAddInstallment,
  useDeleteSchedule,
  useInstallments,
  useSchedule,
} from "@/hooks/queries/payments";
import { useAuth } from "@/hooks/useAuth";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_INFO, SCHEDULE_TYPE_LABEL } from "@/lib/constants";
import { formatDate, formatMoney, todayISO } from "@/lib/format";
import { getErrorMessage } from "@/lib/utils";
import { palette, radius, spacing } from "@/theme";

const installmentSchema = z.object({
  amount: moneyPositive("Amount must be greater than 0"),
  paid_date: required("Date is required"),
  method: z.enum(["cash", "e_transfer_bank", "card_pay", "other"]),
});

type InstallmentValues = z.infer<typeof installmentSchema>;

export default function PaymentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, currency } = useAuth();
  const { data: schedule, isLoading, isRefetching, refetch } = useSchedule(id);
  const { data: installments, refetch: refetchInstallments } = useInstallments(id);
  const addInstallment = useAddInstallment();
  const deleteSchedule = useDeleteSchedule();

  const [recordOpen, setRecordOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const form = useForm<InstallmentValues>({
    resolver: zodResolver(installmentSchema),
    defaultValues: { amount: "", paid_date: todayISO(), method: "cash" },
  });

  const remaining = useMemo(() => {
    if (!schedule) return 0;
    return Math.max(Number(schedule.amount) - Number(schedule.paid_amount || 0), 0);
  }, [schedule]);

  const openRecord = () => {
    form.reset({
      amount: remaining > 0 ? String(remaining) : "",
      paid_date: todayISO(),
      method: "cash",
    });
    setRecordOpen(true);
  };

  const onRecord = async (values: InstallmentValues) => {
    if (!schedule || !session) return;
    const amount = parseFloat(values.amount);
    if (amount > remaining) {
      form.setError("amount", {
        type: "custom",
        message: "Amount can't exceed the remaining balance",
      });
      return;
    }
    await addInstallment.mutateAsync({
      user_id: session.user.id,
      schedule_id: schedule.id,
      amount,
      paid_date: values.paid_date,
      payment_method: values.method as InstallmentValues["method"],
    });
    setRecordOpen(false);
  };

  const handleDelete = async () => {
    if (!schedule) return;
    await deleteSchedule.mutateAsync(schedule.id);
    router.back();
  };

  if (isLoading) {
    return (
      <>
        <AppHeader title="Payment" showBack />
        <View style={styles.center}>
          <ActivityIndicator color={palette.primary} />
        </View>
      </>
    );
  }

  if (!schedule) {
    return (
      <>
        <AppHeader title="Payment" showBack />
        <EmptyState icon="card-outline" title="Schedule not found" />
      </>
    );
  }

  const status = PAYMENT_STATUS_INFO[schedule.status] ?? {
    label: schedule.status,
    color: "#6B7280",
  };
  const paid = Number(schedule.paid_amount || 0);
  const isPaid = schedule.status === "paid";

  return (
    <>
      <AppHeader
        title="Payment"
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
              void refetchInstallments();
            }}
            tintColor={palette.primary}
          />
        }
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name={status.icon} size={24} color={status.color} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.title}>
              {schedule.name ?? SCHEDULE_TYPE_LABEL[schedule.schedule_type] ?? "Payment"}
            </Text>
            {schedule.bookings ? (
              <Text
                style={styles.bookingRef}
                numberOfLines={1}
                onPress={() => router.push(`/booking/${schedule.booking_id}`)}
              >
                {schedule.bookings.title}
              </Text>
            ) : null}
            <View style={styles.heroMeta}>
              <StatusBadge label={status.label} color={status.color} />
            </View>
          </View>
        </View>

        <View style={styles.amountCard}>
          <View style={styles.amountRow}>
            <View>
              <Text style={styles.amountLabel}>Amount</Text>
              <Text style={styles.amountBig}>{formatMoney(schedule.amount, currency)}</Text>
            </View>
            <View style={styles.rightBlock}>
              <Text style={styles.amountLabel}>Paid</Text>
              <Text style={[styles.amountBig, { color: palette.success }]}>
                {formatMoney(paid, currency)}
              </Text>
            </View>
          </View>
          <PaymentProgress amount={Number(schedule.amount)} paid={paid} />
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={13} color={palette.onSurfaceVariant} />
            <Text style={styles.metaText}>Due {formatDate(schedule.due_date)}</Text>
            {schedule.booking_id ? (
              <>
                <View style={styles.dot} />
                <Ionicons name="link-outline" size={13} color={palette.onSurfaceVariant} />
                <Text style={styles.metaText}>Linked to booking</Text>
              </>
            ) : null}
          </View>
        </View>

        {!isPaid ? (
          <Button
            mode="contained"
            icon="cash"
            style={styles.recordBtn}
            contentStyle={styles.recordBtnContent}
            onPress={openRecord}
          >
            Record Installment
          </Button>
        ) : null}

        <Text style={styles.sectionTitle}>Installments</Text>
        {!installments || installments.length === 0 ? (
          <EmptyState icon="time-outline" title="No installments yet" message="Record the first payment for this schedule." />
        ) : (
          <View style={styles.list}>
            {installments.map((inst) => (
              <List.Item
                key={inst.id}
                title={formatMoney(inst.amount, currency)}
                description={formatDate(inst.paid_date)}
                left={() => (
                  <List.Icon
                    icon={PAYMENT_METHODS.find((m) => m.value === inst.payment_method)?.icon ?? "cash"}
                    color={palette.primary}
                  />
                )}
                right={() => (
                  <PaperText style={styles.methodLabel}>
                    {PAYMENT_METHOD_LABEL[inst.payment_method ?? "other"] ?? "Other"}
                  </PaperText>
                )}
                style={styles.installmentItem}
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
          Delete Schedule
        </Button>
      </Screen>

      <Modal visible={recordOpen} onDismiss={() => setRecordOpen(false)}>
        <View style={[styles.sheet, styles.sheetNarrow]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Record Installment</Text>
          <FormProvider {...form}>
            <View style={styles.formBody}>
              <TextFormField name="amount" label={`Amount (${currency})`} placeholder="0.00" keyboardType="decimal-pad" required />
              <PaperText style={styles.remaining}>
                Remaining balance: {formatMoney(remaining, currency)}
              </PaperText>
              <DateFormField name="paid_date" label="Payment Date" required maxDate={new Date()} />
              <SelectFormField
                name="method"
                label="Payment Method"
                options={PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }))}
                required
              />
              {addInstallment.error ? (
                <PaperText style={styles.error}>{getErrorMessage(addInstallment.error)}</PaperText>
              ) : null}
              <FormActions
                submitLabel="Save Installment"
                submitting={addInstallment.isPending}
                onSubmit={form.handleSubmit(onRecord)}
                onCancel={() => {
                  setRecordOpen(false);
                }}
              />
            </View>
          </FormProvider>
        </View>
      </Modal>

      <Modal visible={editOpen} onDismiss={() => setEditOpen(false)}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Edit Schedule</Text>
          <ScrollView contentContainerStyle={styles.sheetContent}>
            <PaymentScheduleForm schedule={schedule} onSuccess={() => setEditOpen(false)} onCancel={() => setEditOpen(false)} />
          </ScrollView>
        </View>
      </Modal>

      <ConfirmDialog
        visible={deleteOpen}
        danger
        title="Delete Schedule?"
        message="This will permanently delete this schedule and all its recorded installments."
        confirmLabel="Delete"
        loading={deleteSchedule.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { flexDirection: "row", alignItems: "center", gap: spacing.lg, marginBottom: spacing.lg },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.surfaceVariant,
  },
  heroText: { flex: 1, gap: 2 },
  title: { fontSize: 20, fontWeight: "800", color: palette.onBackground },
  bookingRef: { fontSize: 13, color: palette.primary, fontWeight: "600" },
  heroMeta: { marginTop: 4 },
  amountCard: {
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
  amountRow: { flexDirection: "row", justifyContent: "space-between" },
  amountLabel: { fontSize: 11, color: palette.onSurfaceVariant, textTransform: "uppercase" },
  amountBig: { fontSize: 20, fontWeight: "800", color: palette.onBackground, marginTop: 2 },
  rightBlock: { alignItems: "flex-end" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.sm },
  metaText: { fontSize: 12, color: palette.onSurfaceVariant },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: palette.outline, marginHorizontal: 4 },
  recordBtn: { borderRadius: 999, marginBottom: spacing.xl },
  recordBtnContent: { height: 48 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: palette.onBackground, marginBottom: spacing.md },
  list: { gap: spacing.sm },
  installmentItem: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
  },
  methodLabel: { fontSize: 12, color: palette.onSurfaceVariant, alignSelf: "center" },
  deleteBtn: { marginTop: spacing.xl },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    maxHeight: "92%",
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  sheetNarrow: { maxWidth: 480 },
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
  formBody: { gap: spacing.lg },
  remaining: { fontSize: 12, color: palette.onSurfaceVariant },
  error: { color: palette.danger, textAlign: "center" },
});
