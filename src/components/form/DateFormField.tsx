import { StyleSheet, TextInput as NativeTextInput, View } from "react-native";
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
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <>
          <FieldLabel label={label} required={required} />
          <View style={{ gap: 6 }}>
            <NativeTextInput
              {...({
                type: "date",
                value: value ?? "",
                min: minDate ? minDate.toISOString().slice(0, 10) : undefined,
                max: maxDate ? maxDate.toISOString().slice(0, 10) : undefined,
                placeholder: "Select date",
                onChange: (e: unknown) => {
                  const el = e as React.ChangeEvent<HTMLInputElement>;
                  onChange(el.target?.value ?? "");
                },
                style: [
                  styles.webInput,
                  error?.message ? styles.webInputError : null,
                  { backgroundColor: palette.surfaceVariant, color: palette.onSurface },
                ],
                testID: "date-input",
              } as React.ComponentProps<typeof NativeTextInput>)}
            />
            {error?.message ? <PaperText style={styles.error}>{error.message}</PaperText> : null}
          </View>
        </>
      )}
    />
  );
}

const styles = StyleSheet.create({
  webInput: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.outline,
    paddingHorizontal: spacing.lg,
    fontSize: 15,
  },
  webInputError: { borderColor: palette.error },
  error: { color: palette.error, fontSize: 12, marginTop: 6 },
});