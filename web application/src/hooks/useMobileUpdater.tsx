import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { isNativeApp } from "@/lib/platform";
import { checkForAndroidUpdate } from "@/lib/update/check";
import { installAndroidUpdate } from "@/lib/update/install";
import type { UpdateProgress, UpdateResult } from "@/lib/update/types";
import { APP_VERSION } from "@/lib/version";

interface MobileUpdaterValue {
  isMobile: boolean;
  result: UpdateResult | null;
  progress: UpdateProgress | null;
  open: boolean;
  checking: boolean;
  setOpen: (open: boolean) => void;
  checkForUpdates: () => Promise<void>;
  installUpdate: () => Promise<void>;
}

const MobileUpdaterContext = createContext<MobileUpdaterValue | null>(null);

const STARTUP_CHECK_DELAY_MS = 4000;

export function MobileUpdaterProvider({ children }: { children: ReactNode }) {
  const isMobile = useMemo(() => isNativeApp(), []);
  const mountedRef = useRef(true);
  const installingRef = useRef(false);
  const [result, setResult] = useState<UpdateResult | null>(null);
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Silent check shortly after launch: only surfaces the modal when a newer
  // release with a matching APK actually exists (never on errors/up-to-date).
  useEffect(() => {
    if (!isMobile) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      void checkForAndroidUpdate(APP_VERSION).then((res) => {
        if (cancelled || res.status !== "update-available") return;
        setResult(res);
        setProgress(null);
        setOpen(true);
      });
    }, STARTUP_CHECK_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isMobile]);

  const checkForUpdates = useCallback(async () => {
    if (checking) return;
    setChecking(true);
    try {
      const res = await checkForAndroidUpdate(APP_VERSION);
      if (mountedRef.current) {
        setResult(res);
        setProgress(null);
        setOpen(true);
      }
    } finally {
      if (mountedRef.current) setChecking(false);
    }
  }, [checking]);

  const installUpdate = useCallback(async () => {
    if (installingRef.current) return;
    if (result?.status !== "update-available" || !result.downloadUrl || !result.checksumUrl) return;
    const request = {
      latestVersion: result.latestVersion,
      downloadUrl: result.downloadUrl,
      checksumUrl: result.checksumUrl,
    };
    installingRef.current = true;
    setResult({ status: "downloading", latestVersion: request.latestVersion });
    setProgress(null);
    try {
      const res = await installAndroidUpdate(request, (p) => {
        if (mountedRef.current) setProgress(p);
      });
      if (mountedRef.current) setResult(res);
    } finally {
      installingRef.current = false;
    }
  }, [result]);

  const value = useMemo<MobileUpdaterValue>(
    () => ({
      isMobile,
      result,
      progress,
      open,
      checking,
      setOpen,
      checkForUpdates,
      installUpdate,
    }),
    [isMobile, result, progress, open, checking, checkForUpdates, installUpdate],
  );

  return <MobileUpdaterContext.Provider value={value}>{children}</MobileUpdaterContext.Provider>;
}

export function useMobileUpdater(): MobileUpdaterValue {
  const ctx = useContext(MobileUpdaterContext);
  if (!ctx) throw new Error("useMobileUpdater must be used within MobileUpdaterProvider");
  return ctx;
}
