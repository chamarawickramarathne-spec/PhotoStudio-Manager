import type { UpdateResult } from "@/lib/update/types";
import { compareVersions } from "@/lib/update/version";

/**
 * GitHub release repository used as the Git-based update source.
 * Mirrors UPDATE_REPO in desktop/main.js (env-overridable there; the mobile
 * build ships the default).
 */
export const UPDATE_REPO = "chamarawickramarathne-spec/PhotoStudio-Manager";

/** Stable asset naming: the release must carry `PhotoStudioManager-<version>.apk`. */
export function apkAssetName(version: string): string {
  return `PhotoStudioManager-${version}.apk`;
}

interface GitHubAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

interface GitHubRelease {
  tag_name?: string;
  assets?: GitHubAsset[];
}

/**
 * Checks the GitHub latest release for a newer version that ships a matching
 * APK + checksum. Fails closed: missing APK or missing .sha256 is reported as
 * a refusal status, never as an installable update.
 */
export async function checkForAndroidUpdate(currentVersion: string): Promise<UpdateResult> {
  let release: GitHubRelease;
  try {
    const response = await fetch(`https://api.github.com/repos/${UPDATE_REPO}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) throw new Error(`Release server responded with HTTP ${response.status}`);
    release = (await response.json()) as GitHubRelease;
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : String(error) };
  }

  const latestVersion = String(release.tag_name ?? "").replace(/^v/i, "");
  const cmp = compareVersions(latestVersion, currentVersion);
  if (cmp === null) {
    return { status: "error", message: `Unparseable release version: ${release.tag_name ?? ""}` };
  }
  if (cmp <= 0) return { status: "up-to-date", currentVersion };

  const apkName = apkAssetName(latestVersion);
  const assets = release.assets ?? [];
  const apk = assets.find((asset) => asset.name === apkName);
  const checksum = assets.find((asset) => asset.name === `${apkName}.sha256`);

  if (!apk) {
    return { status: "installer-missing", latestVersion, message: `Release is missing ${apkName}.` };
  }
  if (!checksum) {
    return {
      status: "integrity-unavailable",
      latestVersion,
      message: "Release has no .sha256 checksum; update refused.",
    };
  }

  return {
    status: "update-available",
    currentVersion,
    latestVersion,
    downloadUrl: apk.browser_download_url,
    checksumUrl: checksum.browser_download_url,
    size: apk.size,
  };
}
