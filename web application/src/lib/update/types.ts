export type UpdateResult =
  | { status: "disabled"; currentVersion?: string }
  | { status: "up-to-date"; currentVersion: string }
  | {
      status: "update-available";
      currentVersion: string;
      latestVersion: string;
      /** Absolute URL of the update package (Android self-update flow). */
      downloadUrl?: string;
      /** Absolute URL of the package's .sha256 checksum (Android self-update flow). */
      checksumUrl?: string;
      size?: number;
    }
  | { status: "installing" }
  | { status: "downloading"; latestVersion: string }
  | { status: "integrity-mismatch"; message: string }
  | { status: "integrity-unavailable"; latestVersion?: string; message?: string }
  | { status: "installer-missing"; latestVersion?: string; message?: string }
  | { status: "error"; message?: string };

export type UpdateProgress =
  | { stage: "downloading"; percent: number; latestVersion?: string }
  | { stage: "verifying"; percent: number; latestVersion?: string };
