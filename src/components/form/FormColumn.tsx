import type { ReactNode } from "react";
import { View } from "react-native";

export function FormColumn({ children, maxWidth }: { children: ReactNode; maxWidth: number }) {
  return (
    <View style={{ width: "100%", maxWidth, alignSelf: "center" }}>{children}</View>
  );
}