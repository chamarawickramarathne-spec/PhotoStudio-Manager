import { Button, Dialog, Text } from "react-native-paper";

import { palette } from "@/theme";

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger,
  loading,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog visible={visible} onDismiss={onCancel}>
      <Dialog.Icon icon={danger ? "alert" : "help-circle"} color={danger ? palette.danger : palette.primary} size={40} />
      <Dialog.Title style={{ textAlign: "center" }}>{title}</Dialog.Title>
      <Dialog.Content>
        <Text variant="bodyMedium" style={{ color: palette.onSurfaceVariant, textAlign: "center" }}>
          {message}
        </Text>
      </Dialog.Content>
      <Dialog.Actions style={{ justifyContent: "center" }}>
        <Button mode="text" onPress={onCancel}>
          {cancelLabel}
        </Button>
        <Button mode="contained" onPress={onConfirm} loading={loading} style={{ backgroundColor: danger ? palette.danger : palette.primary }}>
          {confirmLabel}
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}
