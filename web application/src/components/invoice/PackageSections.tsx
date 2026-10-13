import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

import type { InvoiceField, InvoiceSection } from "@/lib/invoice/types";
import { palette, radius, spacing } from "@/theme";

const EMPTY = "\u2014";

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

function FieldValue({ field }: { field: InvoiceField }) {
  const empty = !field.value || field.value.trim().length === 0 || field.value === EMPTY;
  if (empty) {
    return <Text style={[styles.fieldValue, styles.fieldValueEmpty]}>{EMPTY}</Text>;
  }
  if (field.chip) {
    return (
      <View style={styles.chip}>
        <Ionicons name="checkmark-circle" size={16} color={palette.gold} />
        <Text style={styles.chipLabel}>{field.value}</Text>
      </View>
    );
  }
  return <Text style={styles.fieldValue}>{field.value}</Text>;
}

export function InvoicePackageSections({ sections }: { sections: InvoiceSection[] }) {
  if (!sections || sections.length === 0) return null;

  return (
    <View style={styles.root}>
      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          {chunk(section.fields, section.columns).map((rowFields, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {rowFields.map((field) => (
                <View key={field.label} style={styles.field}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <FieldValue field={field} />
                </View>
              ))}
              {Array.from({ length: section.columns - rowFields.length }).map((_, i) => (
                <View key={`spacer-${i}`} style={styles.field} />
              ))}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.lg },
  section: { gap: spacing.sm },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  sectionAccent: { width: 3, height: 14, borderRadius: 2, backgroundColor: palette.gold },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  row: { flexDirection: "row", gap: spacing.md },
  field: { flex: 1, gap: spacing.xs, minWidth: 0, alignItems: "flex-start" },
  fieldLabel: { fontSize: 11, color: palette.onSurfaceVariant },
  fieldValue: { fontSize: 14, fontWeight: "600", color: palette.onBackground },
  fieldValueEmpty: { color: palette.outline, fontWeight: "400" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.gold,
    backgroundColor: palette.backgroundGold,
  },
  chipLabel: { fontSize: 13, color: palette.onBackground },
});
