import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import type { PluginListenerHandle } from "@capacitor/core";
import { PsmInstall } from "capacitor-plugin-psm-install";

import { isNativeApp } from "@/lib/platform";
import type { UpdateProgress, UpdateResult } from "@/lib/update/types";

export interface InstallRequest {
  latestVersion: string;
  downloadUrl: string;
  checksumUrl: string;
}

async function deleteQuietly(fileName: string): Promise<void> {
  try {
    await Filesystem.deleteFile({ path: fileName, directory: Directory.Cache });
  } catch {
    // File already gone — nothing to clean up.
  }
}

/**
 * Downloads the release APK into the app cache (native transfer, no CORS),
 * verifies it against the release's .sha256 asset, and hands it to the system
 * package installer via the PsmInstall plugin. Fails closed on any mismatch.
 */
export async function installAndroidUpdate(
  request: InstallRequest,
  onProgress: (progress: UpdateProgress) => void,
): Promise<UpdateResult> {
  if (!isNativeApp()) {
    return { status: "error", message: "Updates can only be installed from the Android app." };
  }

  const apkName = `PhotoStudioManager-${request.latestVersion}.apk`;
  const checksumName = `${apkName}.sha256`;
  let listener: PluginListenerHandle | null = null;

  try {
    await deleteQuietly(apkName);
    await deleteQuietly(checksumName);

    listener = await Filesystem.addListener("progress", (status) => {
      if (status.contentLength <= 0) return;
      const percent = Math.min(100, Math.floor((status.bytes / status.contentLength) * 100));
      onProgress({ stage: "downloading", percent, latestVersion: request.latestVersion });
    });

    const apk = await Filesystem.downloadFile({
      url: request.downloadUrl,
      path: apkName,
      directory: Directory.Cache,
      progress: true,
    });
    if (!apk.path) {
      return { status: "error", message: "Download did not produce a file." };
    }

    onProgress({ stage: "verifying", percent: 100, latestVersion: request.latestVersion });
    await Filesystem.downloadFile({
      url: request.checksumUrl,
      path: checksumName,
      directory: Directory.Cache,
    });

    const checksumFile = await Filesystem.readFile({
      path: checksumName,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    const expected = String(checksumFile.data)
      .trim()
      .split(/\s+/)[0]?.toLowerCase();

    const { hex } = await PsmInstall.sha256({ path: apk.path });
    if (!expected || hex.toLowerCase() !== expected) {
      await deleteQuietly(apkName);
      return { status: "integrity-mismatch", message: "Update failed SHA-256 verification." };
    }

    await PsmInstall.installApk({ path: apk.path });
    return { status: "installing" };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : String(error) };
  } finally {
    await listener?.remove();
    await deleteQuietly(checksumName);
  }
}
