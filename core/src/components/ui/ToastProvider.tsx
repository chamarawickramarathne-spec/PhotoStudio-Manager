import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Portal, Snackbar } from "react-native-paper";

import { palette, radius } from "@/theme";

interface ToastApi {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), 2600);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      <Portal.Host>
        {children}
        <Snackbar
          visible={visible}
          onDismiss={() => setVisible(false)}
          duration={2600}
          style={styles.snackbar}
        >
          {message}
        </Snackbar>
      </Portal.Host>
    </ToastContext.Provider>
  );
}

export function useAppToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useAppToast must be used inside <ToastProvider>");
  return ctx;
}

const styles = {
  snackbar: { backgroundColor: palette.onBackground, borderRadius: radius.pill },
};