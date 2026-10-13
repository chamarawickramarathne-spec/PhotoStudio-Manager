import { formatMoney } from "@/lib/format";

export type DueAlertKind = "due" | "overdue";

export const REMINDER_HOUR = 9;

export interface NotifiableSchedule {
  id: string;
  name: string | null;
  schedule_type: string;
  amount: number | string | null;
  paid_amount: number | string | null;
  due_date: string | null;
  status: string;
  bookings:
    | {
        title: string;
        clients: { full_name: string } | null;
      }
    | null;
}

export interface DueAlert {
  scheduleId: string;
  kind: DueAlertKind;
  dueDate: string;
  title: string;
  body: string;
}

export function isActiveSchedule(schedule: NotifiableSchedule): boolean {
  return schedule.status !== "paid" && schedule.status !== "cancelled";
}

export function remainingAmount(schedule: NotifiableSchedule): number {
  const amount = Number(schedule.amount ?? 0);
  const paid = Number(schedule.paid_amount ?? 0);
  const remaining = amount - paid;
  return remaining > 0 ? remaining : 0;
}

export function scheduleLabel(schedule: NotifiableSchedule): string {
  const name = schedule.name?.trim();
  if (name) return name;
  return schedule.bookings?.title?.trim() || "Payment";
}

export function alertTitle(kind: DueAlertKind, schedule: NotifiableSchedule): string {
  return kind === "due"
    ? `Payment due today — ${scheduleLabel(schedule)}`
    : `Payment overdue — ${scheduleLabel(schedule)}`;
}

export function alertBody(schedule: NotifiableSchedule, currency: string): string {
  const parts = [formatMoney(remainingAmount(schedule), currency)];
  const client = schedule.bookings?.clients?.full_name?.trim();
  if (client) parts.push(client);
  const booking = schedule.bookings?.title?.trim();
  if (booking && booking !== scheduleLabel(schedule)) parts.push(booking);
  return parts.join(" · ");
}

/** Local 09:00 reminder time for the due date, or the following day for overdue. */
export function alertDate(dueDate: string, kind: DueAlertKind): Date {
  const date = new Date(`${dueDate}T00:00:00`);
  if (kind === "overdue") date.setDate(date.getDate() + 1);
  date.setHours(REMINDER_HOUR, 0, 0, 0);
  return date;
}

export function buildDueAlert(
  schedule: NotifiableSchedule,
  kind: DueAlertKind,
  currency: string,
): DueAlert {
  return {
    scheduleId: schedule.id,
    kind,
    dueDate: schedule.due_date as string,
    title: alertTitle(kind, schedule),
    body: alertBody(schedule, currency),
  };
}

/**
 * Alerts to raise right now (used by the Windows desktop toast, which has no
 * background scheduler): "due today" on the due date, "overdue" the day after.
 */
export function getDueAlerts(
  schedules: NotifiableSchedule[],
  today: string,
  currency: string,
): DueAlert[] {
  const alerts: DueAlert[] = [];
  for (const schedule of schedules) {
    if (!schedule.due_date || !isActiveSchedule(schedule)) continue;
    if (schedule.due_date === today) {
      alerts.push(buildDueAlert(schedule, "due", currency));
    } else if (schedule.due_date < today) {
      alerts.push(buildDueAlert(schedule, "overdue", currency));
    }
  }
  return alerts;
}
