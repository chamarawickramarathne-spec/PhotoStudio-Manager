import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useForm, useWatch, useFormContext, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Switch, Text } from "react-native-paper";

import { TextFormField } from "@/components/form/TextFormField";
import { SelectFormField } from "@/components/form/SelectFormField";
import { DateFormField } from "@/components/form/DateFormField";
import { TimeFormField } from "@/components/form/TimeFormField";
import { ChipMultiSelect } from "@/components/form/ChipMultiSelect";
import { useClients } from "@/hooks/queries/clients";
import { useCreateBooking, useUpdateBooking, type BookingRow } from "@/hooks/queries/bookings";
import { useAuth } from "@/hooks/useAuth";
import {
  EVENT_TYPE_MAP,
  GROUP_PHOTO_SIZES,
  HOMECOMING_PHOTO_SIZES,
  PHOTO_SIZES,
  SHOOT_TYPES,
} from "@/lib/constants";
import type { EventType } from "@/lib/constants";
import { getErrorMessage } from "@/lib/utils";
import { palette, radius, spacing } from "@/theme";

const schema = z
  .object({
    title: z.string().min(1, "Title is required"),
    client_id: z.string().min(1, "Client is required"),
    booking_date: z.string().optional(),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    location: z.string().optional(),
    package_name: z.string().optional(),
    shoot_type: z.enum(SHOOT_TYPES),
    album: z.enum(["Yes", "No"]),
    total_amount: z.string().optional(),
    deposit_amount: z.string().optional(),
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
    extra_thank_you_cards_qty: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.client_id && values.client_id === "none") {
      ctx.addIssue({ code: "custom", path: ["client_id"], message: "Client is required" });
    }
  });

type FormValues = z.infer<typeof schema>;

interface BookingFormProps {
  eventType: EventType;
  booking?: BookingRow;
  presetClientId?: string;
  onSuccess?: (bookingId?: string) => void;
}

export function BookingForm({ eventType, booking, presetClientId, onSuccess }: BookingFormProps) {
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
            <Text style={styles.section}>Wedding Details</Text>
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <TextFormField name="wedding_hotel_name" label="Wedding Hotel" placeholder="Hotel name" />
              </View>
              <View style={styles.rowItem}>
                <DateFormField name="wedding_date" label="Wedding Date" required minDate={new Date()} />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <TextFormField name="homecoming_hotel_name" label="Homecoming Hotel" placeholder="Hotel name" />
              </View>
              <View style={styles.rowItem}>
                <DateFormField name="homecoming_date" label="Homecoming Date" minDate={new Date()} />
              </View>
            </View>

            <Text style={styles.section}>Albums</Text>
            <View style={styles.toggles}>
              <WeddingToggle name="wedding_album" label="Wedding Album" />
              <WeddingToggle name="pre_shoot_album" label="Pre-shoot Album" />
              <WeddingToggle name="family_album" label="Family Album" />
            </View>

            <Text style={styles.section}>Photo Sizes</Text>
            <SelectFormField
              name="group_photo_size"
              label="Group Photo Size"
              options={GROUP_PHOTO_SIZES.map((s) => ({ value: s, label: s }))}
            />
            <SelectFormField
              name="homecoming_photo_size"
              label="Homecoming Photo Size"
              options={HOMECOMING_PHOTO_SIZES.map((s) => ({ value: s, label: s }))}
            />
            <WeddingPhotoSizes />
            <TextFormField
              name="extra_thank_you_cards_qty"
              label="Extra Thank You Cards Qty"
              placeholder="0"
              keyboardType="number-pad"
            />
          </>
        ) : (
          <>
            <Text style={styles.section}>Schedule</Text>
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <DateFormField name="booking_date" label="Booking Date" required minDate={new Date()} />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <TimeFormField name="start_time" label="Start Time" />
              </View>
              <View style={styles.rowItem}>
                <TimeFormField name="end_time" label="End Time" />
              </View>
            </View>
            <TextFormField name="location" label="Location" placeholder="Event location" />
            <SelectFormField name="album" label="Album" options={[{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }]} />
          </>
        )}

        <Text style={styles.section}>Package & Pricing</Text>
        <TextFormField name="package_name" label="Package Name" placeholder="e.g. Wedding Premium" />
        <SelectFormField
          name="shoot_type"
          label="Shoot Type"
          options={SHOOT_TYPES.map((s) => ({ value: s, label: s }))}
        />
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <TextFormField name="total_amount" label={`Total Amount (${currency})`} placeholder="0.00" keyboardType="decimal-pad" />
          </View>
          <View style={styles.rowItem}>
            <TextFormField name="deposit_amount" label={`Deposit (${currency})`} placeholder="0.00" keyboardType="decimal-pad" />
          </View>
        </View>
        <TextFormField name="notes" label="Special Requests / Notes" placeholder="Additional details" multiline numberOfLines={3} />

        {errorMessage ? <Text style={styles.error}>{getErrorMessage(errorMessage)}</Text> : null}

        <Button
          mode="contained"
          onPress={form.handleSubmit(onSubmit)}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.submit}
          contentStyle={styles.submitContent}
        >
          {editing ? "Save Changes" : "Create Booking"}
        </Button>
      </View>
    </FormProvider>
  );
}

function WeddingToggle({ name, label }: { name: string; label: string }) {
  const { setValue, control } = useFormContext();
  const value = useWatch({ control, name }) ?? false;
  return <ToggleRow label={label} value={value} onChange={(v) => setValue(name, v)} />;
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} color={palette.primary} />
    </View>
  );
}

function WeddingPhotoSizes() {
  const { watch, setValue } = useFormContext();
  const value = watch("wedding_photo_sizes") ?? [];
  return (
    <ChipMultiSelect
      label="Wedding Photo Sizes (select all that apply)"
      options={PHOTO_SIZES}
      value={value}
      onChange={(next) => setValue("wedding_photo_sizes", next)}
    />
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
  section: {
    fontSize: 15,
    fontWeight: "800",
    color: palette.onBackground,
    marginTop: spacing.sm,
  },
  row: { flexDirection: "row", gap: spacing.md },
  rowItem: { flex: 1 },
  toggles: { gap: spacing.xs },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: palette.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  toggleLabel: { fontSize: 14, color: palette.onBackground },
  error: { color: palette.error, fontSize: 13, textAlign: "center" },
  submit: { borderRadius: 999, marginTop: spacing.sm },
  submitContent: { height: 48 },
});
