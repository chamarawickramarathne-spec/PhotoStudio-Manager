import { StyleSheet, View } from "react-native";
import { Controller, useFormContext } from "react-hook-form";
import { Text as PaperText } from "react-native-paper";

import { palette, radius, spacing } from "@/theme";
import { FieldLabel } from "./FieldLabel";

interface DateFormFieldProps {
  name: string;
  label: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

export function DateFormField({ name, label, required, minDate, maxDate }: DateFormFieldProps) {
  const { control } = useFormContext();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const min = minDate ? minDate.toISOString().slice(0, 10) : undefined;
        const max = maxDate ? maxDate.toISOString().slice(0, 10) : undefined;
        return (
          <>
            <FieldLabel label={label} required={required} />
            <View style={{ gap: 6 }}>
              <input
                type="date"
                value={value ?? ""}
                min={min}
                max={max}
                placeholder="Select date"
                aria-label={label}
                data-testid="date-input"
                onChange={(e) => onChange(e.target.value)}
                style={{
                  ...pickerInput,
                  ...(error?.message ? pickerInputError : null),
                  backgroundColor: palette.surfaceVariant,
                  color: palette.onSurface,
                }}
              />
              {error?.message ? <PaperText style={styles.error}>{error.message}</PaperText> : null}
            </View>
          </>
        );
      }}
    />
  );
}

const pickerInput: React.CSSProperties = {
  minHeight: 48,
  width: "100%",
  boxSizing: "border-box",
  borderRadius: radius.md,
  borderWidth: 1,
  borderColor: palette.outline,
  padding: 0,
  paddingLeft: spacing.lg,
  paddingRight: spacing.lg,
  fontSize: 15,
  fontFamily: "inherit",
  colorScheme: "light",
  cursor: "pointer",
};

const pickerInputError: React.CSSProperties = { borderColor: palette.error };

const styles = StyleSheet.create({
  error: { color: palette.error, fontSize: 12, marginTop: 6 },
});
