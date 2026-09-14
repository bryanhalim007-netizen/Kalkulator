import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Camera,
  CalendarBlank,
  ImageSquare,
  X,
} from "phosphor-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DatePickerModal } from "@/src/components/date-picker-modal";
import { Segmented } from "@/src/components/segmented";
import { useToast } from "@/src/components/toast";
import { fileUrl, uploadImage, useCreateSale, useSale, useUpdateSale } from "@/src/lib/api";
import { formatNumber, parseNumberInput } from "@/src/lib/format";
import { fonts, makeStyles, useTheme } from "@/src/theme";

const ID_MONTHS = [
  "januari",
  "februari",
  "maret",
  "april",
  "mei",
  "juni",
  "juli",
  "agustus",
  "september",
  "oktober",
  "november",
  "desember",
];

function formatDateLabel(d: Date) {
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function parseDateLabel(label?: string | null): Date | null {
  if (!label) return null;
  const m = label.trim().toLowerCase().match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
  if (!m) return null;
  const day = Number(m[1]);
  const monthIdx = ID_MONTHS.indexOf(m[2]);
  const year = Number(m[3]);
  if (monthIdx < 0) return null;
  return new Date(year, monthIdx, day);
}

export default function SellScreen() {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const createSale = useCreateSale();
  const updateSale = useUpdateSale();

  const params = useLocalSearchParams<{
    hargaModal?: string;
    hargaJual?: string;
    margin?: string;
    kode?: string;
    editId?: string;
  }>();

  const editId = params.editId;
  const isEdit = !!editId;
  const { data: editSale } = useSale(editId);

  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [namaPembeli, setNamaPembeli] = useState("");
  const [namaBarang, setNamaBarang] = useState("");
  const [kodeBarang, setKodeBarang] = useState(params.kode ?? "");
  const [ukuranWarna, setUkuranWarna] = useState("");
  const [hargaModal, setHargaModal] = useState(
    formatNumber(Number(params.hargaModal ?? 0)),
  );
  const [hargaJual, setHargaJual] = useState(
    formatNumber(Number(params.hargaJual ?? 0)),
  );
  const [margin, setMargin] = useState(formatNumber(Number(params.margin ?? 0)));
  const [metodePembayaran, setMetodePembayaran] = useState<string | null>(null);
  const [sudahDiambil, setSudahDiambil] = useState<string | null>(null);
  const [metodePengambilan, setMetodePengambilan] = useState<string | null>(
    null,
  );
  const [alamatPengiriman, setAlamatPengiriman] = useState("");
  const [fotoPath, setFotoPath] = useState<string | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  // Prefill semua kolom saat mode edit (sekali, ketika data tiba).
  useEffect(() => {
    if (!isEdit || !editSale || prefilled) return;
    const d = parseDateLabel(editSale.tanggal_penjualan);
    if (d) setDate(d);
    setNamaPembeli(editSale.nama_pembeli ?? "");
    setNamaBarang(editSale.nama_barang ?? "");
    setKodeBarang(editSale.kode_barang ?? "");
    setUkuranWarna(editSale.ukuran_warna ?? "");
    setHargaModal(formatNumber(editSale.harga_modal ?? 0));
    setHargaJual(formatNumber(editSale.harga_jual ?? 0));
    setMargin(formatNumber(editSale.margin ?? 0));
    setMetodePembayaran(editSale.metode_pembayaran ?? null);
    setSudahDiambil(editSale.sudah_diambil ?? null);
    setMetodePengambilan(editSale.metode_pengambilan ?? null);
    setAlamatPengiriman(editSale.alamat_pengiriman ?? "");
    setFotoPath(editSale.foto_path ?? null);
    setFotoPreview(fileUrl(editSale.foto_path));
    setPrefilled(true);
  }, [isEdit, editSale, prefilled]);

  const doUpload = async (uri: string) => {
    setUploading(true);
    setFotoPreview(uri);
    try {
      const path = await uploadImage(uri);
      setFotoPath(path);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      toast.show("Foto terunggah", "success");
    } catch (e: any) {
      setFotoPreview(fileUrl(fotoPath));
      toast.show(e?.message || "Gagal mengunggah foto", "error");
    } finally {
      setUploading(false);
    }
  };

  const ensurePermission = async (kind: "camera" | "gallery") => {
    const get =
      kind === "camera"
        ? ImagePicker.getCameraPermissionsAsync
        : ImagePicker.getMediaLibraryPermissionsAsync;
    const req =
      kind === "camera"
        ? ImagePicker.requestCameraPermissionsAsync
        : ImagePicker.requestMediaLibraryPermissionsAsync;
    let perm = await get();
    if (perm.status !== "granted" && perm.canAskAgain) {
      perm = await req();
    }
    if (perm.status !== "granted") {
      toast.show(
        kind === "camera"
          ? "Izin kamera diperlukan. Aktifkan di Pengaturan."
          : "Izin galeri diperlukan. Aktifkan di Pengaturan.",
        "error",
      );
      if (!perm.canAskAgain) Linking.openSettings().catch(() => {});
      return false;
    }
    return true;
  };

  const pickFromGallery = async () => {
    Haptics.selectionAsync().catch(() => {});
    if (!(await ensurePermission("gallery"))) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.6,
    });
    if (!res.canceled && res.assets?.[0]) doUpload(res.assets[0].uri);
  };

  const takePhoto = async () => {
    Haptics.selectionAsync().catch(() => {});
    if (!(await ensurePermission("camera"))) return;
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.6,
    });
    if (!res.canceled && res.assets?.[0]) doUpload(res.assets[0].uri);
  };

  const removePhoto = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setFotoPath(null);
    setFotoPreview(null);
  };

  const onSave = () => {
    const payload = {
      tanggal_penjualan: formatDateLabel(date),
      nama_pembeli: namaPembeli || null,
      nama_barang: namaBarang || null,
      kode_barang: kodeBarang || null,
      ukuran_warna: ukuranWarna || null,
      kode_huruf: isEdit ? editSale?.kode_huruf ?? null : params.kode || null,
      harga_modal: parseNumberInput(hargaModal) || null,
      harga_jual: parseNumberInput(hargaJual) || null,
      margin: parseNumberInput(margin) || null,
      metode_pembayaran: metodePembayaran,
      sudah_diambil: sudahDiambil,
      metode_pengambilan: metodePengambilan,
      alamat_pengiriman: alamatPengiriman || null,
      foto_path: fotoPath,
    };

    const onSuccess = () => {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
      toast.show(isEdit ? "Perubahan tersimpan" : "Penjualan tersimpan", "success");
      if (isEdit) router.back();
      else router.replace("/history");
    };
    const onError = (e: any) => {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error,
      ).catch(() => {});
      toast.show(e?.message || "Gagal menyimpan", "error");
    };

    if (isEdit && editId) {
      updateSale.mutate({ id: editId, payload }, { onSuccess, onError });
    } else {
      createSale.mutate(payload, { onSuccess, onError });
    }
  };

  const saving = createSale.isPending || updateSale.isPending || uploading;

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
        <Text style={styles.headerTitle}>{isEdit ? "Edit Penjualan" : "Barang Terjual"}</Text>
        <View style={{ width: 42 }} />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bottomOffset={90}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.optionalNote}>Semua kolom bersifat opsional</Text>

        <Field label="Foto Produk" testID="field-foto">
          {fotoPreview ? (
            <View style={styles.photoWrap} testID="foto-preview">
              <Image source={{ uri: fotoPreview }} style={styles.photo} contentFit="cover" />
              {uploading && (
                <View style={styles.photoOverlay}>
                  <ActivityIndicator color={colors.onBrandPrimary} />
                  <Text style={styles.photoOverlayText}>Mengunggah...</Text>
                </View>
              )}
              {!uploading && (
                <>
                  <Pressable
                    testID="foto-remove"
                    onPress={removePhoto}
                    hitSlop={8}
                    style={styles.photoRemove}
                  >
                    <X size={16} color={colors.onSurface} weight="bold" />
                  </Pressable>
                  <Pressable
                    testID="foto-change"
                    onPress={pickFromGallery}
                    style={styles.photoChange}
                  >
                    <Text style={styles.photoChangeText}>Ganti</Text>
                  </Pressable>
                </>
              )}
            </View>
          ) : (
            <View style={styles.photoBtnRow}>
              <Pressable
                testID="foto-gallery"
                onPress={pickFromGallery}
                style={({ pressed }) => [styles.photoBtn, pressed && styles.iconBtnPressed]}
              >
                <ImageSquare size={22} color={colors.brandPrimary} weight="bold" />
                <Text style={styles.photoBtnText}>Galeri</Text>
              </Pressable>
              <Pressable
                testID="foto-camera"
                onPress={takePhoto}
                style={({ pressed }) => [styles.photoBtn, pressed && styles.iconBtnPressed]}
              >
                <Camera size={22} color={colors.brandPrimary} weight="bold" />
                <Text style={styles.photoBtnText}>Kamera</Text>
              </Pressable>
            </View>
          )}
        </Field>

        <Field label="Tanggal Penjualan" testID="field-tanggal">
          <Pressable
            testID="date-picker-button"
            onPress={() => setShowDatePicker(true)}
            style={({ pressed }) => [styles.dateBtn, pressed && styles.iconBtnPressed]}
          >
            <CalendarBlank size={20} color={colors.brandPrimary} weight="bold" />
            <Text testID="date-picker-value" style={styles.dateBtnText}>
              {formatDateLabel(date)}
            </Text>
          </Pressable>
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

        <Field label="Metode Pembayaran" testID="field-pembayaran">
          <Segmented
            testIDPrefix="pembayaran"
            value={metodePembayaran}
            onChange={setMetodePembayaran}
            options={[
              { value: "Cash", label: "Cash" },
              { value: "Transfer", label: "Transfer" },
            ]}
          />
        </Field>

        <Field label="Apakah sudah diambil?" testID="field-diambil">
          <Segmented
            testIDPrefix="diambil"
            value={sudahDiambil}
            onChange={setSudahDiambil}
            options={[
              { value: "Belum", label: "Belum" },
              { value: "Sudah", label: "Sudah" },
            ]}
          />
        </Field>

        <Field label="Metode Pengambilan" testID="field-pengambilan">
          <Segmented
            testIDPrefix="pengambilan"
            value={metodePengambilan}
            onChange={setMetodePengambilan}
            options={[
              { value: "Pick up Sendiri", label: "Pick up Sendiri" },
              { value: "Travel", label: "Travel" },
            ]}
          />
        </Field>

        <Field label="Alamat Pengiriman" testID="field-alamat">
          <TextInput
            testID="input-alamat"
            value={alamatPengiriman}
            onChangeText={setAlamatPengiriman}
            placeholder="Alamat lengkap pengiriman"
            placeholderTextColor={colors.muted}
            multiline
            style={[styles.input, styles.textArea]}
          />
        </Field>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            testID="save-sale-button"
            onPress={onSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && { opacity: 0.9 },
              saving && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.saveBtnText}>
              {saving
                ? "MENYIMPAN..."
                : isEdit
                  ? "SIMPAN PERUBAHAN"
                  : "SIMPAN PENJUALAN"}
            </Text>
          </Pressable>
        </View>
      </KeyboardStickyView>

      <DatePickerModal
        visible={showDatePicker}
        value={date}
        onSelect={setDate}
        onClose={() => setShowDatePicker(false)}
      />
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
  photoBtnRow: { flexDirection: "row", gap: 12 },
  photoBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 18,
  },
  photoBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.onSurface,
  },
  photoWrap: {
    height: 200,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photo: { width: "100%", height: "100%" },
  photoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  photoOverlayText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.onBrandPrimary,
  },
  photoRemove: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  photoChange: {
    position: "absolute",
    bottom: 10,
    right: 10,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: colors.brandPrimary,
  },
  photoChangeText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.onBrandPrimary,
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
  textArea: { minHeight: 84, textAlignVertical: "top", paddingTop: 13 },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 15,
  },
  dateBtnText: {
    fontFamily: fonts.semibold,
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
