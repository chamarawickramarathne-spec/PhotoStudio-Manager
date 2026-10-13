import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Button, Divider } from "react-native-paper";
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
import { formatMoney, todayISO } from "@/lib/format";
import { orderSchedules } from "@/lib/scheduleOrder";
import { getErrorMessage } from "@/lib/utils";
import { downloadInvoice, shareInvoice } from "@/lib/invoice/share";
import { buildPackageFields } from "@/lib/invoice/package";
import type { InvoiceData } from "@/lib/invoice/types";
import { palette, radius, spacing } from "@/theme";

export default function InvoiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useAppToast();
  const { profile, currency } = useAuth();
  const logoUri = useProfileAvatar();
  const { data: booking, isLoading } = useBooking(id);
  const { data: client } = useClient(booking?.client_id);
  const { data: schedules } = usePaymentSchedules();
  const [busy, setBusy] = useState<"download" | "share" | null>(null);

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
      package: buildPackageFields(booking),
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
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.docLabel}>INVOICE</Text>
              <Text style={styles.docNumber}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={styles.issuer}>
              <Text style={styles.issuerName}>{invoice.photographer.name}</Text>
              <Text style={styles.muted}>{invoice.photographer.email ?? ""}</Text>
              <Text style={styles.muted}>{invoice.photographer.phone ?? ""}</Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <Text style={styles.sectionLabel}>BILL TO</Text>
          <Text style={styles.strong}>{invoice.client.name}</Text>
          {invoice.client.address ? <Text style={styles.muted}>{invoice.client.address}</Text> : null}
          {invoice.client.email ? <Text style={styles.muted}>{invoice.client.email}</Text> : null}
          {invoice.client.phone ? <Text style={styles.muted}>{invoice.client.phone}</Text> : null}

          <Divider style={styles.divider} />

          <Text style={styles.sectionLabel}>BOOKING</Text>
          <Text style={styles.strong}>{invoice.bookingTitle}</Text>
          <Text style={styles.muted}>
            {invoice.eventType}
            {invoice.bookingDate ? ` · ${invoice.bookingDate}` : ""}
          </Text>

          {invoice.package && invoice.package.length > 0 ? (
            <>
              <Divider style={styles.divider} />
              <Text style={styles.sectionLabel}>PACKAGE</Text>
              {invoice.package.map((field) => (
                <View key={field.label} style={styles.packageRow}>
                  <Text style={styles.packageLabel}>{field.label}</Text>
                  <Text style={styles.packageValue}>{field.value}</Text>
                </View>
              ))}
            </>
          ) : null}

          <Divider style={styles.divider} />

          {invoice.lines.length === 0 ? (
            <Text style={styles.muted}>No payment schedule has been created for this booking yet.</Text>
          ) : (
            invoice.lines.map((line, index) => (
              <View key={`${line.label}-${index}`} style={styles.lineRow}>
                <View style={styles.lineInfo}>
                  <Text style={styles.strong}>{line.label}</Text>
                  <Text style={styles.muted}>
                    {line.type}
                    {line.dueDate ? ` · due ${line.dueDate}` : ""}
                    {line.status ? ` · ${line.status}` : ""}
                  </Text>
                </View>
                <View style={styles.lineAmounts}>
                  <Text style={styles.strong}>{formatMoney(line.amount, currency)}</Text>
                  <Text style={styles.muted}>paid {formatMoney(line.paid, currency)}</Text>
                </View>
              </View>
            ))
          )}

          <Divider style={styles.divider} />

          <View style={styles.totals}>
            <TotalRow label="Total" value={formatMoney(invoice.total, currency)} />
            <TotalRow label="Paid" value={formatMoney(invoice.paid, currency)} />
            <TotalRow label="Balance Due" value={formatMoney(invoice.balance, currency)} highlight />
          </View>
        </View>

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

function TotalRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, highlight && styles.totalLabelHighlight]}>{label}</Text>
      <Text style={[styles.totalValue, highlight && styles.totalValueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
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
  rowBetween: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  docLabel: { fontSize: 20, fontWeight: "800", color: palette.primary, letterSpacing: 1 },
  docNumber: { fontSize: 12, color: palette.onSurfaceVariant, marginTop: 2 },
  issuer: { alignItems: "flex-end", flexShrink: 1 },
  issuerName: { fontSize: 13, fontWeight: "700", color: palette.onBackground, textAlign: "right" },
  sectionLabel: { fontSize: 10, fontWeight: "800", color: palette.primary, letterSpacing: 1, marginTop: spacing.xs },
  strong: { fontSize: 14, fontWeight: "700", color: palette.onBackground },
  muted: { fontSize: 12, color: palette.onSurfaceVariant },
  packageRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md, paddingVertical: 2 },
  packageLabel: { fontSize: 12, color: palette.onSurfaceVariant },
  packageValue: { fontSize: 12, fontWeight: "600", color: palette.onBackground, flexShrink: 1, textAlign: "right" },
  divider: { marginVertical: spacing.sm },
  lineRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md, paddingVertical: 6 },
  lineInfo: { flex: 1, gap: 2 },
  lineAmounts: { alignItems: "flex-end", gap: 2 },
  totals: { gap: 6 },
  totalRow: { flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { fontSize: 13, color: palette.onSurfaceVariant },
  totalLabelHighlight: { fontWeight: "800", color: palette.onBackground },
  totalValue: { fontSize: 13, fontWeight: "600", color: palette.onBackground },
  totalValueHighlight: { fontSize: 16, fontWeight: "800", color: palette.primary },
  actions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  actionBtn: { flex: 1, borderRadius: 999 },
  hint: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", marginTop: spacing.lg },
  hintText: { flex: 1, fontSize: 12, color: palette.onSurfaceVariant },
});
