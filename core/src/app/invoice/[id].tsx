import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Button } from "react-native-paper";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useLocalSearchParams } from "@/navigation/router";

import { AppHeader, Screen } from "@/components/ui/Screen";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppToast } from "@/components/ui/ToastProvider";
import { useBooking } from "@/hooks/queries/bookings";
import { useClient } from "@/hooks/queries/clients";
import { usePaymentSchedules } from "@/hooks/queries/payments";
import { useAuth } from "@/hooks/useAuth";
import { useProfileAvatar } from "@/hooks/useProfileAvatar";
import { EVENT_TYPE_MAP, SCHEDULE_TYPE_LABEL } from "@/lib/constants";
import { todayISO } from "@/lib/format";
import { orderSchedules } from "@/lib/scheduleOrder";
import { getErrorMessage } from "@/lib/utils";
import { downloadInvoice, shareInvoice } from "@/lib/invoice/share";
import { buildPackageSections } from "@/lib/invoice/package";
import type { InvoiceData } from "@/lib/invoice/types";
import { InvoiceDocument } from "@/components/invoice/InvoiceDocument";
import { palette, spacing } from "@/theme";

export default function InvoiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useAppToast();
  const { profile, currency } = useAuth();
  const logoUri = useProfileAvatar();
  const { data: booking, isLoading } = useBooking(id);
  const { data: client } = useClient(booking?.client_id);
  const { data: schedules } = usePaymentSchedules();
  const [busy, setBusy] = useState<"download" | "share" | null>(null);
  const { width } = useWindowDimensions();
  const isWide = width >= 700;

  const bookingSchedules = useMemo(
    () => orderSchedules((schedules ?? []).filter((s) => s.booking_id === id)),
    [schedules, id],
  );

  const invoice = useMemo<InvoiceData | null>(() => {
    if (!booking) return null;
    const issueDate = todayISO();
    const lines = bookingSchedules.map((s) => ({
      label: s.name || SCHEDULE_TYPE_LABEL[s.schedule_type],
      type: SCHEDULE_TYPE_LABEL[s.schedule_type],
      note: s.notes,
      dueDate: s.due_date,
      status: s.status,
      amount: Number(s.amount || 0),
      paid: Number(s.paid_amount || 0),
    }));
    const paid = bookingSchedules.reduce((sum, s) => sum + Number(s.paid_amount || 0), 0);
    const linesTotal = lines.reduce((sum, l) => sum + l.amount, 0);
    const total = booking.total_amount != null ? Number(booking.total_amount) : linesTotal;
    const address = [client?.address, client?.city, client?.state, client?.country]
      .filter((v): v is string => !!v && v.trim().length > 0)
      .join(", ");

    return {
      invoiceNumber: `INV-${issueDate.replace(/-/g, "")}-${booking.id.slice(0, 6).toUpperCase()}`,
      issueDate,
      currency,
      photographer: {
        name: profile?.business_name || profile?.full_name || "Photographer",
        email: profile?.business_email ?? null,
        phone: profile?.business_phone ?? profile?.phone ?? null,
        address: profile?.business_address ?? null,
        website: profile?.website ?? null,
        logoDataUri: logoUri,
      },
      client: {
        name: client?.full_name ?? booking.clients?.full_name ?? "Client",
        email: client?.email ?? booking.clients?.email ?? null,
        phone: client?.phone ?? booking.clients?.phone ?? null,
        address: address || null,
      },
      bookingTitle: booking.title,
      eventType: EVENT_TYPE_MAP[booking.event_type]?.label ?? booking.event_type,
      bookingDate: booking.booking_date,
      package: buildPackageSections(booking),
      lines,
      total,
      paid,
      balance: Math.max(total - paid, 0),
      notes: booking.notes,
    };
  }, [booking, bookingSchedules, client, currency, logoUri, profile]);

  const handleDownload = () => {
    if (!invoice) return;
    setBusy("download");
    try {
      downloadInvoice(invoice);
      toast.show("Invoice PDF downloaded");
    } catch (error) {
      toast.show(getErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const handleShare = async () => {
    if (!invoice) return;
    setBusy("share");
    try {
      const outcome = await shareInvoice(invoice);
      toast.show(
        outcome === "shared"
          ? "Invoice ready to send"
          : "Invoice downloaded — attach it to your message",
      );
    } catch (error) {
      const name = (error as { name?: string })?.name;
      if (name !== "AbortError") toast.show(getErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  if (isLoading) {
    return (
      <>
        <AppHeader title="Invoice" showBack />
        <View style={styles.center}>
          <ActivityIndicator color={palette.primary} />
        </View>
      </>
    );
  }

  if (!booking || !invoice) {
    return (
      <>
        <AppHeader title="Invoice" showBack />
        <EmptyState icon="document-text-outline" title="Invoice not found" />
      </>
    );
  }

  return (
    <>
      <AppHeader title="Invoice" showBack />
      <Screen>
        <InvoiceDocument invoice={invoice} currency={currency} isWide={isWide} />

        <View style={styles.actions}>
          <Button
            mode="outlined"
            icon="download"
            style={styles.actionBtn}
            loading={busy === "download"}
            disabled={busy !== null}
            onPress={handleDownload}
          >
            Download PDF
          </Button>
          <Button
            mode="contained"
            icon="share-variant"
            style={styles.actionBtn}
            loading={busy === "share"}
            disabled={busy !== null}
            onPress={() => void handleShare()}
          >
            Send Invoice
          </Button>
        </View>

        <View style={styles.hint}>
          <Ionicons name="information-circle-outline" size={16} color={palette.onSurfaceVariant} />
          <Text style={styles.hintText}>
            Send opens your device share sheet so you can attach the PDF to email, WhatsApp, and more.
          </Text>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  actions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  actionBtn: { flex: 1, borderRadius: 999 },
  hint: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", marginTop: spacing.lg },
  hintText: { flex: 1, fontSize: 12, color: palette.onSurfaceVariant },
});
