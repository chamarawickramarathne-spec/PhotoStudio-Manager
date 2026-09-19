import { useState } from "react";
import { StyleSheet, ScrollView, Text, View } from "react-native";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Text as PaperText } from "react-native-paper";
import { Link } from "expo-router";

import { KeyboardScreen } from "@/components/ui/Screen";
import { TextFormField } from "@/components/form/TextFormField";
import { BrandHeader } from "@/components/ui/BrandHeader";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/utils";
import { palette, spacing } from "@/theme";

const schema = z
  .object({
    fullName: z.string().min(1, "Full name is required"),
    phone: z.string().optional(),
    email: z.email("Enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setInfo(null);
    try {
      const signedIn = await signUp({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        phone: values.phone,
      });
      if (!signedIn) {
        setInfo("Account created! Check your email to confirm your account, then log in.");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <KeyboardScreen>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <BrandHeader subtitle="Create your studio account" />
        <FormProvider {...form}>
          <View style={styles.form}>
            <TextFormField name="fullName" label="Full Name" placeholder="Your name" autoCapitalize="words" required />
            <TextFormField name="email" label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" required />
            <TextFormField name="phone" label="Phone (optional)" placeholder="07x xxx xxxx" keyboardType="phone-pad" />
            <TextFormField name="password" label="Password" placeholder="At least 6 characters" secureTextEntry autoCapitalize="none" required />
            <TextFormField name="confirmPassword" label="Confirm Password" placeholder="Repeat password" secureTextEntry autoCapitalize="none" required />
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
              Create Account
            </Button>
            <View style={styles.links}>
              <PaperText style={styles.muted}>Already have an account?</PaperText>
              <Link href="/login" style={styles.link}>
                Log in
              </Link>
            </View>
          </View>
        </FormProvider>
      </ScrollView>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  form: { gap: spacing.lg },
  error: { color: palette.error, fontSize: 13, textAlign: "center" },
  info: { color: palette.tertiary, fontSize: 13, textAlign: "center" },
  button: { borderRadius: 999, paddingVertical: 4 },
  buttonContent: { height: 48 },
  links: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  muted: { color: palette.onSurfaceVariant, fontSize: 14 },
  link: { color: palette.primary, fontWeight: "600", fontSize: 14 },
});
