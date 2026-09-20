import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { AppHeader, KeyboardScreen } from "@/components/ui/Screen";
import { PaymentScheduleForm } from "@/forms/PaymentScheduleForm";
import { palette, spacing } from "@/theme";

export default function NewPaymentScreen() {
  const params = useLocalSearchParams<{ bookingId?: string }>();

  return (
    <KeyboardScreen>
      <AppHeader title="New Payment Schedule" showBack />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.subtitle}>
            Link a schedule to a booking and track it through installments.
          </Text>
          <PaymentScheduleForm
            presetBookingId={params.bookingId}
            onSuccess={() => router.back()}
            onCancel={() => router.back()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 80 },
  subtitle: { fontSize: 14, color: palette.onSurfaceVariant, marginBottom: spacing.lg },
});
