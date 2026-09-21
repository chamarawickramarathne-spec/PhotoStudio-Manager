import { ActivityIndicator, StyleSheet, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { DesktopUpdaterProvider, useDesktopUpdater } from "@/hooks/useDesktopUpdater";
import { UpdateModal } from "@/components/ui/UpdateModal";
import { appRouter } from "@/navigation/router";
import { theme, palette } from "@/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function AppGate() {
  const { loading } = useAuth();
  const updater = useDesktopUpdater();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  return (
    <>
      <RouterProvider router={appRouter} />
      <UpdateModal
        visible={updater.open}
        result={updater.result}
        progress={updater.progress}
        checking={updater.checking}
        onClose={() => updater.setOpen(false)}
        onInstall={() => void updater.installUpdate()}
      />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          <AuthProvider>
            <DesktopUpdaterProvider>
              <AppGate />
            </DesktopUpdaterProvider>
          </AuthProvider>
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.background },
});