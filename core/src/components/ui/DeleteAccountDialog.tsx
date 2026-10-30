import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Button, Dialog, TextInput } from "react-native-paper";

import { useBackIntercept } from "@/components/ui/BackHandlerProvider";
import { palette } from "@/theme";

interface DeleteAccountDialogProps {
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteAccountDialog({ loading, onCancel, onConfirm }: DeleteAccountDialogProps) {
  const [confirmation, setConfirmation] = useState("");
  const canDelete = confirmation.trim() === "DELETE";
  useBackIntercept(!loading, onCancel);

  return (
    <Dialog visible onDismiss={loading ? undefined : onCancel}>
      <Dialog.Icon icon="alert" color={palette.danger} size={40} />
      <Dialog.Title style={styles.title}>Delete account?</Dialog.Title>
      <Dialog.Content>
        <Text style={styles.message}>
          This permanently deletes your account, clients, bookings, payment records, and invoices.
          This action cannot be undone.
        </Text>
        <TextInput
          mode="outlined"
          label="Type DELETE to confirm"
          value={confirmation}
          onChangeText={setConfirmation}
          autoCapitalize="characters"
          autoCorrect={false}
          disabled={loading}
          style={styles.input}
          outlineColor={palette.danger}
          activeOutlineColor={palette.danger}
        />
      </Dialog.Content>
      <Dialog.Actions>
        <Button mode="text" onPress={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          mode="contained"
          buttonColor={palette.danger}
          onPress={onConfirm}
          loading={loading}
          disabled={!canDelete || loading}
        >
          Delete account
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  title: { textAlign: "center" },
  message: { color: palette.onSurfaceVariant, textAlign: "center", marginBottom: 16 },
  input: { backgroundColor: palette.surface },
});
