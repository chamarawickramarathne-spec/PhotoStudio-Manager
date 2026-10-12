import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { App } from "@capacitor/app";

import { useAppToast } from "@/components/ui/ToastProvider";
import { isNativeApp } from "@/lib/platform";

type BackHandler = () => void;

interface BackInterceptApi {
  register: (id: string, handler: BackHandler) => void;
  unregister: (id: string) => void;
  runTop: () => boolean;
}

const BackInterceptContext = createContext<BackInterceptApi | null>(null);

const EXIT_WINDOW_MS = 2000;

export function BackHandlerProvider({ children }: { children: ReactNode }) {
  const toast = useAppToast();
  const stack = useRef<{ id: string; handler: BackHandler }[]>([]);
  const lastExitPress = useRef(0);

  const register = useCallback((id: string, handler: BackHandler) => {
    stack.current = stack.current.filter((entry) => entry.id !== id);
    stack.current.push({ id, handler });
  }, []);

  const unregister = useCallback((id: string) => {
    stack.current = stack.current.filter((entry) => entry.id !== id);
  }, []);

  const runTop = useCallback((): boolean => {
    const top = stack.current[stack.current.length - 1];
    if (!top) return false;
    top.handler();
    return true;
  }, []);

  useEffect(() => {
    if (!isNativeApp()) return;

    let disposed = false;
    let remove: (() => Promise<void>) | undefined;

    const onBack = () => {
      if (runTop()) return;

      const state = window.history.state as { idx?: number } | null;
      const idx = state?.idx;
      const canGoBack = typeof idx === "number" ? idx > 0 : window.history.length > 1;
      if (canGoBack) {
        window.history.back();
        return;
      }

      const now = Date.now();
      if (now - lastExitPress.current < EXIT_WINDOW_MS) {
        void App.exitApp();
      } else {
        lastExitPress.current = now;
        toast.show("Press back again to exit");
      }
    };

    void App.addListener("backButton", onBack).then((handle) => {
      if (disposed) void handle.remove();
      else remove = () => handle.remove();
    });

    return () => {
      disposed = true;
      void remove?.();
    };
  }, [runTop, toast]);

  const api = useMemo<BackInterceptApi>(() => ({ register, unregister, runTop }), [register, unregister, runTop]);

  return <BackInterceptContext.Provider value={api}>{children}</BackInterceptContext.Provider>;
}

/**
 * Registers a hardware-back interceptor while `active` is true. When the
 * Android back button is pressed, the most recently registered active
 * interceptor runs first (e.g. the top-most open dialog); if none is active,
 * navigation/exit handling applies. No-op on web/desktop.
 */
export function useBackIntercept(active: boolean, onBack: BackHandler): void {
  const ctx = useContext(BackInterceptContext);
  const handlerRef = useRef(onBack);
  handlerRef.current = onBack;
  const stable = useCallback(() => handlerRef.current(), []);
  const idRef = useRef(`${Date.now()}-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    if (!ctx || !active) return;
    const id = idRef.current;
    ctx.register(id, stable);
    return () => ctx.unregister(id);
  }, [ctx, active, stable]);
}
