import { useState, type ComponentProps } from "react";
import { View } from "react-native";
import { Controller, useFormContext } from "react-hook-form";
import { Text, TextInput } from "react-native-paper";

import { palette } from "@/theme";
import { FieldLabel } from "./FieldLabel";

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
        <OutlinedInput
          label={label}
          required={required}
          value={value ?? ""}
          onChangeText={onChange}
          onBlur={() => onBlur()}
          errorMessage={error?.message}
          {...rest}
        />
      )}
    />
  );
}

function OutlinedInput({
  label,
  required,
  errorMessage,
  onBlur: externalOnBlur,
  ...rest
}: {
  label: string;
  required?: boolean;
  errorMessage?: string;
  onBlur?: () => void;
} & Omit<ComponentProps<typeof TextInput>, "label" | "mode">) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: 6 }}>
      <FieldLabel label={label} required={required} />
      <TextInput
        mode="outlined"
        outlineColor={errorMessage ? palette.error : palette.outline}
        activeOutlineColor={errorMessage ? palette.error : palette.primary}
        error={!!errorMessage}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          externalOnBlur?.();
        }}
        style={{
          backgroundColor: focused ? palette.surface : palette.surfaceVariant,
        }}
        {...rest}
      />
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <Text style={styles.error}>{message}</Text>;
}

export function FieldSpacer() {
  return <View style={styles.spacer} />;
}

const styles = {
  error: { color: palette.error, fontSize: 12, marginTop: 0 },
  spacer: { height: 6 },
};