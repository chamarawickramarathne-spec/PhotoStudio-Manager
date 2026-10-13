import type { UpdateProgress, UpdateResult } from "@/lib/update/types";

export type { UpdateProgress, UpdateResult };

export interface DesktopNotification {
  title: string;
  body: string;
}

export interface DesktopBridge {
  isDesktop: boolean;
  getVersion: () => Promise<string>;
  checkForUpdates: () => Promise<UpdateResult>;
  installUpdate: () => Promise<UpdateResult>;
  onUpdateStatus: (callback: (payload: UpdateResult) => void) => () => void;
  onUpdateProgress: (callback: (payload: UpdateProgress) => void) => () => void;
  notify: (options: DesktopNotification) => Promise<void>;
}

export function getDesktopBridge(): DesktopBridge | null {
  const bridge = (globalThis as unknown as { photoStudioDesktop?: DesktopBridge })
    .photoStudioDesktop;
  return bridge ?? null;
}