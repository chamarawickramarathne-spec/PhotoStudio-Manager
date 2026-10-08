import { useCallback, useMemo } from "react";

import { useDesktopUpdater } from "@/hooks/useDesktopUpdater";
import { useMobileUpdater } from "@/hooks/useMobileUpdater";
import type { UpdateProgress, UpdateResult } from "@/lib/update/types";
import { APP_VERSION } from "@/lib/version";

export interface AppUpdater {
  /** True when an update check is supported on this platform (desktop bridge or native app). */
  canCheck: boolean;
  isDesktop: boolean;
  isMobile: boolean;
  result: UpdateResult | null;
  progress: UpdateProgress | null;
  open: boolean;
  checking: boolean;
  setOpen: (open: boolean) => void;
  checkForUpdates: () => Promise<void>;
  installUpdate: () => Promise<void>;
  getVersion: () => Promise<string>;
}

/**
 * Platform façade over the desktop (Electron bridge) and mobile (Capacitor
 * self-update) updater contexts. Exactly one provider is active per platform,
 * so only one of them can ever be the active source.
 */
export function useAppUpdater(): AppUpdater {
  const desktop = useDesktopUpdater();
  const mobile = useMobileUpdater();

  const isDesktop = desktop.isDesktop;
  const isMobile = mobile.isMobile && !isDesktop;
  const active = isDesktop ? desktop : mobile;

  const getVersion = useCallback(() => {
    if (isDesktop) return desktop.getVersion();
    return Promise.resolve(APP_VERSION);
  }, [isDesktop, desktop]);

  const checkForUpdates = active.checkForUpdates;
  const installUpdate = active.installUpdate;

  return useMemo<AppUpdater>(
    () => ({
      canCheck: isDesktop || isMobile,
      isDesktop,
      isMobile,
      result: active.result,
      progress: active.progress,
      open: active.open,
      checking: active.checking,
      setOpen: active.setOpen,
      checkForUpdates,
      installUpdate,
      getVersion,
    }),
    [isDesktop, isMobile, active, checkForUpdates, installUpdate, getVersion],
  );
}
