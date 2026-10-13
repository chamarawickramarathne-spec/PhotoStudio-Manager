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

import {
  getDesktopBridge,
  type UpdateProgress,
  type UpdateResult,
} from "@/lib/desktop";

interface DesktopUpdaterValue {
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

const DesktopUpdaterContext = createContext<DesktopUpdaterValue | null>(null);

export function DesktopUpdaterProvider({ children }: { children: ReactNode }) {
  const bridge = useMemo(() => getDesktopBridge(), []);
  const mountedRef = useRef(true);
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

  useEffect(() => {
    if (!bridge) return undefined;
    const unsubStatus = bridge.onUpdateStatus((status) => {
      if (!mountedRef.current) return;
      setResult(status);
      if (status.status === "update-available") setOpen(true);
      if (
        status.status === "downloading" ||
        status.status === "installing" ||
        status.status === "integrity-mismatch" ||
        status.status === "integrity-unavailable" ||
        status.status === "installer-missing" ||
        status.status === "error"
      ) {
        setOpen(true);
      }
    });
    const unsubProgress = bridge.onUpdateProgress((p) => {
      if (!mountedRef.current) return;
      setProgress(p);
      setOpen(true);
    });
    return () => {
      unsubStatus();
      unsubProgress();
    };
  }, [bridge]);

  const checkForUpdates = useCallback(async () => {
    if (!bridge || checking) return;
    setChecking(true);
    try {
      const res = await bridge.checkForUpdates();
      if (mountedRef.current) {
        setResult(res);
        setOpen(true);
      }
    } catch (e) {
      if (mountedRef.current) {
        setResult({ status: "error", message: e instanceof Error ? e.message : String(e) });
        setOpen(true);
      }
    } finally {
      if (mountedRef.current) setChecking(false);
    }
  }, [bridge, checking]);

  const installUpdate = useCallback(async () => {
    if (!bridge) return;
    setResult({ status: "downloading", latestVersion: "" });
    const res = await bridge.installUpdate();
    if (mountedRef.current) setResult(res);
  }, [bridge]);

  const getVersion = useCallback(() => {
    if (!bridge) return Promise.resolve("");
    return bridge.getVersion();
  }, [bridge]);

  const value = useMemo<DesktopUpdaterValue>(
    () => ({
      isDesktop: !!bridge,
      result,
      progress,
      open,
      checking,
      setOpen,
      checkForUpdates,
      installUpdate,
      getVersion,
    }),
    [bridge, result, progress, open, checking, checkForUpdates, installUpdate, getVersion],
  );

  return <DesktopUpdaterContext.Provider value={value}>{children}</DesktopUpdaterContext.Provider>;
}

export function useDesktopUpdater(): DesktopUpdaterValue {
  const ctx = useContext(DesktopUpdaterContext);
  if (!ctx) throw new Error("useDesktopUpdater must be used within DesktopUpdaterProvider");
  return ctx;
}