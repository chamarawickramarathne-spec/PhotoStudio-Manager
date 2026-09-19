import { StyleSheet, View } from "react-native";
import { Chip, Text } from "react-native-paper";

import { palette, spacing } from "@/theme";

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
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.wrap}>
        {options.map((option) => {
          const selected = value.includes(option);
          return (
            <Chip
              key={option}
              selected={selected}
              onPress={() => toggle(option)}
              style={[styles.chip, selected && styles.chipSelected]}
              selectedColor={palette.white}
              showSelectedCheck={false}
              textStyle={styles.chipText}
            >
              {option}
            </Chip>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    color: palette.onSurfaceVariant,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: palette.surfaceVariant,
    borderColor: palette.outline,
  },
  chipSelected: {
    backgroundColor: palette.primary,
  },
  chipText: {
    fontSize: 13,
  },
});
