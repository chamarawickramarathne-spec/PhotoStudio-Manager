import type { ReactNode } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

import type { BookingRow } from "@/hooks/queries/bookings";
import { formatDate, formatMoney } from "@/lib/format";
import { palette, radius, spacing } from "@/theme";

const EMPTY = "\u2014";

interface PackageDetailsProps {
  booking: BookingRow;
  currency: string;
  depositTotal: number;
  depositPaid: number;
  depositDue: number;
  totalPaid: number;
  totalDue: number;
}

function useWide() {
  const { width } = useWindowDimensions();
  return width >= 640;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

function Field({
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
  const empty = value == null || value.trim().length === 0;
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text
        style={[
          styles.fieldValue,
          empty && styles.fieldValueEmpty,
          highlight && styles.fieldValueHighlight,
          warn && styles.fieldValueWarn,
        ]}
      >
        {empty ? EMPTY : value}
      </Text>
    </View>
  );
}

function AlbumFlag({ label, value }: { label: string; value: boolean }) {
  return (
    <View style={[styles.albumTile, value && styles.albumTileSelected]}>
      <Ionicons
        name={value ? "checkmark-circle" : "ellipse-outline"}
        size={20}
        color={value ? palette.gold : palette.outline}
      />
      <Text style={[styles.albumTileLabel, value && styles.albumTileLabelSelected]}>{label}</Text>
    </View>
  );
}

function SizeChip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name="checkmark-circle" size={16} color={palette.gold} />
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

function ChipField({ label, value }: { label: string; value: string | null | undefined }) {
  const empty = value == null || value.trim().length === 0;
  return (
    <View style={styles.chipField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {empty ? (
        <Text style={[styles.fieldValue, styles.fieldValueEmpty]}>{EMPTY}</Text>
      ) : (
        <SizeChip label={value} />
      )}
    </View>
  );
}

export function PackageDetails({
  booking,
  currency,
  depositTotal,
  depositPaid,
  depositDue,
  totalPaid,
  totalDue,
}: PackageDetailsProps) {
  const wide = useWide();
  const isWedding = booking.event_type === "Wedding";
  const weddingSizes = booking.wedding_photo_sizes ?? [];

  return (
    <View style={styles.root}>
      {isWedding ? (
        <>
          <Section title="Wedding Details">
            <Row>
              <Field label="Wedding Hotel" value={booking.wedding_hotel_name} />
              <Field
                label="Wedding Date"
                value={booking.wedding_date ? formatDate(booking.wedding_date) : null}
              />
            </Row>
            <Row>
              <Field label="Homecoming Hotel" value={booking.homecoming_hotel_name} />
              <Field
                label="Homecoming Date"
                value={booking.homecoming_date ? formatDate(booking.homecoming_date) : null}
              />
            </Row>
          </Section>

          <Section title="Albums">
            <View style={wide ? styles.tilesRow : styles.tilesCol}>
              <AlbumFlag label="Wedding Album" value={booking.wedding_album} />
              <AlbumFlag label="Pre-shoot Album" value={booking.pre_shoot_album} />
              <AlbumFlag label="Family Album" value={booking.family_album} />
            </View>
          </Section>

          <Section title="Photo Sizes">
            <View style={styles.chipFieldsRow}>
              <ChipField label="Group Photo Size" value={booking.group_photo_size} />
              <ChipField label="Homecoming Photo Size" value={booking.homecoming_photo_size} />
              <ChipField
                label="Extra Thank You Cards Qty"
                value={String(booking.extra_thank_you_cards_qty ?? 0)}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Wedding Photo Sizes</Text>
              {weddingSizes.length > 0 ? (
                <View style={styles.chipsRow}>
                  {weddingSizes.map((size) => (
                    <SizeChip key={size} label={size} />
                  ))}
                </View>
              ) : (
                <Text style={[styles.fieldValue, styles.fieldValueEmpty]}>{EMPTY}</Text>
              )}
            </View>
          </Section>
        </>
      ) : (
        <Section title="Schedule">
          {wide ? (
            <Row>
              <Field
                label="Booking Date"
                value={booking.booking_date ? formatDate(booking.booking_date) : null}
              />
              <Field label="Start Time" value={booking.start_time} />
              <Field label="End Time" value={booking.end_time} />
            </Row>
          ) : (
            <>
              <Field
                label="Booking Date"
                value={booking.booking_date ? formatDate(booking.booking_date) : null}
              />
              <Row>
                <Field label="Start Time" value={booking.start_time} />
                <Field label="End Time" value={booking.end_time} />
              </Row>
            </>
          )}
          <Field label="Location" value={booking.location} />
          <Field label="Album" value={booking.album} />
        </Section>
      )}

      <Section title="Package & Pricing">
        <Row>
          <Field label="Package Name" value={booking.package_name} />
          <Field label="Shoot Type" value={booking.shoot_type} />
        </Row>
        <Row>
          <Field
            label="Total Amount"
            value={booking.total_amount != null ? formatMoney(booking.total_amount, currency) : null}
            highlight
          />
          <Field label="Outstanding" value={formatMoney(totalDue, currency)} warn={totalDue > 0} />
        </Row>
        <Row>
          {depositTotal > 0 ? (
            <Field
              label="Deposit"
              value={`${formatMoney(depositPaid, currency)} of ${formatMoney(depositTotal, currency)}`}
              warn={depositDue > 0}
            />
          ) : (
            <Field
              label="Deposit"
              value={booking.deposit_amount != null ? formatMoney(booking.deposit_amount, currency) : null}
            />
          )}
          <Field label="Collected" value={formatMoney(totalPaid, currency)} />
        </Row>
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  section: {
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceVariant,
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  sectionAccent: { width: 3, height: 14, borderRadius: 2, backgroundColor: palette.gold },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  row: { flexDirection: "row", gap: spacing.md },
  chipFieldsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg },
  chipField: { gap: spacing.xs, alignItems: "flex-start" },
  field: { flex: 1, gap: 2, minWidth: 0 },
  fieldLabel: { fontSize: 11, color: palette.onSurfaceVariant },
  fieldValue: { fontSize: 14, fontWeight: "600", color: palette.onBackground },
  fieldValueEmpty: { color: palette.outline, fontWeight: "400" },
  fieldValueHighlight: { fontWeight: "800" },
  fieldValueWarn: { color: palette.warning },
  tilesRow: { flexDirection: "row", gap: spacing.sm },
  tilesCol: { gap: spacing.sm },
  albumTile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.outline,
    backgroundColor: palette.surface,
  },
  albumTileSelected: { borderColor: palette.gold, backgroundColor: palette.backgroundGold },
  albumTileLabel: { fontSize: 13, color: palette.onSurface },
  albumTileLabelSelected: { fontWeight: "700", color: palette.onBackground },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: 2 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.gold,
    backgroundColor: palette.backgroundGold,
  },
  chipLabel: { fontSize: 13, color: palette.onBackground },
});
