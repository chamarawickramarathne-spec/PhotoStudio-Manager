export interface Sha256Options {
  /** Absolute path to an .apk inside the app cache directory. */
  path: string;
}

export interface Sha256Result {
  /** Lowercase hex SHA-256 digest of the file. */
  hex: string;
}

export interface InstallApkOptions {
  /** Absolute path to an .apk inside the app cache directory. */
  path: string;
}

export interface PsmInstallPlugin {
  /**
   * Stream-hash a file with SHA-256 (native, constant memory).
   * Rejects unless the path is an existing `.apk` inside the app cache dir.
   */
  sha256(options: Sha256Options): Promise<Sha256Result>;
  /**
   * Hand a downloaded APK to the system package installer
   * (FileProvider content:// URI + ACTION_VIEW). The user confirms in the
   * system dialog; first run may also prompt for "install unknown apps".
   */
  installApk(options: InstallApkOptions): Promise<void>;
}

export declare const PsmInstall: PsmInstallPlugin;
