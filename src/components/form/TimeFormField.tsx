import { useState } from "react";
import { View } from "react-native";
import { Controller, useFormContext } from "react-hook-form";
import { Text, TextInput } from "react-native-paper";
import { TimePickerModal } from "react-native-paper-dates";

import { palette, spacing } from "@/theme";

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
        <TimeFieldInput
          label={label}
          value={value}
          error={!!error}
          errorMessage={error?.message}
          onChange={onChange}
        />
      )}
    />
  );
}

function TimeFieldInput({
  label,
  value,
  error,
  errorMessage,
  onChange,
}: {
  label: string;
  value?: string;
  error: boolean;
  errorMessage?: string;
  onChange: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [hours, minutes] = (value || "12:00")
    .split(":")
    .map((n: string) => parseInt(n, 10) || 0);
  return (
    <View>
      <TextInput
        mode="outlined"
        label={label}
        value={value || ""}
        showSoftInputOnFocus={false}
        onFocus={() => setVisible(true)}
        error={error}
        outlineColor={palette.outline}
        activeOutlineColor={palette.primary}
        style={{ backgroundColor: palette.surface }}
        right={<TextInput.Icon icon="clock-outline" onPress={() => setVisible(true)} />}
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
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = { error: { color: palette.error, fontSize: 12, marginTop: spacing.xs } };
