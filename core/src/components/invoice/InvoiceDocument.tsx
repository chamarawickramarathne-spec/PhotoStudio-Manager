import { StyleSheet, Text, View } from "react-native";
import { Divider } from "react-native-paper";

import { InvoicePackageSections } from "@/components/invoice/PackageSections";
import { formatMoney } from "@/lib/format";
import type { InvoiceData } from "@/lib/invoice/types";
import { palette, radius, spacing } from "@/theme";

interface InvoiceDocumentProps {
  invoice: InvoiceData;
  currency: string;
  isWide: boolean;
}

export function InvoiceDocument({ invoice, currency, isWide }: InvoiceDocumentProps) {
  return (
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

      <View style={[styles.cols, !isWide && styles.colsStack]}>
        <View style={styles.col}>
          <Text style={styles.sectionLabel}>BILL TO</Text>
          <Text style={styles.strong}>{invoice.client.name}</Text>
          {invoice.client.address ? <Text style={styles.muted}>{invoice.client.address}</Text> : null}
          {invoice.client.email ? <Text style={styles.muted}>{invoice.client.email}</Text> : null}
          {invoice.client.phone ? <Text style={styles.muted}>{invoice.client.phone}</Text> : null}
        </View>
        <View style={styles.col}>
          <Text style={styles.sectionLabel}>BOOKING</Text>
          <Text style={styles.strong}>{invoice.bookingTitle}</Text>
          <Text style={styles.muted}>
            {invoice.eventType}
            {invoice.bookingDate ? ` · ${invoice.bookingDate}` : ""}
          </Text>
        </View>
      </View>

      <View style={[styles.cols, !isWide && styles.colsStack]}>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Package Details</Text>
          {invoice.package && invoice.package.length > 0 ? (
            <InvoicePackageSections sections={invoice.package} />
          ) : (
            <Text style={styles.muted}>No package details.</Text>
          )}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Pricing</Text>
          {invoice.lines.length === 0 ? (
            <Text style={styles.muted}>No payment schedule has been created for this booking yet.</Text>
          ) : (
            invoice.lines.map((line, index) => (
              <View key={`${line.label}-${index}`} style={styles.lineRow}>
                <View style={styles.lineInfo}>
                  <Text style={styles.strong}>{line.label}</Text>
                  <Text style={styles.muted}>
                    {line.type}
                    {line.note ? ` · ${line.note}` : ""}
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
      </View>
    </View>
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
  cols: { flexDirection: "row", gap: spacing.md, alignItems: "stretch" },
  colsStack: { flexDirection: "column" },
  col: { flex: 1, minWidth: 0, gap: spacing.xs },
  panel: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceVariant,
    padding: spacing.md,
  },
  panelTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: palette.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
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
});
