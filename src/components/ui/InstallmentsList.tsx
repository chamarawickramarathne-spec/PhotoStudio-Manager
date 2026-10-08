import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { IconButton, List, Text as PaperText } from "react-native-paper";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAppToast } from "@/components/ui/ToastProvider";
import { useDeleteInstallment, type InstallmentRow } from "@/hooks/queries/payments";
import { PAYMENT_METHOD_LABEL, PAYMENT_METHODS } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";
import { getErrorMessage } from "@/lib/utils";
import { palette, radius, spacing } from "@/theme";

interface InstallmentsListProps {
  scheduleId: string | undefined;
  installments: InstallmentRow[] | undefined;
  currency: string;
}

export function InstallmentsList({ scheduleId, installments, currency }: InstallmentsListProps) {
  const toast = useAppToast();
  const deleteInstallment = useDeleteInstallment();
  const [pending, setPending] = useState<InstallmentRow | null>(null);

  if (!installments || installments.length === 0) return null;

  const onDelete = async () => {
    if (!pending || !scheduleId) return;
    try {
      await deleteInstallment.mutateAsync({ id: pending.id, schedule_id: scheduleId });
      toast.show("Installment deleted");
    } catch (error) {
      toast.show(getErrorMessage(error));
    }
    setPending(null);
  };

  return (
    <>
      <View style={styles.list}>
        {installments.map((inst) => (
          <List.Item
            key={inst.id}
            title={formatMoney(inst.amount, currency)}
            description={formatDate(inst.paid_date)}
            left={() => (
              <List.Icon
                icon={PAYMENT_METHODS.find((m) => m.value === inst.payment_method)?.icon ?? "cash"}
                color={palette.primary}
              />
            )}
            right={() => (
              <View style={styles.right}>
                <PaperText style={styles.methodLabel}>
                  {PAYMENT_METHOD_LABEL[inst.payment_method ?? "other"] ?? "Other"}
                </PaperText>
                <IconButton
                  icon="trash-can-outline"
                  size={18}
                  iconColor={palette.danger}
                  accessibilityLabel="Delete installment"
                  onPress={() => setPending(inst)}
                />
              </View>
            )}
            style={styles.item}
          />
        ))}
      </View>
      <ConfirmDialog
        visible={pending != null}
        danger
        title="Delete Installment?"
        message={
          pending
            ? `Delete this ${formatMoney(pending.amount, currency)} installment? The schedule's paid amount and status will be recalculated.`
            : ""
        }
        confirmLabel="Delete"
        loading={deleteInstallment.isPending}
        onCancel={() => setPending(null)}
        onConfirm={() => void onDelete()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  item: { backgroundColor: palette.surface, borderRadius: radius.md, paddingHorizontal: spacing.sm },
  right: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  methodLabel: { fontSize: 12, color: palette.onSurfaceVariant, alignSelf: "center" },
});