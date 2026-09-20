import { useState, type ReactNode } from "react";
import { Platform, StyleSheet, TextInput as NativeTextInput, View } from "react-native";
import { Controller, useFormContext } from "react-hook-form";
import { Text as PaperText, TextInput as PaperInput } from "react-native-paper";
import { TimePickerModal } from "react-native-paper-dates";

import { palette, radius, spacing } from "@/theme";
import { FieldLabel } from "./FieldLabel";

interface TimeFormFieldProps {
  name: string;
  label: string;
}

export function TimeFormField({ name, label }: TimeFormFieldProps) {
  const { control } = useFormContext();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <>
          <FieldLabel label={label} />
          {Platform.OS === "web" ? (
            <WebTimeInput value={value} errorMessage={error?.message} onChange={onChange} />
          ) : (
            <NativeTimeInput
              label={label}
              value={value}
              errorMessage={error?.message}
              onChange={onChange}
            />
          )}
        </>
      )}
    />
  );
}

function WebTimeInput({
  value,
  errorMessage,
  onChange,
}: {
  value?: string;
  errorMessage?: string;
  onChange: (v: string) => void;
}) {
  const inputProps = {
    type: "time",
    value: value ?? "",
    placeholder: "Select time",
    onChange: (e: unknown) => {
      const el = e as React.ChangeEvent<HTMLInputElement>;
      onChange(el.target?.value ?? "");
    },
    style: [
      styles.webInput,
      errorMessage ? styles.webInputError : null,
      { backgroundColor: palette.surfaceVariant, color: palette.onSurface },
    ],
    testID: "time-input",
  } as React.ComponentProps<typeof NativeTextInput>;
  return (
    <View style={{ gap: 6 }}>
      <NativeTextInput {...inputProps} />
      {errorMessage ? <PaperText style={styles.error}>{errorMessage}</PaperText> : null}
    </View>
  );
}

function NativeTimeInput({
  label,
  value,
  errorMessage,
  onChange,
}: {
  label: string;
  value?: string;
  errorMessage?: string;
  onChange: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [hours, minutes] = (value || "12:00")
    .split(":")
    .map((n: string) => parseInt(n, 10) || 0);
  const icon: ReactNode = (
    <PaperInput.Icon icon="clock-outline" onPress={() => setVisible(true)} />
  );
  return (
    <View style={{ gap: 6 }}>
      <PaperInput
        mode="outlined"
        label={label}
        value={value || ""}
        showSoftInputOnFocus={false}
        onFocus={() => setVisible(true)}
        error={!!errorMessage}
        outlineColor={palette.outline}
        activeOutlineColor={palette.primary}
        style={{ backgroundColor: palette.surfaceVariant }}
        right={icon}
      />
      <TimePickerModal
        visible={visible}
        onDismiss={() => setVisible(false)}
        hours={hours}
        minutes={minutes}
        onConfirm={({ hours: h, minutes: m }) => {
          onChange(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
          setVisible(false);
        }}
      />
      {errorMessage ? <PaperText style={styles.error}>{errorMessage}</PaperText> : null}
    </View>
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