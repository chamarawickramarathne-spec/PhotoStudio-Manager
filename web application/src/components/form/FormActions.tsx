import { useWindowDimensions, View, type StyleProp, type ViewStyle } from "react-native";
import { Button } from "react-native-paper";

import { palette, radius, spacing } from "@/theme";

interface FormActionsProps {
  submitLabel: string;
  submitting?: boolean;
  onSubmit: () => void;
  onCancel?: () => void;
}

export function FormActions({ submitLabel, submitting, onSubmit, onCancel }: FormActionsProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 640;

  const cancelButton = onCancel ? (
    <Button
      mode="outlined"
      onPress={onCancel}
      disabled={submitting}
      style={styles.actionBtn}
      contentStyle={styles.content}
      textColor={palette.onSurfaceVariant}
    >
      Cancel
    </Button>
  ) : null;

  const submitButton = (
    <Button
      mode="contained"
      onPress={onSubmit}
      loading={submitting}
      disabled={submitting}
      style={styles.actionBtn}
      contentStyle={styles.content}
    >
      {submitLabel}
    </Button>
  );

  if (!isWide) {
    const style: StyleProp<ViewStyle> = { gap: spacing.sm, marginTop: spacing.sm };
    if (cancelButton) {
      return (
        <View style={style}>
          {cancelButton}
          {submitButton}
        </View>
      );
    }
    return (
      <View style={style}>
        {submitButton}
      </View>
    );
  }

  return (
    <View style={styles.wideRow}>
      {cancelButton}
      {submitButton}
    </View>
  );
}

const styles = {
  wideRow: {
    flexDirection: "row" as const,
    justifyContent: "flex-end" as const,
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionBtn: { borderRadius: radius.md, minWidth: 132 },
  content: { height: 46 },
};