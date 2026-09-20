import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Text as PaperText } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import { AppHeader, KeyboardScreen } from "@/components/ui/Screen";
import { BookingForm } from "@/forms/BookingForm";
import { EVENT_TYPES } from "@/lib/constants";
import type { EventType } from "@/lib/constants";
import { palette, radius, spacing } from "@/theme";

export default function NewBookingScreen() {
  const params = useLocalSearchParams<{ clientId?: string }>();
  const [eventType, setEventType] = useState<EventType | null>(null);

  if (!eventType) {
    return (
      <KeyboardScreen>
        <AppHeader title="New Booking" showBack />
        <ScrollView contentContainerStyle={styles.wizardContent}>
          <Text style={styles.title}>What kind of event?</Text>
          <PaperText style={styles.subtitle}>Select the event type to build the right booking form.</PaperText>

          <View style={styles.grid}>
            {EVENT_TYPES.map((type) => (
              <Pressable
                key={type.value}
                onPress={() => setEventType(type.value)}
                style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
              >
                <View style={[styles.tileIcon, { backgroundColor: `${type.color}14` }]}>
                  <Ionicons name={type.icon} size={26} color={type.color} />
                </View>
                <Text style={styles.tileLabel}>{type.label}</Text>
                {type.value === "Wedding" ? (
                  <Text style={styles.tileHint}>Special wedding form</Text>
                ) : (
                  <Text style={styles.tileHint}>Standard session</Text>
                )}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </KeyboardScreen>
    );
  }

  return (
    <KeyboardScreen>
      <AppHeader
        title="New Booking"
        showBack
        right={
          <Button
            onPress={() => setEventType(null)}
            labelStyle={{ fontSize: 13, fontWeight: "600" }}
          >
            Change type
          </Button>
        }
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          <BookingForm
            eventType={eventType}
            presetClientId={params.clientId}
            onCancel={() => router.back()}
            onSuccess={(id) => {
              if (id) router.replace(`/booking/${id}`);
              else router.back();
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wizardContent: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 26, fontWeight: "800", color: palette.onBackground },
  subtitle: { fontSize: 14, color: palette.onSurfaceVariant, marginTop: 4, marginBottom: spacing.xl },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  tile: {
    width: "47%",
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pressed: { opacity: 0.7 },
  tileIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: { fontSize: 16, fontWeight: "700", color: palette.onBackground },
  tileHint: { fontSize: 12, color: palette.onSurfaceVariant },
  formContent: { padding: 16, paddingBottom: 80 },
});
