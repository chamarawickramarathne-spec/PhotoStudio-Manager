import { type ComponentProps, type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Appbar } from "react-native-paper";
import { useRouter } from "@/navigation/router";

import { palette } from "@/theme";

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  contentContainerStyle?: object;
  refreshControl?: ComponentProps<typeof ScrollView>["refreshControl"];
}

export function Screen({ children, scroll = true, contentContainerStyle, refreshControl }: ScreenProps) {
  const body = scroll ? (
    <ScrollView
      style={styles.body}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.body, styles.flex, contentContainerStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {body}
    </SafeAreaView>
  );
}

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: ReactNode;
}

export function AppHeader({ title, subtitle, showBack, right }: AppHeaderProps) {
  const router = useRouter();
  return (
    <Appbar.Header style={styles.header} statusBarHeight={0}>
      {showBack && <Appbar.BackAction onPress={() => router.back()} />}
      <Appbar.Content title={title} titleStyle={styles.title} subtitle={subtitle} />
      {right}
    </Appbar.Header>
  );
}

export function KeyboardScreen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  flex: { flex: 1 },
  body: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120 },
  header: { backgroundColor: palette.surface, elevation: 0 },
  title: { fontWeight: "700" },
});
