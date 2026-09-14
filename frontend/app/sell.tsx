import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useToast } from "@/src/components/toast";
import { useCreateSale } from "@/src/lib/api";
import { formatNumber, parseNumberInput } from "@/src/lib/format";
import { fonts, makeStyles, useTheme } from "@/src/theme";

function todayLabel() {
  return new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function SellScreen() {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const createSale = useCreateSale();

  const params = useLocalSearchParams<{
    hargaModal?: string;
    hargaJual?: string;
    margin?: string;
    kode?: string;
  }>();

  const [tanggal, setTanggal] = useState(todayLabel());
  const [namaPembeli, setNamaPembeli] = useState("");
  const [namaBarang, setNamaBarang] = useState("");
  const [kodeBarang, setKodeBarang] = useState("");
  const [ukuranWarna, setUkuranWarna] = useState("");
  const [hargaModal, setHargaModal] = useState(
    formatNumber(Number(params.hargaModal ?? 0)),
  );
  const [hargaJual, setHargaJual] = useState(
    formatNumber(Number(params.hargaJual ?? 0)),
  );
  const [margin, setMargin] = useState(formatNumber(Number(params.margin ?? 0)));

  const onSave = () => {
    createSale.mutate(
      {
        tanggal_penjualan: tanggal || null,
        nama_pembeli: namaPembeli || null,
        nama_barang: namaBarang || null,
        kode_barang: kodeBarang || null,
        ukuran_warna: ukuranWarna || null,
        kode_huruf: params.kode || null,
        harga_modal: parseNumberInput(hargaModal) || null,
        harga_jual: parseNumberInput(hargaJual) || null,
        margin: parseNumberInput(margin) || null,
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          ).catch(() => {});
          toast.show("Penjualan tersimpan", "success");
          router.replace("/history");
        },
        onError: (e: any) => {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error,
          ).catch(() => {});
          toast.show(e?.message || "Gagal menyimpan", "error");
        },
      },
    );
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          testID="sell-back-button"
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
        >
          <ArrowLeft size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <Text style={styles.headerTitle}>Barang Terjual</Text>
        <View style={{ width: 42 }} />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bottomOffset={90}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.optionalNote}>Semua kolom bersifat opsional</Text>

        <Field label="Tanggal Penjualan" testID="field-tanggal">
          <TextInput
            testID="input-tanggal"
            value={tanggal}
            onChangeText={setTanggal}
            placeholder="cth. 12 Juni 2026"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
        </Field>

        <Field label="Nama Pembeli" testID="field-pembeli">
          <TextInput
            testID="input-pembeli"
            value={namaPembeli}
            onChangeText={setNamaPembeli}
            placeholder="Nama pembeli"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
        </Field>

        <Field label="Nama Barang" testID="field-barang">
          <TextInput
            testID="input-barang"
            value={namaBarang}
            onChangeText={setNamaBarang}
            placeholder="cth. Sepeda Lipat"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
        </Field>

        <Field label="Kode Barang" testID="field-kode">
          <TextInput
            testID="input-kode"
            value={kodeBarang}
            onChangeText={setKodeBarang}
            placeholder="cth. SPD-001"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
        </Field>

        <Field label="Ukuran & Warna" testID="field-ukuran">
          <TextInput
            testID="input-ukuran"
            value={ukuranWarna}
            onChangeText={setUkuranWarna}
            placeholder="cth. 26 inci, Merah"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
        </Field>

        <View style={styles.row}>
          <Field label="Harga Modal" testID="field-modal" flex>
            <View style={styles.moneyWrap}>
              <Text style={styles.rp}>Rp</Text>
              <TextInput
                testID="input-modal"
                value={hargaModal}
                onChangeText={(t) => setHargaModal(formatNumber(parseNumberInput(t)))}
                keyboardType="number-pad"
                style={styles.moneyInput}
              />
            </View>
          </Field>
          <Field label="Margin" testID="field-margin" flex>
            <View style={styles.moneyWrap}>
              <Text style={styles.rp}>Rp</Text>
              <TextInput
                testID="input-margin"
                value={margin}
                onChangeText={(t) => setMargin(formatNumber(parseNumberInput(t)))}
                keyboardType="number-pad"
                style={styles.moneyInput}
              />
            </View>
          </Field>
        </View>

        <Field label="Harga Jual" testID="field-jual">
          <View style={[styles.moneyWrap, styles.moneyWrapAccent]}>
            <Text style={styles.rpAccent}>Rp</Text>
            <TextInput
              testID="input-jual"
              value={hargaJual}
              onChangeText={(t) => setHargaJual(formatNumber(parseNumberInput(t)))}
              keyboardType="number-pad"
              style={styles.moneyInputAccent}
            />
          </View>
        </Field>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            testID="save-sale-button"
            onPress={onSave}
            disabled={createSale.isPending}
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && { opacity: 0.9 },
              createSale.isPending && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.saveBtnText}>
              {createSale.isPending ? "MENYIMPAN..." : "SIMPAN PENJUALAN"}
            </Text>
          </Pressable>
        </View>
      </KeyboardStickyView>
    </View>
  );
}

function Field({
  label,
  children,
  testID,
  flex,
}: {
  label: string;
  children: React.ReactNode;
  testID?: string;
  flex?: boolean;
}) {
  const styles = useStyles();
  return (
    <View style={[styles.field, flex && { flex: 1 }]} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      {children}
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
  headerTitle: {
    fontFamily: fonts.displaySemi,
    fontSize: 22,
    color: colors.onSurface,
    letterSpacing: 0.5,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 24, gap: 14 },
  optionalNote: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    marginBottom: 2,
  },
  field: { gap: 6 },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.muted,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.onSurface,
  },
  row: { flexDirection: "row", gap: 12 },
  moneyWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  moneyWrapAccent: { borderColor: colors.brandSecondary },
  rp: { fontFamily: fonts.semibold, fontSize: 15, color: colors.muted },
  rpAccent: { fontFamily: fonts.semibold, fontSize: 15, color: colors.brandPrimary },
  moneyInput: {
    flex: 1,
    fontFamily: fonts.displaySemi,
    fontSize: 20,
    color: colors.onSurface,
    paddingVertical: 12,
  },
  moneyInputAccent: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.brandPrimary,
    paddingVertical: 12,
  },
  ctaBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  saveBtn: {
    backgroundColor: colors.brandPrimary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  saveBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    letterSpacing: 1,
    color: colors.onBrandPrimary,
  },
}));
