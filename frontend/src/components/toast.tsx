import { CheckCircle, Info, WarningCircle } from "phosphor-react-native";
import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts, makeStyles, useTheme } from "@/src/theme";

type ToastType = "success" | "error" | "info";

type ToastState = { message: string; type: ToastType } | null;

type ToastContextValue = {
  show: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const [toast, setToast] = useState<ToastState>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setToast(null));
  }, [opacity, translateY]);

  const show = useCallback(
    (message: string, type: ToastType = "info") => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, type });
      opacity.setValue(0);
      translateY.setValue(-20);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start();
      timer.current = setTimeout(hide, 2600);
    },
    [hide, opacity, translateY],
  );

  const accent =
    toast?.type === "success"
      ? colors.success
      : toast?.type === "error"
        ? colors.error
        : colors.info;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <View
          pointerEvents="none"
          style={[styles.wrap, { top: insets.top + 8 }]}
        >
          <Animated.View
            testID="app-toast"
            style={[
              styles.toast,
              { borderLeftColor: accent, opacity, transform: [{ translateY }] },
            ]}
          >
            {toast.type === "success" ? (
              <CheckCircle size={22} color={accent} weight="fill" />
            ) : toast.type === "error" ? (
              <WarningCircle size={22} color={accent} weight="fill" />
            ) : (
              <Info size={22} color={accent} weight="fill" />
            )}
            <Text style={styles.text}>{toast.message}</Text>
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceTertiary,
    borderLeftWidth: 4,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    maxWidth: 480,
    width: "100%",
  },
  text: {
    flex: 1,
    color: colors.onSurface,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
}));
