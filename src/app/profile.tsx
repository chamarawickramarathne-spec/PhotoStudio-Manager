import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import { Button, Divider, List } from "react-native-paper";

import { AppHeader, KeyboardScreen } from "@/components/ui/Screen";
import { AppAvatar } from "@/components/ui/AppAvatar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { CURRENCIES } from "@/lib/constants";
import { getDesktopBridge, type UpdateResult } from "@/lib/desktop";
import { getErrorMessage } from "@/lib/utils";
import { palette, radius, spacing } from "@/theme";

function updateLabel(result: UpdateResult): string {
  switch (result.status) {
    case "up-to-date":
      return `You are up to date (v${result.currentVersion}).`;
    case "update-available":
      return `Update v${result.latestVersion} is available - tap Install.`;
    case "installing":
      return "Installing update... the app will close.";
    case "downloading":
      return `Downloading update v${result.latestVersion}...`;
    case "disabled":
      return "Updates are disabled for this build.";
    case "integrity-mismatch":
      return result.message || "Installer verification failed.";
    case "integrity-unavailable":
      return result.message || "Update refused: no checksum available.";
    case "installer-missing":
      return result.message || "Update refused: installer missing.";
    case "error":
      return result.message || "Could not check for updates.";
    default:
      return "Update status unknown.";
  }
}

export default function ProfileScreen() {
  const { profile, currency, signOut, updateProfile } = useAuth();
  const [saveError, setSaveError] = useState("");
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [desktopVersion, setDesktopVersion] = useState("");
  const [updateState, setUpdateState] = useState<UpdateResult | null>(null);
  const [checking, setChecking] = useState(false);

  const desktop = getDesktopBridge();

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;
    const bridge = getDesktopBridge();
    if (bridge) {
      bridge
        .getVersion()
        .then((v) => {
          if (mounted) setDesktopVersion(v);
        })
        .catch(() => {});
      unsubscribe = bridge.onUpdateStatus((payload) => {
        if (mounted) setUpdateState(payload);
      });
    }
    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const setCurrency = async (code: string) => {
    setSaveError("");
    setSaving(true);
    try {
      await updateProfile({ currency_type: code });
    } catch (e) {
      setSaveError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleCheckForUpdates = async () => {
    const bridge = getDesktopBridge();
    if (!bridge || checking) return;
    setChecking(true);
    try {
      setUpdateState(await bridge.checkForUpdates());
    } catch (e) {
      setUpdateState({ status: "error", message: getErrorMessage(e) });
    } finally {
      setChecking(false);
    }
  };

  const handleInstallUpdate = async () => {
    const bridge = getDesktopBridge();
    if (!bridge) return;
    setUpdateState({ status: "downloading", latestVersion: "" });
    setUpdateState(await bridge.installUpdate());
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <KeyboardScreen>
      <AppHeader title="Profile" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <AppAvatar name={profile?.full_name ?? "P"} size={88} />
          <Text style={styles.name}>{profile?.business_name || profile?.full_name || "Photographer"}</Text>
          <Text style={styles.phone}>{profile?.phone ?? profile?.full_name ?? ""}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Currency</Text>
          <Text style={styles.cardSub}>Used for all amounts across the app.</Text>
          <View style={styles.currencyRow}>
            {CURRENCIES.map((c) => (
              <Button
                key={c.code}
                mode={currency === c.code ? "contained" : "outlined"}
                onPress={() => void setCurrency(c.code)}
                loading={saving}
                style={styles.currencyBtn}
                labelStyle={{ fontSize: 13 }}
              >
                {c.code}
              </Button>
            ))}
          </View>
          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <List.Item
            title="Sign Out"
            description="End this session on this device"
            left={() => <List.Icon icon="logout" color={palette.danger} />}
            onPress={() => setSignOutOpen(true)}
          />
          <Divider />
          {desktop ? (
            <>
              <List.Item
                title={checking ? "Checking for updates..." : "Check for Updates"}
                description={
                  updateState ? updateLabel(updateState) : "Look for a newer version"
                }
                left={() => (
                  <List.Icon
                    icon={checking ? "progress-download" : "cloud-download-outline"}
                    color={palette.secondary}
                  />
                )}
                onPress={() => void handleCheckForUpdates()}
              />
              {updateState?.status === "update-available" ? (
                <>
                  <Divider />
                  <List.Item
                    title="Install Update"
                    description="Downloads, verifies and installs v"
                    left={() => <List.Icon icon="download" color={palette.success} />}
                    onPress={() => void handleInstallUpdate()}
                  />
                </>
              ) : null}
              <Divider />
            </>
          ) : null}
          <List.Item
            title="PhotoStudio Manager"
            description={
              desktop
                ? `Desktop version ${desktopVersion || "..."}`
                : `Version ${Constants.expoConfig?.version ?? ""}`
            }
            left={() => <List.Icon icon="information-outline" color={palette.onSurfaceVariant} />}
          />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={signOutOpen}
        title="Sign Out?"
        message="You will need your password to sign back in."
        confirmLabel="Sign Out"
        onCancel={() => setSignOutOpen(false)}
        onConfirm={() => void handleSignOut()}
      />
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 60 },
  hero: { alignItems: "center", gap: spacing.sm, marginBottom: spacing.xl, marginTop: spacing.sm },
  name: { fontSize: 22, fontWeight: "800", color: palette.onBackground, marginTop: spacing.sm },
  phone: { fontSize: 14, color: palette.onSurfaceVariant },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: "800", color: palette.onBackground },
  cardSub: { fontSize: 13, color: palette.onSurfaceVariant, marginTop: 2, marginBottom: spacing.md },
  currencyRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  currencyBtn: { borderRadius: radius.pill },
  error: { color: palette.danger, fontSize: 13, marginTop: spacing.md },
});
