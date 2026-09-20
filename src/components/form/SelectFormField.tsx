import { useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Controller, useFormContext } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";

import { palette, radius, spacing } from "@/theme";
import { FieldLabel } from "./FieldLabel";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFormFieldProps {
  name: string;
  label: string;
  options: SelectOption[];
  required?: boolean;
  disabled?: boolean;
}

export function SelectFormField({ name, label, options, required, disabled }: SelectFormFieldProps) {
  const { control } = useFormContext();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <SelectFieldInput
          label={label}
          required={required}
          options={options}
          value={value}
          errorMessage={error?.message}
          disabled={disabled}
          onChange={onChange}
        />
      )}
    />
  );
}

interface Anchor {
  x: number;
  y: number;
  w: number;
  h: number;
}

function SelectFieldInput({
  label,
  required,
  options,
  value,
  errorMessage,
  disabled,
  onChange,
}: {
  label: string;
  required?: boolean;
  options: SelectOption[];
  value?: string;
  errorMessage?: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const triggerRef = useRef<View>(null);

  const selected = options.find((o) => o.value === value);
  const fallback = !!value && !selected;
  const display = selected?.label ?? (fallback ? "Unavailable selection" : "");
  const items: SelectOption[] = fallback
    ? [{ value: value ?? "", label: "Previously selected (no longer available)" }, ...options]
    : options;

  const openMenu = () => {
    if (disabled) return;
    triggerRef.current?.measureInWindow((x, y, w, h) => {
      setAnchor({ x, y, w, h });
      setOpen(true);
    });
  };

  return (
    <View>
      <FieldLabel label={label} required={required} />
      <Pressable
        ref={triggerRef}
        onPress={openMenu}
        disabled={disabled}
        style={[
          styles.trigger,
          errorMessage ? styles.triggerError : null,
          disabled ? styles.disabled : null,
          { backgroundColor: palette.surfaceVariant },
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text
          numberOfLines={1}
          style={[styles.triggerValue, !selected && !fallback ? styles.placeholder : null]}
        >
          {display || "Select..."}
        </Text>
        <Ionicons name="chevron-down" size={16} color={palette.onSurfaceVariant} />
      </Pressable>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        {anchor ? (
          <View
            style={[
              styles.panel,
              {
                left: Math.max(anchor.x, 8),
                top: anchor.y + anchor.h + 4,
                width: Math.min(Math.max(anchor.w, 200), 360),
              },
            ]}
          >
            <ScrollView keyboardShouldPersistTaps="handled" style={styles.panelScroll} nestedScrollEnabled>
              {items.map((item) => {
                const isSelected = value === item.value;
                return (
                  <Pressable
                    key={item.value}
                    style={[styles.item, isSelected ? styles.itemSelected : null]}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                  >
                    <Ionicons
                      name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                      size={18}
                      color={isSelected ? palette.gold : palette.outline}
                    />
                    <Text
                      numberOfLines={2}
                      style={[styles.itemLabel, isSelected ? styles.itemLabelSelected : null]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.outline,
    gap: spacing.sm,
  },
  triggerError: { borderColor: palette.error },
  disabled: { opacity: 0.5 },
  triggerValue: { fontSize: 15, color: palette.onSurface, flex: 1 },
  placeholder: { color: palette.onSurfaceVariant },
  error: { color: palette.error, fontSize: 12, marginTop: 6 },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  panel: {
    position: "absolute",
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.outline,
    maxHeight: 260,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    overflow: "hidden",
  },
  panelScroll: { maxHeight: 260 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  itemSelected: { backgroundColor: palette.secondaryContainer },
  itemLabel: { flex: 1, fontSize: 14, color: palette.onSurface },
  itemLabelSelected: { fontWeight: "700", color: palette.onSecondaryContainer },
});