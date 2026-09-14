import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Backspace,
  ClockCounterClockwise,
  Eye,
  EyeSlash,
  Keyboard as KeyboardIcon,
  Receipt,
  TrashSimple,
} from "phosphor-react-native";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useToast } from "@/src/components/toast";
import {
  KEYPAD_LETTERS,
  LETTER_TO_DIGIT,
  digitsToModal,
  lettersToDigits,
} from "@/src/lib/calculator";
import { formatNumber, formatRupiah, parseNumberInput } from "@/src/lib/format";
import { fonts, makeStyles, useTheme } from "@/src/theme";

const QUICK_MARGINS = [100000, 250000, 500000, 1000000];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();

  const [letters, setLetters] = useState<string[]>([]);
  const [mode, setMode] = useState<"calc" | "jual">("calc");
  const [marginText, setMarginText] = useState("");
  const [keypadHidden, setKeypadHidden] = useState(false);

  const toggleKeypad = () => {
    Haptics.selectionAsync().catch(() => {});
    setKeypadHidden((v) => !v);
  };

  const digits = lettersToDigits(letters);
  const hargaModal = digitsToModal(digits);
  const margin = parseNumberInput(marginText);
  const hargaJual = hargaModal + margin;

  const tap = () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

  const pressLetter = (l: string) => {
    tap();
    setLetters((prev) => [...prev, l]);
  };

  const backspace = () => {
    tap();
    setLetters((prev) => prev.slice(0, -1));
  };

  const clearAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setLetters([]);
  };

  const onChangeCode = (text: string) => {
    const clean = text
      .toUpperCase()
      .split("")
      .filter((c) => KEYPAD_LETTERS.includes(c));
    setLetters(clean);
  };

  const onCheck = () => {
    if (hargaModal <= 0) {
      toast.show("Masukkan kode harga dulu", "error");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setMode("jual");
  };

  const onViewBuyer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    router.push({ pathname: "/buyer-price", params: { price: String(hargaJual) } });
  };

  const onSell = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push({
      pathname: "/sell",
      params: {
        hargaModal: String(hargaModal),
        hargaJual: String(hargaJual),
        margin: String(margin),
        kode: letters.join(""),
      },
    });
  };

  const addMargin = (amount: number) => {
    Haptics.selectionAsync().catch(() => {});
    setMarginText(formatNumber(margin + amount));
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.brandTag}>
          <Image
            source={require("../assets/images/sk-logo.png")}
            style={styles.brandLogo}
            contentFit="contain"
          />
          <Text style={styles.brandBike}>Bike</Text>
        </View>
        <Pressable
          testID="history-button"
          onPress={() => router.push("/history")}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          hitSlop={10}
        >
          <ClockCounterClockwise size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        {/* Code readout */}
        <View style={styles.codeCard}>
          <View style={styles.codeHeaderRow}>
            <Text style={styles.codeLabel}>KODE HARGA</Text>
            {letters.length > 0 && (
              <Pressable
                testID="clear-code-button"
                onPress={clearAll}
                hitSlop={10}
                style={styles.clearRow}
              >
                <TrashSimple size={14} color={colors.brandPrimary} weight="bold" />
                <Text style={styles.clearText}>Hapus</Text>
              </Pressable>
            )}
          </View>
          <TextInput
            testID="code-input"
            value={letters.join("")}
            onChangeText={onChangeCode}
            placeholder="Ketik kode, mis. YVK"
            placeholderTextColor={colors.surfaceTertiary}
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            style={styles.codeInput}
          />
          {digits.length > 0 && (
            <Text style={styles.digitsHint}>{digits.split("").join(" ")}</Text>
          )}
          <Text style={styles.codeHelper}>
            Huruf: P Y F V H K T B R Q Z · Z = ulang angka
          </Text>
        </View>

        {/* Modal + Jual readout */}
        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>HARGA MODAL</Text>
          <Text testID="harga-modal" style={styles.priceValue}>
            {formatRupiah(hargaModal)}
          </Text>

          {mode === "jual" && (
            <>
              <View style={styles.divider} />

              <Text style={styles.priceLabel}>MARGIN</Text>
              <View style={styles.marginInputRow}>
                <Text style={styles.rpPrefix}>Rp</Text>
                <TextInput
                  testID="margin-input"
                  value={marginText}
                  onChangeText={(t) => setMarginText(formatNumber(parseNumberInput(t)))}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  style={styles.marginInput}
                />
              </View>
              <View style={styles.chipsRow}>
                {QUICK_MARGINS.map((amt) => (
                  <Pressable
                    key={amt}
                    testID={`margin-chip-${amt}`}
                    onPress={() => addMargin(amt)}
                    style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                  >
                    <Text style={styles.chipText}>
                      +{amt >= 1000000 ? `${amt / 1000000}jt` : `${amt / 1000}rb`}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.divider} />

              <Text style={styles.priceLabelAccent}>HARGA JUAL</Text>
              <Text testID="harga-jual" style={styles.priceValueAccent}>
                {formatRupiah(hargaJual)}
              </Text>
            </>
          )}
        </View>

        {/* Keypad (calc mode only) */}
        {mode === "calc" && (
          <>
            <Pressable
              testID="toggle-keypad-button"
              onPress={toggleKeypad}
              style={({ pressed }) => [styles.toggleKeypad, pressed && { opacity: 0.6 }]}
              hitSlop={8}
            >
              {keypadHidden ? (
                <KeyboardIcon size={16} color={colors.muted} weight="bold" />
              ) : (
                <EyeSlash size={16} color={colors.muted} weight="bold" />
              )}
              <Text style={styles.toggleKeypadText}>
                {keypadHidden ? "Tampilkan Keypad" : "Sembunyikan Keypad"}
              </Text>
            </Pressable>
            {!keypadHidden && (
              <View style={styles.keypad} testID="letter-keypad">
                {KEYPAD_LETTERS.map((l) => (
                  <Pressable
                    key={l}
                    testID={`key-${l}`}
                    onPress={() => pressLetter(l)}
                    style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
                  >
                    <Text style={styles.keyLetter}>{l}</Text>
                    <Text style={styles.keyHint}>
                      {l === "Z" ? "×2" : LETTER_TO_DIGIT[l]}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  testID="key-backspace"
                  onPress={backspace}
                  style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
                >
                  <Backspace size={26} color={colors.onSurface} weight="bold" />
                </Pressable>
              </View>
            )}
          </>
        )}
      </KeyboardAwareScrollView>

      {/* Sticky CTAs */}
      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 12 }]}>
        {mode === "calc" ? (
          <Pressable
            testID="check-harga-jual-button"
            onPress={onCheck}
            style={({ pressed }) => [
              styles.primaryBtn,
              hargaModal <= 0 && styles.btnDisabled,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.primaryBtnText}>CHECK HARGA JUAL</Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              testID="back-to-calc-button"
              onPress={() => setMode("calc")}
              style={({ pressed }) => [styles.backLink, pressed && { opacity: 0.6 }]}
            >
              <ArrowLeft size={16} color={colors.muted} weight="bold" />
              <Text style={styles.backLinkText}>Ubah kode harga</Text>
            </Pressable>
            <View style={styles.ctaRow}>
              <Pressable
                testID="view-buyer-price-button"
                onPress={onViewBuyer}
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
              >
                <Eye size={20} color={colors.onSurface} weight="bold" />
                <Text style={styles.secondaryBtnText}>View Harga{"\n"}Ke Pembeli</Text>
              </Pressable>
              <Pressable
                testID="barang-terjual-button"
                onPress={onSell}
                style={({ pressed }) => [styles.primaryBtnHalf, pressed && styles.btnPressed]}
              >
                <Receipt size={20} color={colors.onBrandPrimary} weight="bold" />
                <Text style={styles.primaryBtnHalfText}>Barang{"\n"}Terjual</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  brandTag: { flexDirection: "row", alignItems: "center", gap: 5 },
  brandLogo: { height: 30, width: 43 },
  brandBike: {
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: 0.5,
    color: colors.onSurface,
  },
  brandText: {
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: 1.5,
    color: colors.onSurface,
  },
  brandTextAccent: {
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: 1.5,
    color: colors.brandPrimary,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBtnPressed: { backgroundColor: colors.surfaceTertiary },
  scroll: { paddingHorizontal: 20, paddingBottom: 24, gap: 16 },

  codeCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  codeHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  codeLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.muted,
  },
  clearRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  clearText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.brandPrimary,
  },
  codeValue: {
    fontFamily: fonts.display,
    fontSize: 40,
    letterSpacing: 6,
    color: colors.onSurface,
    marginTop: 6,
  },
  codePlaceholder: { color: colors.surfaceTertiary },
  codeInput: {
    fontFamily: fonts.display,
    fontSize: 40,
    letterSpacing: 6,
    color: colors.onSurface,
    marginTop: 6,
    paddingVertical: 2,
  },
  codeHelper: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.muted,
    marginTop: 8,
  },
  digitsHint: {
    fontFamily: fonts.medium,
    fontSize: 14,
    letterSpacing: 3,
    color: colors.brandPrimary,
    marginTop: 2,
  },

  priceCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  priceLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.muted,
  },
  priceLabelAccent: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.brandPrimary,
  },
  priceValue: {
    fontFamily: fonts.display,
    fontSize: 38,
    color: colors.onSurface,
    marginTop: 2,
  },
  priceValueAccent: {
    fontFamily: fonts.display,
    fontSize: 44,
    color: colors.brandPrimary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 16,
  },
  marginInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  rpPrefix: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: colors.muted,
  },
  marginInput: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.onSurface,
    paddingVertical: 12,
  },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  chip: {
    backgroundColor: colors.brandTertiary,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipPressed: { backgroundColor: colors.brandSecondary },
  chipText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.onBrandTertiary,
  },

  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  toggleKeypad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  toggleKeypadText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.muted,
  },
  key: {
    width: "31.5%",
    height: 64,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  keyPressed: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
    transform: [{ scale: 0.97 }],
  },
  keyLetter: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.onSurface,
    lineHeight: 30,
  },
  keyHint: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.muted,
    marginTop: 1,
  },

  ctaBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  primaryBtn: {
    backgroundColor: colors.brandPrimary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    letterSpacing: 1,
    color: colors.onBrandPrimary,
  },
  btnDisabled: { backgroundColor: colors.surfaceTertiary },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    paddingVertical: 8,
    marginBottom: 4,
  },
  backLinkText: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  ctaRow: { flexDirection: "row", gap: 12 },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.onSurface,
  },
  primaryBtnHalf: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.brandPrimary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnHalfText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.onBrandPrimary,
  },
}));
