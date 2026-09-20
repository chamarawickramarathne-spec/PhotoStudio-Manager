import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, TextInput as PaperInput } from "react-native-paper";
import { Link } from "expo-router";

import { KeyboardScreen } from "@/components/ui/Screen";
import { TextFormField } from "@/components/form/TextFormField";
import { BrandHeader } from "@/components/ui/BrandHeader";
import { AuthCard } from "@/components/ui/AuthCard";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/utils";
import { palette, radius, spacing } from "@/theme";

const schema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await signIn(values.email, values.password);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <KeyboardScreen>
      <View style={styles.container}>
        <BrandHeader subtitle="Welcome back, log in to your studio" />
        <AuthCard>
          <FormProvider {...form}>
            <View style={styles.form}>
              <TextFormField name="email" label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" required />
              <TextFormField
                name="password"
                label="Password"
                placeholder="Your password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                required
                right={<PaperInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword((v) => !v)} />}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button
                mode="contained"
                onPress={form.handleSubmit(onSubmit)}
                loading={form.formState.isSubmitting}
                disabled={form.formState.isSubmitting}
                style={styles.button}
                contentStyle={styles.buttonContent}
              >
                Log In
              </Button>
              <View style={styles.links}>
                <Link href="/forgot" style={styles.link}>
                  Forgot password?
                </Link>
                <Link href="/register" style={styles.link}>
                  Create account
                </Link>
              </View>
            </View>
          </FormProvider>
        </AuthCard>
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
  button: { borderRadius: radius.md },
  buttonContent: { height: 48 },
  links: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  link: { color: palette.primary, fontWeight: "600", fontSize: 14 },
});