import { useState } from "react";
import { View } from "react-native";
import { Controller, useFormContext } from "react-hook-form";
import { Menu, Text, TextInput } from "react-native-paper";

import { palette, spacing } from "@/theme";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFormFieldProps {
  name: string;
  label: string;
  options: SelectOption[];
  required?: boolean;
  disabled?: boolean;
}

export function SelectFormField({ name, label, options, required, disabled }: SelectFormFieldProps) {
  const { control } = useFormContext();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <SelectFieldInput
          label={required ? `${label} *` : label}
          options={options}
          value={value}
          error={!!error}
          errorMessage={error?.message}
          disabled={disabled}
          onChange={onChange}
        />
      )}
    />
  );
}

function SelectFieldInput({
  label,
  options,
  value,
  error,
  errorMessage,
  disabled,
  onChange,
}: {
  label: string;
  options: SelectOption[];
  value?: string;
  error: boolean;
  errorMessage?: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <View>
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <TextInput
            mode="outlined"
            label={label}
            value={selected?.label ?? ""}
            showSoftInputOnFocus={false}
            onFocus={() => !disabled && setVisible(true)}
            disabled={disabled}
            error={error}
            outlineColor={palette.outline}
            activeOutlineColor={palette.primary}
            style={{ backgroundColor: palette.surface }}
            right={<TextInput.Icon icon="chevron-down" onPress={() => !disabled && setVisible(true)} />}
          />
        }
      >
        {options.map((option) => (
          <Menu.Item
            key={option.value}
            title={option.label}
            onPress={() => {
              onChange(option.value);
              setVisible(false);
            }}
            titleStyle={value === option.value ? { fontWeight: "700", color: palette.primary } : undefined}
          />
        ))}
      </Menu>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = { error: { color: palette.error, fontSize: 12, marginTop: spacing.xs } };
