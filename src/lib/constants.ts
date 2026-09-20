import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

type IconName = ComponentProps<typeof Ionicons>["name"];

export type EventType =
  | "Wedding"
  | "Birthday"
  | "Anniversary"
  | "Corporate"
  | "Party"
  | "Other";

export interface EventTypeInfo {
  value: EventType;
  label: string;
  icon: IconName;
  color: string;
}

export const EVENT_TYPES: EventTypeInfo[] = [
  { value: "Wedding", label: "Wedding", icon: "heart", color: "#B45309" },
  { value: "Birthday", label: "Birthday", icon: "gift", color: "#2563EB" },
  { value: "Anniversary", label: "Anniversary", icon: "people", color: "#7C3AED" },
  { value: "Corporate", label: "Corporate", icon: "business", color: "#0F766E" },
  { value: "Party", label: "Party", icon: "musical-notes", color: "#DB2777" },
  { value: "Other", label: "Other", icon: "camera", color: "#6B7280" },
];

export const EVENT_TYPE_MAP: Record<EventType, EventTypeInfo> = EVENT_TYPES.reduce(
  (acc, e) => {
    acc[e.value] = e;
    return acc;
  },
  {} as Record<EventType, EventTypeInfo>,
);

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface StatusInfo {
  value: string;
  label: string;
  color: string;
  icon: IconName;
}

export const BOOKING_STATUSES: StatusInfo[] = [
  { value: "pending", label: "Pending", color: "#D97706", icon: "time" },
  { value: "confirmed", label: "Confirmed", color: "#2563EB", icon: "checkmark-circle" },
  { value: "in_progress", label: "In Progress", color: "#7C3AED", icon: "pulse" },
  { value: "completed", label: "Completed", color: "#16A34A", icon: "checkmark-done" },
  { value: "cancelled", label: "Cancelled", color: "#6B7280", icon: "close-circle" },
];

export const BOOKING_STATUS_MAP: Record<string, StatusInfo> = BOOKING_STATUSES.reduce(
  (acc, s) => {
    acc[s.value] = s;
    return acc;
  },
  {} as Record<string, StatusInfo>,
);

export const BOOKING_STATUS_ORDER: BookingStatus[] = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
];

export type PaymentStatus = "pending" | "paid" | "overdue" | "cancelled";

export const PAYMENT_STATUS_INFO: Record<PaymentStatus, StatusInfo> = {
  pending: { value: "pending", label: "Pending", color: "#D97706", icon: "time" },
  paid: { value: "paid", label: "Paid", color: "#16A34A", icon: "checkmark-circle" },
  overdue: { value: "overdue", label: "Overdue", color: "#DC2626", icon: "warning" },
  cancelled: { value: "cancelled", label: "Cancelled", color: "#6B7280", icon: "close-circle" },
};

export type ScheduleType = "deposit" | "milestone" | "final" | "custom";

export const SCHEDULE_TYPES: { value: ScheduleType; label: string }[] = [
  { value: "deposit", label: "Deposit" },
  { value: "milestone", label: "Milestone" },
  { value: "final", label: "Final Payment" },
  { value: "custom", label: "Custom" },
];

export const SCHEDULE_TYPE_LABEL: Record<ScheduleType, string> = {
  deposit: "Deposit",
  milestone: "Milestone",
  final: "Final",
  custom: "Custom",
};

export type PaymentMethod = "cash" | "e_transfer_bank" | "card_pay" | "other";

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: IconName }[] = [
  { value: "cash", label: "Cash", icon: "cash" },
  { value: "e_transfer_bank", label: "E-Transfer / Bank", icon: "swap-horizontal" },
  { value: "card_pay", label: "Card Pay", icon: "card" },
  { value: "other", label: "Other", icon: "ellipsis-horizontal" },
];

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  e_transfer_bank: "E-Transfer / Bank",
  card_pay: "Card Pay",
  other: "Other",
};

export const SHOOT_TYPES = ["Photography", "Videography", "Both"] as const;

export const PHOTO_SIZES = [
  "4x6",
  "5x7",
  "6x8",
  "8x12",
  "10x15",
  "12x18",
  "16x20",
  "20x30",
];

export const GROUP_PHOTO_SIZES = ["8x12", "10x15", "12x18", "16x20", "20x30"];

export const HOMECOMING_PHOTO_SIZES = [
  "4x6",
  "5x7",
  "6x8",
  "8x12",
  "10x15",
  "12x18",
];

export const CLIENT_STATUSES: { value: "active" | "inactive" | "blacklisted"; label: string }[] =
  [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "blacklisted", label: "Blacklisted" },
  ];

export const CLIENT_STATUS_COLOR: Record<string, string> = {
  active: "#16A34A",
  inactive: "#6B7280",
  blacklisted: "#DC2626",
};

export interface RevenueRange {
  key: string;
  label: string;
  months: number;
}

export const REVENUE_RANGES: RevenueRange[] = [
  { key: "1m", label: "This Month", months: 1 },
  { key: "3m", label: "Last 3", months: 3 },
  { key: "6m", label: "Last 6", months: 6 },
  { key: "12m", label: "Last 12", months: 12 },
];

export const DEFAULT_COUNTRY = "Sri Lanka";

export const CURRENCIES = [
  { code: "LKR", label: "Sri Lankan Rupee" },
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "AUD", label: "Australian Dollar" },
  { code: "AED", label: "UAE Dirham" },
  { code: "INR", label: "Indian Rupee" },
  { code: "SGD", label: "Singapore Dollar" },
  { code: "CAD", label: "Canadian Dollar" },
] as const;
