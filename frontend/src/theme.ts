// Design tokens for BikePOS. Dark-first (red & black) per design_guidelines.json.
//
// The keys match the "color" block of /app/design_guidelines.json. The app ships
// a single dark aesthetic, so the `light` object below holds the dark palette and
// is used as the default scheme. Build styles with makeStyles() and read colors
// via useTheme().colors. Never write color literals in components.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  // Surfaces
  surface: "#0D0D0D",
  onSurface: "#F5F5F5",
  surfaceSecondary: "#1A1A1A",
  onSurfaceSecondary: "#E5E5E5",
  surfaceTertiary: "#262626",
  onSurfaceTertiary: "#D4D4D4",
  surfaceInverse: "#E5E5E5",
  onSurfaceInverse: "#0D0D0D",
  muted: "#808080",

  // Brand (red)
  brand: "#D92121",
  onBrand: "#FFFFFF",
  brandPrimary: "#E62E2E",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#B31B1B",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#3D1010",
  onBrandTertiary: "#FFB3B3",

  // Status
  success: "#198754",
  onSuccess: "#FFFFFF",
  warning: "#FFC107",
  onWarning: "#0D0D0D",
  error: "#DC3545",
  onError: "#FFFFFF",
  info: "#0DCAF0",
  onInfo: "#0D0D0D",

  // Lines
  border: "#333333",
  borderStrong: "#4D4D4D",
  divider: "#262626",
};

export type ThemeColors = typeof light;

export const defaultScheme = "light" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark?: ThemeColors } = { light };

// Font families loaded in app/_layout.tsx via expo-font.
export const fonts = {
  display: "Rajdhani-Bold",
  displaySemi: "Rajdhani-SemiBold",
  displayMedium: "Rajdhani-Medium",
  regular: "IBMPlexSans-Regular",
  medium: "IBMPlexSans-Medium",
  semibold: "IBMPlexSans-SemiBold",
};

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme);
}

setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
