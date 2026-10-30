import { useCallback, useMemo } from "react";

import { useDesktopUpdater } from "@/hooks/useDesktopUpdater";
import type { UpdateProgress, UpdateResult } from "@/lib/update/types";
import { APP_VERSION } from "@/lib/version";

export interface AppUpdater {
  /** Updates are managed by the Play Store on Android and by the Electron bridge on desktop. */
  canCheck: boolean;
  isDesktop: boolean;
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
 * Desktop-only updater facade. Android updates are delivered exclusively
 * through Google Play, so the shared app never downloads or installs APKs.
 */
export function useAppUpdater(): AppUpdater {
  const desktop = useDesktopUpdater();
  const isDesktop = desktop.isDesktop;

  const getVersion = useCallback(() => {
    if (isDesktop) return desktop.getVersion();
    return Promise.resolve(APP_VERSION);
  }, [isDesktop, desktop]);

  return useMemo<AppUpdater>(
    () => ({
      canCheck: isDesktop,
      isDesktop,
      result: desktop.result,
      progress: desktop.progress,
      open: desktop.open,
      checking: desktop.checking,
      setOpen: desktop.setOpen,
      checkForUpdates: desktop.checkForUpdates,
      installUpdate: desktop.installUpdate,
      getVersion,
    }),
    [isDesktop, desktop, getVersion],
  );
}
