import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "react-native-paper";
import { Link } from "expo-router";

import { KeyboardScreen } from "@/components/ui/Screen";
import { TextFormField } from "@/components/form/TextFormField";
import { BrandHeader } from "@/components/ui/BrandHeader";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/utils";
import { palette, spacing } from "@/theme";

const schema = z.object({
  email: z.email("Enter a valid email"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotScreen() {
  const { resetPassword } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setInfo(null);
    try {
      await resetPassword(values.email);
      setInfo("Reset link sent! Check your email to set a new password.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <KeyboardScreen>
      <View style={styles.container}>
        <BrandHeader subtitle="Reset your password" />
        <FormProvider {...form}>
          <View style={styles.form}>
            <TextFormField name="email" label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" required />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {info ? <Text style={styles.info}>{info}</Text> : null}
            <Button
              mode="contained"
              onPress={form.handleSubmit(onSubmit)}
              loading={form.formState.isSubmitting}
              disabled={form.formState.isSubmitting}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Send Reset Link
            </Button>
            <View style={styles.links}>
              <Link href="/login" style={styles.link}>
                Back to log in
              </Link>
            </View>
          </View>
        </FormProvider>
      </View>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
    paddingBottom: 48,
  },
  form: { gap: spacing.lg },
  error: { color: palette.error, fontSize: 13, textAlign: "center" },
  info: { color: palette.tertiary, fontSize: 13, textAlign: "center" },
  button: { borderRadius: 999, paddingVertical: 4 },
  buttonContent: { height: 48 },
  links: { alignItems: "center", marginTop: spacing.sm },
  link: { color: palette.primary, fontWeight: "600", fontSize: 14 },
});
