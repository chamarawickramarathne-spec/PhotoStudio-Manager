import { format as dfFormat, parseISO } from "date-fns";

export function formatMoney(amount: number | string | null | undefined, currency = "LKR"): string {
  const value = Number(amount ?? 0);
  if (Number.isNaN(value)) return `${currency} 0.00`;
  try {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function formatMoneyCompact(amount: number | string | null | undefined, currency = "LKR"): string {
  const value = Number(amount ?? 0);
  if (Number.isNaN(value)) return `${currency} 0`;
  const abs = Math.abs(value);
  const suffix =
    abs >= 1_000_000_000
      ? { divisor: 1_000_000_000, label: "B" }
      : abs >= 1_000_000
        ? { divisor: 1_000_000, label: "M" }
        : abs >= 1_000
          ? { divisor: 1_000, label: "K" }
          : null;
  if (!suffix) {
    return formatMoney(value, currency).replace(/\.00$/, "");
  }
  const scaled = value / suffix.divisor;
  const digits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
  return `${currency} ${scaled.toFixed(digits)}${suffix.label}`;
}

export function formatDate(date: string | Date | null | undefined, pattern = "MMM d, yyyy"): string {
  if (!date) return "Not set";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return dfFormat(d, pattern);
  } catch {
    return "Not set";
  }
}

export function toDateInputValue(date: string | null | undefined): string | null {
  return date || null;
}

export function todayISO(): string {
  return dfFormat(new Date(), "yyyy-MM-dd");
}
