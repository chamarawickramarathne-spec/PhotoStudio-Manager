import path from "node:path";
import process from "node:process";
import { readFileSync } from "node:fs";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const pkg = JSON.parse(readFileSync(path.resolve(process.cwd(), "package.json"), "utf8"));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const publicVars = [
    "EXPO_PUBLIC_SUPABASE_URL",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    "EXPO_PUBLIC_AVATAR_KEY",
  ];

  const define: Record<string, string> = {
    "process.env.NODE_ENV": JSON.stringify(mode === "production" ? "production" : "development"),
    __APP_VERSION__: JSON.stringify(pkg.version),
  };
  for (const name of publicVars) {
    define[`process.env.${name}`] = JSON.stringify(env[name] ?? "");
  }

  return {
    plugins: [react()],
    define,
    resolve: {
      alias: [
        { find: "react-native", replacement: "react-native-web" },
        { find: "@", replacement: path.resolve(process.cwd(), "src") },
        {
          find: "@react-native-vector-icons/ionicons",
          replacement: "@react-native-vector-icons/ionicons/static",
        },
        {
          find: "@react-native-vector-icons/material-design-icons",
          replacement: "@react-native-vector-icons/material-design-icons/static",
        },
        {
          find: "@expo/vector-icons/MaterialCommunityIcons",
          replacement: "@react-native-vector-icons/material-design-icons/static",
        },
        {
          find: "expo-font",
          replacement: path.resolve(process.cwd(), "src/vendor/stubs/expo-font.ts"),
        },
      ],
      extensions: [".web.tsx", ".web.ts", ".web.js", ".mjs", ".js", ".jsx", ".ts", ".tsx", ".json"],
    },
    optimizeDeps: {
      include: ["react-native-web", "react-native-paper", "@react-native-vector-icons/ionicons"],
    },
    build: {
      outDir: "desktop/dist",
      emptyOutDir: true,
      target: "es2020",
    },
    server: {
      port: 5173,
    },
  };
});