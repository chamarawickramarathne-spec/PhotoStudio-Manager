import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useForm, useWatch, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Text } from "react-native-paper";

import { TextFormField } from "@/components/form/TextFormField";
import { SelectFormField } from "@/components/form/SelectFormField";
import { FormActions } from "@/components/form/FormActions";
import {
  AlbumsGroup,
  PhotoSizesGroup,
  PricingGroup,
  ScheduleGroup,
  WeddingDetailsGroup,
} from "@/components/form/BookingSections";
import { useClients } from "@/hooks/queries/clients";
import { useCreateBooking, useUpdateBooking, type BookingRow } from "@/hooks/queries/bookings";
import { useAuth } from "@/hooks/useAuth";
import { EVENT_TYPE_MAP, SHOOT_TYPES } from "@/lib/constants";
import type { EventType } from "@/lib/constants";
import { getErrorMessage } from "@/lib/utils";
import { moneyOptional, required, wholeNumberOptional } from "@/forms/validation";
import { palette, radius, spacing } from "@/theme";

const schema = z
  .object({
    title: required("Title is required"),
    client_id: required("Client is required"),
    booking_date: z.string().optional(),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    location: z.string().optional(),
    package_name: z.string().optional(),
    shoot_type: z.enum(SHOOT_TYPES),
    album: z.enum(["Yes", "No"]),
    total_amount: moneyOptional(),
    deposit_amount: moneyOptional(),
    notes: z.string().optional(),
    wedding_hotel_name: z.string().optional(),
    wedding_date: z.string().optional(),
    homecoming_hotel_name: z.string().optional(),
    homecoming_date: z.string().optional(),
    wedding_album: z.boolean(),
    pre_shoot_album: z.boolean(),
    family_album: z.boolean(),
    group_photo_size: z.string().optional(),
    homecoming_photo_size: z.string().optional(),
    wedding_photo_sizes: z.array(z.string()),
    extra_thank_you_cards_qty: wholeNumberOptional(0, 9999, "Enter a whole number from 0 to 9999"),
  })
  .superRefine((values, ctx) => {
    if (values.client_id === "none" || !values.client_id.trim()) {
      ctx.addIssue({ code: "custom", path: ["client_id"], message: "Client is required" });
    }
    const total = Number(values.total_amount);
    const deposit = Number(values.deposit_amount);
    if (
      values.total_amount !== "" &&
      !Number.isNaN(total) &&
      values.deposit_amount !== "" &&
      !Number.isNaN(deposit) &&
      deposit > total
    ) {
      ctx.addIssue({ code: "custom", path: ["deposit_amount"], message: "Deposit can't exceed the total" });
    }
  });

type FormValues = z.infer<typeof schema>;

interface BookingFormProps {
  eventType: EventType;
  booking?: BookingRow;
  presetClientId?: string;
  onSuccess?: (bookingId?: string) => void;
  onCancel?: () => void;
}

export function BookingForm({ eventType, booking, presetClientId, onSuccess, onCancel }: BookingFormProps) {
  const { session, currency } = useAuth();
  const { data: clients } = useClients();
  const createBooking = useCreateBooking();
  const updateBooking = useUpdateBooking();
  const editing = !!booking;

  const isWedding = eventType === "Wedding";

  const clientOptions = useMemo(
    () => (clients ?? []).map((c) => ({ value: c.id, label: c.full_name })),
    [clients],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: booking
      ? {
          title: booking.title,
          client_id: booking.client_id,
          booking_date: booking.booking_date ?? "",
          start_time: booking.start_time ?? "",
          end_time: booking.end_time ?? "",
          location: booking.location ?? "",
          package_name: booking.package_name ?? "",
          shoot_type: booking.shoot_type,
          album: booking.album,
          total_amount: booking.total_amount != null ? String(booking.total_amount) : "",
          deposit_amount: booking.deposit_amount != null ? String(booking.deposit_amount) : "",
          notes: booking.notes ?? "",
          wedding_hotel_name: booking.wedding_hotel_name ?? "",
          wedding_date: booking.wedding_date ?? "",
          homecoming_hotel_name: booking.homecoming_hotel_name ?? "",
          homecoming_date: booking.homecoming_date ?? "",
          wedding_album: booking.wedding_album,
          pre_shoot_album: booking.pre_shoot_album,
          family_album: booking.family_album,
          group_photo_size: booking.group_photo_size ?? "",
          homecoming_photo_size: booking.homecoming_photo_size ?? "",
          wedding_photo_sizes: booking.wedding_photo_sizes ?? [],
          extra_thank_you_cards_qty:
            booking.extra_thank_you_cards_qty != null ? String(booking.extra_thank_you_cards_qty) : "",
        }
      : {
          title: "",
          client_id: presetClientId ?? "",
          booking_date: "",
          start_time: "",
          end_time: "",
          location: "",
          package_name: "",
          shoot_type: "Photography",
          album: "No",
          total_amount: "",
          deposit_amount: "",
          notes: "",
          wedding_hotel_name: "",
          wedding_date: "",
          homecoming_hotel_name: "",
          homecoming_date: "",
          wedding_album: false,
          pre_shoot_album: false,
          family_album: false,
          group_photo_size: "",
          homecoming_photo_size: "",
          wedding_photo_sizes: [],
          extra_thank_you_cards_qty: "",
        },
  });

  const watchWeddingDate = useWatch({ control: form.control, name: "wedding_date" });

  useEffect(() => {
    if (isWedding && watchWeddingDate) {
      form.setValue("booking_date", watchWeddingDate, { shouldValidate: true });
    }
  }, [isWedding, watchWeddingDate, form]);

  const isSubmitting = createBooking.isPending || updateBooking.isPending;
  const errorMessage = createBooking.error || updateBooking.error;

  const onSubmit = async (values: FormValues) => {
    if (!session) return;
    const clean = (v?: string) => (v?.trim() ? v.trim() : null);
    const toNumber = (v?: string) => {
      const n = v ? parseFloat(v) : NaN;
      return Number.isNaN(n) ? null : n;
    };

    const base = {
      user_id: session.user.id,
      client_id: values.client_id,
      title: values.title.trim(),
      event_type: eventType,
      package_name: clean(values.package_name),
      shoot_type: values.shoot_type,
      status: editing ? booking?.status : ("pending" as const),
      total_amount: toNumber(values.total_amount),
      deposit_amount: toNumber(values.deposit_amount),
      notes: clean(values.notes),
    };

    const payload = isWedding
      ? {
          ...base,
          booking_date: values.wedding_date || null,
          start_time: null,
          end_time: null,
          location: null,
          album: "No" as const,
          wedding_hotel_name: clean(values.wedding_hotel_name),
          wedding_date: values.wedding_date || null,
          homecoming_hotel_name: clean(values.homecoming_hotel_name),
          homecoming_date: values.homecoming_date || null,
          wedding_album: values.wedding_album,
          pre_shoot_album: values.pre_shoot_album,
          family_album: values.family_album,
          group_photo_size: clean(values.group_photo_size),
          homecoming_photo_size: clean(values.homecoming_photo_size),
          wedding_photo_sizes: values.wedding_photo_sizes,
          extra_thank_you_cards_qty: Number(values.extra_thank_you_cards_qty) || 0,
        }
      : {
          ...base,
          booking_date: values.booking_date || null,
          start_time: clean(values.start_time),
          end_time: clean(values.end_time),
          location: clean(values.location),
          album: values.album,
        };

    let resultId = booking?.id;
    if (editing && booking) {
      await updateBooking.mutateAsync({ id: booking.id, patch: payload });
    } else {
      const created = await createBooking.mutateAsync(payload);
      resultId = created.id;
    }
    onSuccess?.(resultId);
  };

  return (
    <FormProvider {...form}>
      <View style={styles.form}>
        <View style={styles.eventBanner}>
          <Text style={styles.eventIcon}>{EVENT_TYPE_MAP[eventType].label}</Text>
          <Text style={styles.eventLabel}>{EVENT_TYPE_MAP[eventType].label} booking</Text>
        </View>

        <TextFormField name="title" label="Title & Job ID" placeholder="e.g. Wedding Photography Session" required />
        <SelectFormField name="client_id" label="Client" options={clientOptions} required />

        {isWedding ? (
          <>
            <WeddingDetailsGroup />
            <AlbumsGroup />
            <PhotoSizesGroup />
          </>
        ) : (
          <ScheduleGroup />
        )}

        <PricingGroup currency={currency} />
        <TextFormField name="notes" label="Special Requests / Notes" placeholder="Additional details" multiline numberOfLines={3} />

        {errorMessage ? <Text style={styles.error}>{getErrorMessage(errorMessage)}</Text> : null}

        <FormActions
          submitLabel={editing ? "Save Changes" : "Create Booking"}
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
  eventBanner: {
    backgroundColor: palette.backgroundGold,
    borderWidth: 1,
    borderColor: palette.gold,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  eventIcon: { fontSize: 18, fontWeight: "800", color: palette.gold },
  eventLabel: { fontSize: 13, color: palette.onSurfaceVariant },
  error: { color: palette.error, fontSize: 13, textAlign: "center" },
});