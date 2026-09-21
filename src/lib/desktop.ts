export type UpdateResult =
  | { status: "disabled"; currentVersion?: string }
  | { status: "up-to-date"; currentVersion: string }
  | { status: "update-available"; currentVersion: string; latestVersion: string }
  | { status: "installing" }
  | { status: "downloading"; latestVersion: string }
  | { status: "integrity-mismatch"; message: string }
  | { status: "integrity-unavailable"; latestVersion?: string; message?: string }
  | { status: "installer-missing"; latestVersion?: string; message?: string }
  | { status: "error"; message?: string };

export type UpdateProgress =
  | { stage: "downloading"; percent: number; latestVersion?: string }
  | { stage: "verifying"; percent: number; latestVersion?: string };

export interface DesktopBridge {
  isDesktop: boolean;
  getVersion: () => Promise<string>;
  checkForUpdates: () => Promise<UpdateResult>;
  installUpdate: () => Promise<UpdateResult>;
  onUpdateStatus: (callback: (payload: UpdateResult) => void) => () => void;
  onUpdateProgress: (callback: (payload: UpdateProgress) => void) => () => void;
}

export function getDesktopBridge(): DesktopBridge | null {
  const bridge = (globalThis as unknown as { photoStudioDesktop?: DesktopBridge })
    .photoStudioDesktop;
  return bridge ?? null;
}