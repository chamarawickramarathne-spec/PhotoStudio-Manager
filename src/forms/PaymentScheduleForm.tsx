import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useForm, useWatch, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Text } from "react-native-paper";

import { TextFormField } from "@/components/form/TextFormField";
import { SelectFormField } from "@/components/form/SelectFormField";
import { DateFormField } from "@/components/form/DateFormField";
import { FormActions } from "@/components/form/FormActions";
import { useBookings } from "@/hooks/queries/bookings";
import { useCreateSchedule, useUpdateSchedule, type ScheduleRow } from "@/hooks/queries/payments";
import { useAuth } from "@/hooks/useAuth";
import { SCHEDULE_TYPES, type ScheduleType } from "@/lib/constants";
import { todayISO } from "@/lib/format";
import { getErrorMessage } from "@/lib/utils";
import { moneyPositive, required } from "@/forms/validation";
import { palette, spacing } from "@/theme";

const schema = z
  .object({
    booking_id: required("Booking is required"),
    schedule_type: z.enum(SCHEDULE_TYPES.map((s) => s.value) as [ScheduleType, ...ScheduleType[]]),
    name: z.string().optional(),
    amount: moneyPositive("Amount must be greater than 0"),
    due_date: z.string().optional(),
  });

type FormValues = z.infer<typeof schema>;

interface PaymentScheduleFormProps {
  presetBookingId?: string;
  schedule?: ScheduleRow;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentScheduleForm({ presetBookingId, schedule, onSuccess, onCancel }: PaymentScheduleFormProps) {
  const { session, currency } = useAuth();
  const { data: bookings } = useBookings();
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const editing = !!schedule;

  const bookingOptions = useMemo(
    () =>
      (bookings ?? []).map((b) => ({
        value: b.id,
        label: `${b.title} — ${b.clients?.full_name ?? "Unknown client"}`,
      })),
    [bookings],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: schedule
      ? {
          booking_id: schedule.booking_id ?? "",
          schedule_type: schedule.schedule_type,
          name: schedule.name ?? "",
          amount: String(schedule.amount),
          due_date: schedule.due_date ?? "",
        }
      : {
          booking_id: presetBookingId ?? "",
          schedule_type: "deposit",
          name: "",
          amount: "",
          due_date: "",
        },
  });

  const watchType = useWatch({ control: form.control, name: "schedule_type" });
  const isSubmitting = createSchedule.isPending || updateSchedule.isPending;
  const errorMessage = createSchedule.error || updateSchedule.error;

  const onSubmit = async (values: FormValues) => {
    if (!session) return;
    if (!editing && !values.due_date?.trim()) {
      form.setError("due_date", { type: "manual", message: "Due date is required" });
      return;
    }
    const dueDate = values.due_date?.trim() || null;
    const today = todayISO();
    let status: ScheduleRow["status"];
    if (editing && schedule && (schedule.status === "paid" || schedule.status === "cancelled")) {
      status = schedule.status;
    } else {
      status = dueDate && dueDate < today ? "overdue" : "pending";
    }

    if (editing && schedule) {
      await updateSchedule.mutateAsync({
        id: schedule.id,
        patch: {
          booking_id: values.booking_id,
          schedule_type: values.schedule_type,
          name: values.name?.trim() ? values.name.trim() : null,
          amount: parseFloat(values.amount),
          due_date: dueDate,
          status,
        },
      });
    } else {
      await createSchedule.mutateAsync({
        user_id: session.user.id,
        booking_id: values.booking_id,
        schedule_type: values.schedule_type,
        name: values.name?.trim() ? values.name.trim() : null,
        amount: parseFloat(values.amount),
        due_date: dueDate,
        status,
      });
    }
    onSuccess?.();
  };

  return (
    <FormProvider {...form}>
      <View style={styles.form}>
        <SelectFormField name="booking_id" label="Booking" options={bookingOptions} required />
        <SelectFormField
          name="schedule_type"
          label="Schedule Type"
          options={SCHEDULE_TYPES.map((s) => ({ value: s.value, label: s.label }))}
          required
        />
        {watchType === "custom" ? (
          <TextFormField name="name" label="Custom Schedule Name" placeholder="e.g. Album Delivery Payment" required />
        ) : null}
        <TextFormField
          name="amount"
          label={`Amount (${currency})`}
          placeholder="0.00"
          keyboardType="decimal-pad"
          required
        />
        <DateFormField
          name="due_date"
          label="Due Date"
          required
          minDate={editing ? undefined : new Date()}
        />

        {errorMessage ? (
          <Text style={styles.error}>{getErrorMessage(errorMessage)}</Text>
        ) : null}

        <FormActions
          submitLabel={editing ? "Save Schedule" : "Create Schedule"}
          submitting={isSubmitting}
          onSubmit={form.handleSubmit(onSubmit)}
          onCancel={onCancel}
        />
      </View>
    </FormProvider>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  error: { color: palette.error, fontSize: 13, textAlign: "center" },
});