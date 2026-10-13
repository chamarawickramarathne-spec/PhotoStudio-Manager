import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { App } from "@capacitor/app";

import { useAuth } from "@/hooks/useAuth";
import { usePaymentSchedules } from "@/hooks/queries/payments";
import { getDesktopBridge } from "@/lib/desktop";
import { todayISO } from "@/lib/format";
import {
  getDueAlerts,
  type DueAlertKind,
  type NotifiableSchedule,
} from "@/lib/notifications/due";
import {
  clearScheduleNotifications,
  syncScheduleNotifications,
} from "@/lib/notifications/mobile";
import { isNativeApp } from "@/lib/platform";

const DESKTOP_CHECK_INTERVAL_MS = 20 * 60 * 1000;
const NOTIFIED_PREFIX = "psm-notified";

function notifiedKey(scheduleId: string, kind: DueAlertKind, dueDate: string): string {
  return `${NOTIFIED_PREFIX}:${scheduleId}:${kind}:${dueDate}`;
}

function wasNotified(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function markNotified(key: string): void {
  try {
    localStorage.setItem(key, "1");
  } catch {
    // best-effort dedupe only
  }
}

function DueNotificationsWatcher() {
  const { currency } = useAuth();
  const { data: schedules } = usePaymentSchedules();
  const desktop = useMemo(() => getDesktopBridge(), []);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isNativeApp() || !schedules) return;
    void syncScheduleNotifications(schedules as NotifiableSchedule[], currency).catch((error) => {
      console.warn("[notifications] mobile sync failed", error);
    });
  }, [schedules, currency, tick]);

  useEffect(() => {
    if (!isNativeApp()) return undefined;
    let disposed = false;
    let remove: (() => Promise<void>) | undefined;
    void App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) setTick((value) => value + 1);
    }).then((handle) => {
      if (disposed) void handle.remove();
      else remove = () => handle.remove();
    });
    return () => {
      disposed = true;
      void remove?.();
    };
  }, []);

  useEffect(() => {
    if (!desktop || typeof desktop.notify !== "function" || !schedules) return;
    const today = todayISO();
    const alerts = getDueAlerts(schedules as NotifiableSchedule[], today, currency);
    for (const alert of alerts) {
      const key = notifiedKey(alert.scheduleId, alert.kind, alert.dueDate);
      if (wasNotified(key)) continue;
      void desktop
        .notify({ title: alert.title, body: alert.body })
        .then(() => markNotified(key))
        .catch((error) => console.warn("[notifications] desktop toast failed", error));
    }
  }, [desktop, schedules, currency, tick]);

  useEffect(() => {
    if (!desktop) return undefined;
    const id = setInterval(() => setTick((value) => value + 1), DESKTOP_CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [desktop]);

  return null;
}

/**
 * Raises payment due-date reminders: scheduled OS notifications on Android and
 * native Windows toasts on desktop. A no-op elsewhere. The watcher only mounts
 * while a user is signed in, so no data is fetched on the login screen.
 */
export function DueNotificationsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const isMobile = useMemo(() => isNativeApp(), []);
  const wasSignedIn = useRef(false);

  useEffect(() => {
    const signedIn = !!session?.user;
    if (isMobile && wasSignedIn.current && !signedIn) {
      void clearScheduleNotifications().catch((error) => {
        console.warn("[notifications] clear failed", error);
      });
    }
    wasSignedIn.current = signedIn;
  }, [isMobile, session?.user]);

  return (
    <>
      {children}
      {session?.user ? <DueNotificationsWatcher /> : null}
    </>
  );
}
