import type { ComponentProps } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Text, TextInput } from "react-native-paper";

import { palette, spacing } from "@/theme";

interface TextFormFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  keyboardType?: ComponentProps<typeof TextInput>["keyboardType"];
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  left?: React.ReactNode;
  right?: React.ReactNode;
  dense?: boolean;
  mode?: "flat" | "outlined";
  required?: boolean;
}

export function TextFormField({
  name,
  label,
  required,
  ...rest
}: TextFormFieldProps) {
  const { control } = useFormContext();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <TextInput
          mode="outlined"
          label={required ? `${label} *` : label}
          value={value ?? ""}
          onChangeText={onChange}
          onBlur={onBlur}
          error={!!error}
          outlineColor={palette.outline}
          activeOutlineColor={palette.primary}
          style={{ backgroundColor: palette.surface }}
          {...rest}
        />
      )}
    />
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <Text style={styles.error}>{message}</Text>;
}

export function FieldSpacer() {
  return <Text style={styles.spacer}>{""}</Text>;
}

const styles = { error: { color: palette.error, fontSize: 12, marginTop: spacing.xs }, spacer: { fontSize: 6 } };
