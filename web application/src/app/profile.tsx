import { useState } from "react";
import { Image, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Text as PaperText } from "react-native-paper";
import Ionicons from "@react-native-vector-icons/ionicons";

import { AppHeader, KeyboardScreen } from "@/components/ui/Screen";
import { AppAvatar } from "@/components/ui/AppAvatar";
import { PhotographerForm } from "@/forms/PhotographerForm";
import { useAuth } from "@/hooks/useAuth";
import { useProfileAvatar } from "@/hooks/useProfileAvatar";
import { CURRENCIES } from "@/lib/constants";
import { canProcessAvatar, compressImageFile, encryptAvatar } from "@/lib/media";
import { getErrorMessage } from "@/lib/utils";
import { palette, radius, spacing } from "@/theme";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function ProfileScreen() {
  const { profile, currency, updateProfile } = useAuth();
  const [saveError, setSaveError] = useState("");
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const setCurrency = async (code: string) => {
    setSaveError("");
    setSavingCode(code);
    try {
      await updateProfile({ currency_type: code });
    } catch (e) {
      setSaveError(getErrorMessage(e));
    } finally {
      setSavingCode(null);
    }
  };

  const handleFile = async (file: File) => {
    if (!profile) return;
    setSaveError("");
    if (!file.type.startsWith("image/")) {
      setSaveError("Please select an image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setSaveError("Image must be 5MB or smaller.");
      return;
    }
    if (!canProcessAvatar()) return;
    setUploading(true);
    try {
      const compressed = await compressImageFile(file);
      const encrypted = await encryptAvatar(compressed.bytes, compressed.mime);
      await updateProfile({ avatar_data: encrypted.data, avatar_mime: encrypted.mime });
    } catch (e) {
      setSaveError(getErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const avatarUri = useProfileAvatar();

  return (
    <KeyboardScreen>
      <AppHeader title="Profile" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          {avatarUri ? (
            <View style={styles.avatarImageWrap}>
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} resizeMode="cover" />
            </View>
          ) : (
            <AppAvatar name={profile?.full_name ?? "P"} size={88} />
          )}
          <Text style={styles.name}>{profile?.business_name || profile?.full_name || "Photographer"}</Text>
          <Text style={styles.phone}>{profile?.phone ?? profile?.business_phone ?? ""}</Text>
          {Platform.OS === "web" && canProcessAvatar() ? (
            <View style={styles.uploadRow}>
              <input
                id="profile-media-upload"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                  (e.target as HTMLInputElement).value = "";
                }}
              />
              <Button
                mode="outlined"
                icon="camera"
                loading={uploading}
                disabled={uploading}
                onPress={() => (document.getElementById("profile-media-upload") as HTMLInputElement | null)?.click()}
                style={styles.uploadBtn}
                labelStyle={{ fontSize: 13 }}
              >
                {uploading ? "Uploading…" : "Upload Logo / Image"}
              </Button>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle-outline" size={20} color={palette.primary} />
            <Text style={styles.cardTitle}>Photographer Details</Text>
          </View>
          <Text style={styles.cardSub}>Your name, studio contact and bio.</Text>
          <PhotographerForm />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cash-outline" size={20} color={palette.gold} />
            <Text style={styles.cardTitle}>Currency</Text>
          </View>
          <Text style={styles.cardSub}>Used for all amounts across the app.</Text>
          <View style={styles.currencyRow}>
            {CURRENCIES.map((c) => (
              <Button
                key={c.code}
                mode={currency === c.code ? "contained" : "outlined"}
                onPress={() => void setCurrency(c.code)}
                loading={savingCode === c.code}
                style={styles.currencyBtn}
                labelStyle={{ fontSize: 13 }}
              >
                {c.code}
              </Button>
            ))}
          </View>
          <PaperText style={styles.currencySub}>
            {CURRENCIES.find((c) => c.code === currency)?.label ?? currency}
          </PaperText>
        </View>

        {saveError ? (
          <Text style={styles.error}>{saveError}</Text>
        ) : null}
      </ScrollView>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 60 },
  hero: { alignItems: "center", gap: spacing.sm, marginBottom: spacing.xl, marginTop: spacing.sm },
  avatarImageWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: "hidden",
    backgroundColor: palette.surfaceVariant,
  },
  avatarImage: { width: "100%", height: "100%" },
  name: { fontSize: 22, fontWeight: "800", color: palette.onBackground, marginTop: spacing.sm },
  phone: { fontSize: 14, color: palette.onSurfaceVariant },
  uploadRow: { marginTop: spacing.sm },
  uploadBtn: { borderRadius: radius.pill },
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
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  cardTitle: { fontSize: 15, fontWeight: "800", color: palette.onBackground },
  cardSub: { fontSize: 13, color: palette.onSurfaceVariant, marginTop: 2, marginBottom: spacing.md },
  currencyRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  currencyBtn: { borderRadius: radius.pill },
  currencySub: { fontSize: 12, color: palette.onSurfaceVariant, marginTop: spacing.md },
  error: { color: palette.danger, fontSize: 13, textAlign: "center", marginTop: spacing.md },
});