import { useWindowDimensions, View, type StyleProp, type ViewStyle } from "react-native";
import { Pressable, StyleSheet, Text } from "react-native";
import { useFormContext, useWatch } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";

import { TextFormField } from "@/components/form/TextFormField";
import { SelectFormField } from "@/components/form/SelectFormField";
import { DateFormField } from "@/components/form/DateFormField";
import { TimeFormField } from "@/components/form/TimeFormField";
import { ChipMultiSelect } from "@/components/form/ChipMultiSelect";
import { FormSection } from "@/components/form/FormSection";
import {
  GROUP_PHOTO_SIZES,
  HOMECOMING_PHOTO_SIZES,
  PHOTO_SIZES,
  SHOOT_TYPES,
} from "@/lib/constants";
import { palette, radius, spacing } from "@/theme";

function useWide() {
  const { width } = useWindowDimensions();
  return width >= 640;
}

function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

function Item({ children }: { children: React.ReactNode }) {
  return <View style={styles.item}>{children}</View>;
}

export function WeddingDetailsGroup() {
  return (
    <FormSection title="Wedding Details">
      <Row>
        <Item>
          <TextFormField name="wedding_hotel_name" label="Wedding Hotel" placeholder="Hotel name" />
        </Item>
        <Item>
          <DateFormField name="wedding_date" label="Wedding Date" required minDate={new Date()} />
        </Item>
      </Row>
      <Row>
        <Item>
          <TextFormField name="homecoming_hotel_name" label="Homecoming Hotel" placeholder="Hotel name" />
        </Item>
        <Item>
          <DateFormField name="homecoming_date" label="Homecoming Date" minDate={new Date()} />
        </Item>
      </Row>
    </FormSection>
  );
}

export function AlbumsGroup() {
  const wide = useWide();
  return (
    <FormSection title="Albums">
      <View style={wide ? styles.tilesRow : styles.tilesCol}>
        <AlbumTile name="wedding_album" label="Wedding Album" />
        <AlbumTile name="pre_shoot_album" label="Pre-shoot Album" />
        <AlbumTile name="family_album" label="Family Album" />
      </View>
    </FormSection>
  );
}

function AlbumTile({ name, label }: { name: string; label: string }) {
  const { setValue, control } = useFormContext();
  const value = useWatch({ control, name }) ?? false;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      onPress={() => setValue(name, !value)}
      style={({ pressed }) => [
        styles.albumTile,
        value ? styles.albumTileSelected : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Ionicons
        name={value ? "checkmark-circle" : "ellipse-outline"}
        size={20}
        color={value ? palette.gold : palette.outline}
      />
      <Text style={[styles.albumTileLabel, value ? styles.albumTileLabelSelected : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function PhotoSizesGroup() {
  return (
    <FormSection title="Photo Sizes">
      <Row>
        <Item>
          <SelectFormField
            name="group_photo_size"
            label="Group Photo Size"
            options={GROUP_PHOTO_SIZES.map((s) => ({ value: s, label: s }))}
          />
        </Item>
        <Item>
          <SelectFormField
            name="homecoming_photo_size"
            label="Homecoming Photo Size"
            options={HOMECOMING_PHOTO_SIZES.map((s) => ({ value: s, label: s }))}
          />
        </Item>
      </Row>
      <WeddingPhotoSizes />
      <TextFormField
        name="extra_thank_you_cards_qty"
        label="Extra Thank You Cards Qty"
        placeholder="0"
        keyboardType="number-pad"
      />
    </FormSection>
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

export function ScheduleGroup() {
  const wide = useWide();
  return (
    <FormSection title="Schedule">
      {wide ? (
        <Row>
          <Item>
            <DateFormField name="booking_date" label="Booking Date" required minDate={new Date()} />
          </Item>
          <Item>
            <TimeFormField name="start_time" label="Start Time" />
          </Item>
          <Item>
            <TimeFormField name="end_time" label="End Time" />
          </Item>
        </Row>
      ) : (
        <>
          <DateFormField name="booking_date" label="Booking Date" required minDate={new Date()} />
          <Row>
            <Item>
              <TimeFormField name="start_time" label="Start Time" />
            </Item>
            <Item>
              <TimeFormField name="end_time" label="End Time" />
            </Item>
          </Row>
        </>
      )}
      <TextFormField name="location" label="Location" placeholder="Event location" />
      <SelectFormField
        name="album"
        label="Album"
        options={[
          { value: "Yes", label: "Yes" },
          { value: "No", label: "No" },
        ]}
      />
    </FormSection>
  );
}

export function PricingGroup({ currency }: { currency: string }) {
  return (
    <FormSection title="Package & Pricing">
      <Row>
        <Item>
          <TextFormField name="package_name" label="Package Name" placeholder="e.g. Wedding Premium" />
        </Item>
        <Item>
          <SelectFormField
            name="shoot_type"
            label="Shoot Type"
            options={SHOOT_TYPES.map((s) => ({ value: s, label: s }))}
          />
        </Item>
      </Row>
      <Row>
        <Item>
          <TextFormField
            name="total_amount"
            label={`Total Amount (${currency})`}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        </Item>
        <Item>
          <TextFormField
            name="deposit_amount"
            label={`Deposit (${currency})`}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        </Item>
      </Row>
    </FormSection>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.md },
  item: { flex: 1 },
  tilesRow: { flexDirection: "row", gap: spacing.md },
  tilesCol: { gap: spacing.sm },
  albumTile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.outline,
    backgroundColor: palette.surface,
  },
  albumTileSelected: {
    borderColor: palette.gold,
    backgroundColor: palette.backgroundGold,
  },
  albumTileLabel: { fontSize: 14, color: palette.onSurface },
  albumTileLabelSelected: { fontWeight: "700", color: palette.onBackground },
  pressed: { opacity: 0.7 },
});