import {
  LocalNotifications,
  type PendingLocalNotificationSchema,
} from "@capacitor/local-notifications";

import {
  alertBody,
  alertDate,
  alertTitle,
  isActiveSchedule,
  type DueAlertKind,
  type NotifiableSchedule,
} from "@/lib/notifications/due";

const CHANNEL_ID = "psm-payments";
const REGISTRY_KEY = "psm-notification-ids";
const MAX_ID = 2147483647;

interface IdRegistry {
  next: number;
  map: Record<string, number>;
}

interface PlannedNotification {
  key: string;
  title: string;
  body: string;
  at: Date;
}

function loadRegistry(): IdRegistry {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<IdRegistry>;
      if (typeof parsed.next === "number" && parsed.map) {
        return { next: parsed.next, map: parsed.map };
      }
    }
  } catch {
    // ignore malformed registry and start clean
  }
  return { next: 1, map: {} };
}

function saveRegistry(registry: IdRegistry): void {
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
  } catch {
    // best-effort persistence only
  }
}

function allocId(registry: IdRegistry, key: string): number {
  const existing = registry.map[key];
  if (existing !== undefined) return existing;
  if (registry.next < 1 || registry.next > MAX_ID - 1) registry.next = 1;
  const id = registry.next;
  registry.next += 1;
  registry.map[key] = id;
  return id;
}

function pruneRegistry(registry: IdRegistry, keys: string[]): void {
  const keep = new Set(keys);
  const next: Record<string, number> = {};
  for (const [key, value] of Object.entries(registry.map)) {
    if (keep.has(key)) next[key] = value;
  }
  registry.map = next;
}

function planNotifications(
  schedules: NotifiableSchedule[],
  currency: string,
  now: Date,
): PlannedNotification[] {
  const plans: PlannedNotification[] = [];
  for (const schedule of schedules) {
    if (!schedule.due_date || !isActiveSchedule(schedule)) continue;
    const body = alertBody(schedule, currency);
    for (const kind of ["due", "overdue"] as DueAlertKind[]) {
      const at = alertDate(schedule.due_date, kind);
      if (at.getTime() <= now.getTime()) continue;
      plans.push({
        key: `${schedule.id}:${kind}:${schedule.due_date}`,
        title: alertTitle(kind, schedule),
        body,
        at,
      });
    }
  }
  return plans;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await LocalNotifications.checkPermissions();
  if (current.display === "granted") return true;
  const requested = await LocalNotifications.requestPermissions();
  return requested.display === "granted";
}

async function ensureChannel(): Promise<void> {
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: "Payment reminders",
      description: "Due-date and overdue payment reminders",
      importance: 4,
    });
  } catch {
    // channels are Android-only; ignore elsewhere
  }
}

/**
 * Rebuilds the device's scheduled reminders so they mirror the current unpaid
 * schedules: one alert at 09:00 on the due date and one at 09:00 the day after.
 * Cancels only this app's payment reminders, so it is safe to call repeatedly.
 */
export async function syncScheduleNotifications(
  schedules: NotifiableSchedule[],
  currency: string,
): Promise<void> {
  if (!(await ensureNotificationPermission())) return;
  await ensureChannel();

  await cancelPendingReminders();

  const plans = planNotifications(schedules, currency, new Date());
  if (plans.length === 0) return;

  const registry = loadRegistry();
  const notifications = plans.map((plan) => ({
    id: allocId(registry, plan.key),
    title: plan.title,
    body: plan.body,
    schedule: { at: plan.at },
    channelId: CHANNEL_ID,
    extra: { psm: true },
  }));
  pruneRegistry(registry, plans.map((plan) => plan.key));
  saveRegistry(registry);

  await LocalNotifications.schedule({ notifications });
}

async function cancelPendingReminders(): Promise<void> {
  const pending = await LocalNotifications.getPending();
  const ours = pending.notifications.filter(
    (n: PendingLocalNotificationSchema) => (n.extra as { psm?: boolean } | null)?.psm === true,
  );
  if (ours.length > 0) {
    await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) });
  }
}

/** Removes all scheduled payment reminders (e.g. on sign-out). */
export async function clearScheduleNotifications(): Promise<void> {
  await cancelPendingReminders();
}
