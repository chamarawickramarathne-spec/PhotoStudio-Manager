import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Text } from "react-native-paper";

import { TextFormField } from "@/components/form/TextFormField";
import { FormActions } from "@/components/form/FormActions";
import { FormColumn } from "@/components/form/FormColumn";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/utils";
import { phoneOptional, required } from "@/forms/validation";
import { palette, spacing } from "@/theme";

const optionalUrl = (message: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || z.url().safeParse(v).success, message);

const schema = z.object({
  photographer_name: required("Name is required"),
  phone: phoneOptional(),
  business_name: z.string().trim().optional(),
  business_email: z
    .string()
    .trim()
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email"),
  business_phone: phoneOptional("Enter a valid phone number"),
  business_address: z.string().trim().optional(),
  website: optionalUrl("Enter a valid URL"),
  portfolio_url: optionalUrl("Enter a valid URL"),
  bio: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

export function PhotographerForm() {
  const { profile, updateProfile } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      photographer_name: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      business_name: profile?.business_name ?? "",
      business_email: profile?.business_email ?? "",
      business_phone: profile?.business_phone ?? "",
      business_address: profile?.business_address ?? "",
      website: profile?.website ?? "",
      portfolio_url: profile?.portfolio_url ?? "",
      bio: profile?.bio ?? "",
    },
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (values: FormValues) => {
    const clean = (v?: string) => (v?.trim() ? v.trim() : null);
    setSubmitError(null);
    setSubmitting(true);
    try {
      await updateProfile({
        full_name: values.photographer_name.trim(),
        phone: clean(values.phone),
        business_name: clean(values.business_name),
        business_email: clean(values.business_email),
        business_phone: clean(values.business_phone),
        business_address: clean(values.business_address),
        website: clean(values.website),
        portfolio_url: clean(values.portfolio_url),
        bio: clean(values.bio),
      });
      form.reset(values);
    } catch (e) {
      setSubmitError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormProvider {...form}>
      <FormColumn maxWidth={560}>
        <View style={styles.form}>
          <TextFormField name="photographer_name" label="Photographer Name" placeholder="Your full name" required autoCapitalize="words" />
          <TextFormField name="phone" label="Phone" placeholder="+94 7x xxx xxxx" keyboardType="phone-pad" />
          <TextFormField name="business_name" label="Business Name" placeholder="Your studio / business name" autoCapitalize="words" />
          <TextFormField name="business_email" label="Business Email" placeholder="business@studio.com" autoCapitalize="none" keyboardType="email-address" />
          <TextFormField name="business_phone" label="Business Phone" placeholder="+94 7x xxx xxxx" keyboardType="phone-pad" />
          <TextFormField name="business_address" label="Business Address" placeholder="123 Studio St, City" autoCapitalize="words" />
          <TextFormField name="website" label="Website" placeholder="https://yourwebsite.com" autoCapitalize="none" keyboardType="url" />
          <TextFormField name="portfolio_url" label="Portfolio URL" placeholder="https://portfolio.com" autoCapitalize="none" keyboardType="url" />
          <TextFormField name="bio" label="Bio" placeholder="Tell clients about your photography…" multiline numberOfLines={4} />
          {submitError ? <Text style={styles.error}>{submitError}</Text> : null}
          <FormActions submitLabel="Save Details" submitting={submitting} onSubmit={form.handleSubmit(onSubmit)} onCancel={() => form.reset()} />
        </View>
      </FormColumn>
    </FormProvider>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  error: { color: palette.error, fontSize: 13, textAlign: "center" },
});