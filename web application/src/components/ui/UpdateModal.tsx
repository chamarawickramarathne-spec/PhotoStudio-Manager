import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ActivityIndicator, Button, Modal, ProgressBar } from "react-native-paper";
import Ionicons from "@react-native-vector-icons/ionicons";

import type { UpdateProgress, UpdateResult } from "@/lib/desktop";
import { isNativeApp } from "@/lib/platform";
import { palette, radius, spacing } from "@/theme";

interface UpdateModalProps {
  visible: boolean;
  result: UpdateResult | null;
  progress: UpdateProgress | null;
  checking: boolean;
  onClose: () => void;
  onInstall: () => void;
}

function statusLine(
  result: UpdateResult | null,
  progress: UpdateProgress | null,
  checking: boolean,
): { title: string; detail: string; status: "working" | "ready" | "done" | "error" } {
  if (checking) return { title: "Checking for updates…", detail: "Looking for the latest release.", status: "working" };
  if (!result) return { title: "Check for updates", detail: "Look for a newer version of PhotoStudio Manager.", status: "ready" };

  switch (result.status) {
    case "update-available":
      return {
        title: `Update v${result.latestVersion} available`,
        detail: `You are running v${result.currentVersion}. The update is verified before install.`,
        status: "ready",
      };
    case "downloading":
      if (progress?.stage === "verifying") {
        return { title: "Verifying update…", detail: "Checking integrity before install.", status: "working" };
      }
      return {
        title: "Downloading update…",
        detail: `${progress?.percent ?? 0}% — this may take a moment.`,
        status: "working",
      };
    case "installing":
      return {
        title: "Installing update…",
        detail: isNativeApp()
          ? "Confirm the system install prompt to finish."
          : "The app will close when finished.",
        status: "working",
      };
    case "up-to-date":
      return { title: `You are up to date (v${result.currentVersion})`, detail: "No new version available.", status: "done" };
    case "disabled":
      return { title: "Updates disabled", detail: "Update checking is off for this build.", status: "done" };
    case "integrity-mismatch":
      return {
        title: "Update failed a security check",
        detail: "The downloaded update didn't match its expected checksum and was not installed. Please try again.",
        status: "error",
      };
    case "integrity-unavailable":
      return {
        title: "Update couldn't be verified",
        detail: "This release is missing its security checksum, so the update was not installed. Please try again later.",
        status: "error",
      };
    case "installer-missing":
      return {
        title: "Update not available yet",
        detail: result.latestVersion
          ? `A newer version (v${result.latestVersion}) has been released, but it isn't available for this device yet. Please check back later.`
          : "A newer version has been released, but it isn't available for this device yet. Please check back later.",
        status: "error",
      };
    case "error":
      return {
        title: "Couldn't check for updates",
        detail: "Please check your internet connection and try again.",
        status: "error",
      };
    default:
      return { title: "Update", detail: "Unknown status.", status: "done" };
  }
}

export function UpdateModal({ visible, result, progress, checking, onClose, onInstall }: UpdateModalProps) {
  const line = statusLine(result, progress, checking);

  // Refusal/error statuses carry a technical reason (asset names, HTTP codes).
  // That detail stays out of the user-facing copy above but is preserved here
  // for diagnostics.
  useEffect(() => {
    if (result && "message" in result && result.message) {
      console.warn("[updater]", result.status, result.message);
    }
  }, [result]);
  const downloading =
    result?.status === "downloading" || (progress?.stage === "downloading" && result?.status !== "installing");
  const percent =
    progress?.stage === "downloading" && progress.percent != null
      ? Math.max(0, Math.min(progress.percent / 100, 1))
      : 0;

  return (
    <Modal visible={visible} onDismiss={onClose} dismissable={line.status !== "working"}>
      <View style={styles.sheet}>
        <View style={styles.iconWrap}>
          {line.status === "error" ? (
            <Ionicons name="close-circle" size={34} color={palette.danger} />
          ) : line.status === "done" ? (
            <Ionicons name="checkmark-circle" size={34} color={palette.success} />
          ) : (
            <Ionicons name="cloud-download" size={34} color={palette.primary} />
          )}
        </View>

        <Text style={styles.title}>{line.title}</Text>
        <Text style={styles.detail}>{line.detail}</Text>

        {downloading ? (
          <View style={styles.progressWrap}>
            <ProgressBar progress={percent} color={palette.primary} style={styles.progress} />
            <View style={styles.percentRow}>
              <Text style={styles.percentText}>{Math.round(percent * 100)}%</Text>
              {progress?.stage === "verifying" ? <Text style={styles.percentText}>Verifying…</Text> : null}
            </View>
          </View>
        ) : null}

        {line.status === "working" ? <ActivityIndicator color={palette.primary} style={styles.spinner} /> : null}

        <View style={styles.actions}>
          {result?.status === "update-available" ? (
            <>
              <Button mode="contained" onPress={onInstall} style={styles.button} labelStyle={styles.buttonLabel}>
                Install Now
              </Button>
              <Button mode="outlined" onPress={onClose} style={styles.button} labelStyle={styles.buttonLabel}>
                Later
              </Button>
            </>
          ) : line.status === "working" ? (
            <Button mode="outlined" onPress={onClose} style={styles.button} labelStyle={styles.buttonLabel}>
              Close
            </Button>
          ) : (
            <Button mode="contained" onPress={onClose} style={styles.button} labelStyle={styles.buttonLabel}>
              {line.status === "error" ? "OK" : "Done"}
            </Button>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    marginHorizontal: 32,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.surfaceVariant,
  },
  title: { fontSize: 17, fontWeight: "800", color: palette.onBackground, textAlign: "center" },
  detail: { fontSize: 13, color: palette.onSurfaceVariant, textAlign: "center", lineHeight: 19 },
  progressWrap: { alignSelf: "stretch", gap: spacing.xs },
  progress: { height: 8, borderRadius: radius.pill, backgroundColor: palette.surfaceVariant },
  percentRow: { flexDirection: "row", justifyContent: "space-between" },
  percentText: { fontSize: 11, fontWeight: "700", color: palette.onSurfaceVariant },
  spinner: { marginVertical: spacing.sm },
  actions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  button: { borderRadius: radius.pill },
  buttonLabel: { paddingHorizontal: 8 },
});