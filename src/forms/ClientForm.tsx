import { StyleSheet, View } from "react-native";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Text } from "react-native-paper";

import { TextFormField } from "@/components/form/TextFormField";
import { SelectFormField } from "@/components/form/SelectFormField";
import { useCreateClient, useUpdateClient, type ClientRow } from "@/hooks/queries/clients";
import { useAuth } from "@/hooks/useAuth";
import { CLIENT_STATUSES, DEFAULT_COUNTRY } from "@/lib/constants";
import { getErrorMessage } from "@/lib/utils";
import { palette, spacing } from "@/theme";

const schema = z.object({
  full_name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z
    .string()
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email"),
  second_contact: z.string().optional(),
  second_phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  country: z.string().optional(),
  status: z.enum(["active", "inactive", "blacklisted"]),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ClientFormProps {
  client?: ClientRow;
  onSuccess?: () => void;
}

export function ClientForm({ client, onSuccess }: ClientFormProps) {
  const { session } = useAuth();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const editing = !!client;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: client
      ? {
          full_name: client.full_name,
          phone: client.phone ?? "",
          email: client.email ?? "",
          second_contact: client.second_contact ?? "",
          second_phone: client.second_phone ?? "",
          address: client.address ?? "",
          city: client.city ?? "",
          state: client.state ?? "",
          zip_code: client.zip_code ?? "",
          country: client.country ?? DEFAULT_COUNTRY,
          status: client.status,
          notes: client.notes ?? "",
        }
      : {
          full_name: "",
          phone: "",
          email: "",
          second_contact: "",
          second_phone: "",
          address: "",
          city: "",
          state: "",
          zip_code: "",
          country: DEFAULT_COUNTRY,
          status: "active",
          notes: "",
        },
  });

  const isSubmitting = createClient.isPending || updateClient.isPending;
  const errorMessage = createClient.error || updateClient.error;

  const onSubmit = async (values: FormValues) => {
    if (!session) return;
    const clean = (v?: string) => (v?.trim() ? v.trim() : null);
    const payload = {
      user_id: session.user.id,
      full_name: values.full_name.trim(),
      phone: values.phone.trim(),
      email: clean(values.email),
      second_contact: clean(values.second_contact),
      second_phone: clean(values.second_phone),
      address: clean(values.address),
      city: clean(values.city),
      state: clean(values.state),
      zip_code: clean(values.zip_code),
      country: values.country?.trim() || DEFAULT_COUNTRY,
      status: values.status,
      notes: clean(values.notes),
    };

    if (editing && client) {
      await updateClient.mutateAsync({ id: client.id, patch: payload });
    } else {
      await createClient.mutateAsync(payload);
    }
    onSuccess?.();
  };

  return (
    <FormProvider {...form}>
      <View style={styles.form}>
        <TextFormField name="full_name" label="Full Name" placeholder="Client name" autoCapitalize="words" required />
        <TextFormField name="phone" label="Phone" placeholder="07x xxx xxxx" keyboardType="phone-pad" required />
        <TextFormField name="email" label="Email" placeholder="client@example.com" autoCapitalize="none" keyboardType="email-address" />
        <TextFormField name="second_contact" label="Second Contact Name" placeholder="Alt. contact person" autoCapitalize="words" />
        <TextFormField name="second_phone" label="Second Contact Phone" placeholder="Alt. phone number" keyboardType="phone-pad" />
        <TextFormField name="address" label="Address" placeholder="Street address" multiline numberOfLines={2} />
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <TextFormField name="city" label="City" placeholder="City" />
          </View>
          <View style={styles.rowItem}>
            <TextFormField name="state" label="State" placeholder="State / Province" />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <TextFormField name="zip_code" label="Zip / Postal Code" placeholder="Zip code" />
          </View>
          <View style={styles.rowItem}>
            <TextFormField name="country" label="Country" placeholder="Country" autoCapitalize="words" />
          </View>
        </View>
        <SelectFormField name="status" label="Status" options={CLIENT_STATUSES} />
        <TextFormField name="notes" label="Notes" placeholder="Additional notes about the client" multiline numberOfLines={3} />
        {errorMessage ? <Text style={styles.error}>{getErrorMessage(errorMessage)}</Text> : null}
        <Button
          mode="contained"
          onPress={form.handleSubmit(onSubmit)}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.submit}
          contentStyle={styles.submitContent}
        >
          {editing ? "Save Changes" : "Add Client"}
        </Button>
      </View>
    </FormProvider>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  row: { flexDirection: "row", gap: spacing.md },
  rowItem: { flex: 1 },
  error: { color: palette.error, fontSize: 13, textAlign: "center" },
  submit: { borderRadius: 999, marginTop: spacing.sm },
  submitContent: { height: 48 },
});
