import { StyleSheet, Text } from "react-native";

import { palette } from "@/theme";

interface FieldLabelProps {
  label: string;
  required?: boolean;
}

export function FieldLabel({ label, required }: FieldLabelProps) {
  return (
    <Text style={styles.label}>
      {label}
      {required ? " *" : ""}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: palette.onSurface,
  },
});