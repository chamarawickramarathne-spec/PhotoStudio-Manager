import { useState } from "react";
import { View } from "react-native";
import { Controller, useFormContext } from "react-hook-form";
import { Text, TextInput } from "react-native-paper";
import { DatePickerModal } from "react-native-paper-dates";
import { parseISO } from "date-fns";

import { palette, spacing } from "@/theme";
import { formatDate } from "@/lib/format";

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
        <DateFieldInput
          label={required ? `${label} *` : label}
          value={value}
          error={!!error}
          errorMessage={error?.message}
          minDate={minDate}
          maxDate={maxDate}
          onChange={onChange}
        />
      )}
    />
  );
}

function DateFieldInput({
  label,
  value,
  error,
  errorMessage,
  minDate,
  maxDate,
  onChange,
}: {
  label: string;
  value?: string;
  error: boolean;
  errorMessage?: string;
  minDate?: Date;
  maxDate?: Date;
  onChange: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const current = value ? parseISO(value) : undefined;
  return (
    <View>
      <TextInput
        mode="outlined"
        label={label}
        value={value ? formatDate(value, "MMM d, yyyy") : ""}
        showSoftInputOnFocus={false}
        onFocus={() => setVisible(true)}
        error={error}
        outlineColor={palette.outline}
        activeOutlineColor={palette.primary}
        style={{ backgroundColor: palette.surface }}
        right={<TextInput.Icon icon="calendar" onPress={() => setVisible(true)} />}
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
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = { error: { color: palette.error, fontSize: 12, marginTop: spacing.xs } };
