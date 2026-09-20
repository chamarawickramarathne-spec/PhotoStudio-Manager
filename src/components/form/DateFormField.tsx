import { useState, type ReactNode } from "react";
import { Platform, StyleSheet, TextInput as NativeTextInput, View } from "react-native";
import { Controller, useFormContext } from "react-hook-form";
import { Text as PaperText, TextInput as PaperInput } from "react-native-paper";
import { DatePickerModal } from "react-native-paper-dates";
import { parseISO } from "date-fns";

import { palette, radius, spacing } from "@/theme";
import { formatDate } from "@/lib/format";
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
          {Platform.OS === "web" ? (
            <WebDateInput
              value={value}
              errorMessage={error?.message}
              minDate={minDate}
              maxDate={maxDate}
              onChange={onChange}
            />
          ) : (
            <NativeDateInput
              label={label}
              value={value}
              errorMessage={error?.message}
              minDate={minDate}
              maxDate={maxDate}
              onChange={onChange}
            />
          )}
        </>
      )}
    />
  );
}

function WebDateInput({
  value,
  errorMessage,
  minDate,
  maxDate,
  onChange,
}: {
  value?: string;
  errorMessage?: string;
  minDate?: Date;
  maxDate?: Date;
  onChange: (v: string) => void;
}) {
  const inputProps = {
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
      errorMessage ? styles.webInputError : null,
      { backgroundColor: palette.surfaceVariant, color: palette.onSurface },
    ],
    testID: "date-input",
  } as React.ComponentProps<typeof NativeTextInput>;
  return (
    <View style={{ gap: 6 }}>
      <NativeTextInput {...inputProps} />
      {errorMessage ? (
        <PaperText style={styles.error}>{errorMessage}</PaperText>
      ) : null}
    </View>
  );
}

function NativeDateInput({
  label,
  value,
  errorMessage,
  minDate,
  maxDate,
  onChange,
}: {
  label: string;
  value?: string;
  errorMessage?: string;
  minDate?: Date;
  maxDate?: Date;
  onChange: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const current = value ? parseISO(value) : undefined;
  const icon: ReactNode = (
    <PaperInput.Icon icon="calendar" onPress={() => setVisible(true)} />
  );
  return (
    <View style={{ gap: 6 }}>
      <PaperInput
        mode="outlined"
        label={label}
        value={value ? formatDate(value, "MMM d, yyyy") : ""}
        showSoftInputOnFocus={false}
        onFocus={() => setVisible(true)}
        error={!!errorMessage}
        outlineColor={palette.outline}
        activeOutlineColor={palette.primary}
        style={{ backgroundColor: palette.surfaceVariant }}
        right={icon}
      />
      <DatePickerModal
        locale="en"
        mode="single"
        visible={visible}
        onDismiss={() => setVisible(false)}
        date={current}
        validRange={{ startDate: minDate, endDate: maxDate }}
        onConfirm={({ date }) => {
          if (date) onChange(date.toISOString().slice(0, 10));
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