import { useState, type ReactNode } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";

interface ResponsiveWrapProps {
  minItemWidth: number;
  gap: number;
  children: ReactNode;
}

export function ResponsiveWrap({ minItemWidth, gap, children }: ResponsiveWrapProps) {
  const [width, setWidth] = useState(0);
  const items = (Array.isArray(children) ? children : [children]).filter(Boolean) as ReactNode[];

  const columns = width > 0 ? Math.max(1, Math.floor((width + gap) / (minItemWidth + gap))) : 1;
  const itemWidth = width > 0 ? Math.floor(((width - gap * (columns - 1)) / columns) * 100) / 100 : minItemWidth;

  return (
    <View
      style={[styles.wrap, { gap }]}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
    >
      {width > 0
        ? items.map((child, index) => (
            <View key={index} style={{ width: itemWidth }}>
              {child}
            </View>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", paddingBottom: 1 },
});
