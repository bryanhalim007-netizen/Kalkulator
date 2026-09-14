import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Backspace } from "phosphor-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { APP_PIN } from "@/src/lib/constants";
import { fonts, makeStyles, useTheme } from "@/src/theme";

const BG_IMAGE =
  "https://images.unsplash.com/photo-1646442424549-f6360ab0a82c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxiaWN5Y2xlJTIwZ2VhciUyMG1hY3JvfGVufDB8fHxibGFja3wxNzg5Mzg4MjkwfDA&ixlib=rb-4.1.0&q=85";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

export default function PinLockScreen() {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;

  const triggerShake = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
      () => {},
    );
    setError(true);
    Animated.sequence([
      Animated.timing(shake, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        setPin("");
        setError(false);
      }, 250);
    });
  }, [shake]);

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === APP_PIN) {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => {});
        router.replace("/home");
      } else {
        triggerShake();
      }
    }
  }, [pin, router, triggerShake]);

  const press = (k: string) => {
    if (k === "") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (k === "back") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    setPin((p) => (p.length >= 4 ? p : p + k));
  };

  return (
    <View style={styles.root}>
      <Image source={{ uri: BG_IMAGE }} style={styles.bg} contentFit="cover" />
      <LinearGradient
        colors={["rgba(13,13,13,0.55)", "rgba(13,13,13,0.85)", "#0D0D0D"]}
        locations={[0, 0.5, 1]}
        style={styles.scrim}
      />

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={styles.brandRow}>
          <View style={styles.brandTag} testID="pin-brand">
            <Text style={styles.brandTagText}>BIKE</Text>
            <Text style={styles.brandTagTextAccent}>POS</Text>
          </View>
          <Text style={styles.tagline}>KASIR SEPEDA</Text>
        </View>

        <View style={styles.bottom}>
          <Text style={styles.title}>Masukkan PIN</Text>
          <Text style={styles.subtitle}>
            {error ? "PIN salah, coba lagi" : "Buka kunci untuk melanjutkan"}
          </Text>

          <Animated.View
            style={[styles.dotsRow, { transform: [{ translateX: shake }] }]}
            testID="pin-dots"
          >
            {[0, 1, 2, 3].map((i) => {
              const filled = i < pin.length;
              return (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    filled && styles.dotFilled,
                    error && styles.dotError,
                  ]}
                />
              );
            })}
          </Animated.View>

          <View style={styles.keypad}>
            {KEYS.map((k, idx) => {
              if (k === "") return <View key={idx} style={styles.key} />;
              return (
                <Pressable
                  key={idx}
                  testID={`pin-key-${k}`}
                  onPress={() => press(k)}
                  style={({ pressed }) => [
                    styles.key,
                    pressed && styles.keyPressed,
                  ]}
                >
                  {k === "back" ? (
                    <Backspace size={26} color={colors.onSurface} weight="bold" />
                  ) : (
                    <Text style={styles.keyText}>{k}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const KEY_SIZE = 72;

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  bg: { position: "absolute", top: 0, left: 0, right: 0, height: "60%" },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: "space-between" },
  brandRow: { alignItems: "flex-start" },
  brandTag: { flexDirection: "row", alignItems: "center" },
  brandTagText: {
    fontFamily: fonts.display,
    fontSize: 34,
    letterSpacing: 2,
    color: colors.onSurface,
  },
  brandTagTextAccent: {
    fontFamily: fonts.display,
    fontSize: 34,
    letterSpacing: 2,
    color: colors.brandPrimary,
  },
  tagline: {
    fontFamily: fonts.medium,
    fontSize: 12,
    letterSpacing: 4,
    color: colors.muted,
    marginTop: 2,
  },
  bottom: { alignItems: "center" },
  title: {
    fontFamily: fonts.displaySemi,
    fontSize: 26,
    color: colors.onSurface,
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
  },
  dotsRow: { flexDirection: "row", gap: 18, marginVertical: 28 },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: "transparent",
  },
  dotFilled: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  dotError: { borderColor: colors.error },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: KEY_SIZE * 3 + 48,
    justifyContent: "space-between",
    rowGap: 16,
  },
  key: {
    width: KEY_SIZE,
    height: KEY_SIZE,
    borderRadius: KEY_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  keyPressed: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
    transform: [{ scale: 0.96 }],
  },
  keyText: {
    fontFamily: fonts.displaySemi,
    fontSize: 30,
    color: colors.onSurface,
  },
}));
