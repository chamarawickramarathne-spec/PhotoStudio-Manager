import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

import { palette, radius, spacing } from "@/theme";
import { FieldLabel } from "./FieldLabel";

interface ChipMultiSelectProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
}

export function ChipMultiSelect({ label, options, value, onChange }: ChipMultiSelectProps) {
  const toggle = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  return (
    <View style={{ gap: 6 }}>
      <FieldLabel label={label} />
      <View style={styles.grid}>
        {options.map((option) => {
          const selected = value.includes(option);
          return (
            <Pressable
              key={option}
              onPress={() => toggle(option)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              style={({ pressed }) => [
                styles.tile,
                selected ? styles.tileSelected : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <Ionicons
                name={selected ? "checkmark-circle" : "ellipse-outline"}
                size={18}
                color={selected ? palette.gold : palette.outline}
              />
              <Text style={[styles.tileLabel, selected ? styles.tileLabelSelected : null]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 42,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.outline,
    backgroundColor: palette.surface,
  },
  tileSelected: {
    borderColor: palette.gold,
    backgroundColor: palette.backgroundGold,
  },
  tileLabel: { fontSize: 13, color: palette.onSurface },
  tileLabelSelected: { fontWeight: "700", color: palette.onBackground },
  pressed: { opacity: 0.7 },
});