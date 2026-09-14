import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Bicycle,
  CalendarBlank,
  Clock,
  CreditCard,
  MapPin,
  Package,
  PencilSimple,
  TrashSimple,
  WhatsappLogo,
} from "phosphor-react-native";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";

import { useToast } from "@/src/components/toast";
import { Sale, salePhotos, useDeleteSale, useSale } from "@/src/lib/api";
import { formatJam, formatRupiah, formatTanggal } from "@/src/lib/format";
import { shareSaleToWhatsApp } from "@/src/lib/share";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { Image } from "expo-image";

export default function SaleDetailScreen() {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: sale, isLoading, isError } = useSale(id);
  const deleteSale = useDeleteSale();
  const [confirmVisible, setConfirmVisible] = useState(false);

  const onShare = async () => {
    if (!sale) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const ok = await shareSaleToWhatsApp(sale);
    if (!ok) toast.show("Tidak dapat membuka WhatsApp", "error");
  };

  const onDelete = () => {
    if (!sale) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    deleteSale.mutate(sale.id, {
      onSuccess: () => {
        toast.show("Penjualan dihapus", "success");
        router.back();
      },
      onError: () => toast.show("Gagal menghapus", "error"),
    });
  };

  const taken = sale?.sudah_diambil === "Sudah";

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          testID="detail-back-button"
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
        >
          <ArrowLeft size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <Text style={styles.headerTitle}>Detail Penjualan</Text>
        <Pressable
          testID="detail-edit-button"
          onPress={() => {
            if (!sale) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            router.push({ pathname: "/sell", params: { editId: sale.id } });
          }}
          hitSlop={10}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
        >
          <PencilSimple size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brandPrimary} size="large" />
        </View>
      ) : isError || !sale ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Data tidak ditemukan</Text>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              { paddingBottom: insets.bottom + 120 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero */}
            <View style={styles.hero} testID="detail-hero">
              <View style={styles.heroIcon}>
                <Bicycle size={26} color={colors.brandPrimary} weight="bold" />
              </View>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {sale.nama_barang || "Barang tanpa nama"}
              </Text>
              <View
                style={[styles.statusBadge, taken ? styles.badgeSuccess : styles.badgeMuted]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    taken ? styles.badgeTextSuccess : styles.badgeTextMuted,
                  ]}
                >
                  {sale.sudah_diambil === "Sudah"
                    ? "SUDAH DIAMBIL"
                    : sale.sudah_diambil === "Belum"
                      ? "BELUM DIAMBIL"
                      : "STATUS BELUM DIATUR"}
                </Text>
              </View>
              <Text style={styles.heroLabel}>HARGA JUAL</Text>
              <Text style={styles.heroPrice}>{formatRupiah(sale.harga_jual)}</Text>
            </View>

            {/* Foto Produk */}
            {salePhotos(sale).length > 0 ? (
              salePhotos(sale).length === 1 ? (
                <Image
                  testID="detail-foto"
                  source={{ uri: salePhotos(sale)[0] }}
                  style={styles.detailPhoto}
                  contentFit="cover"
                />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.photoStripContent}
                  testID="detail-foto"
                >
                  {salePhotos(sale).map((uri, i) => (
                    <Image
                      key={`${uri}-${i}`}
                      source={{ uri }}
                      style={styles.photoStripItem}
                      contentFit="cover"
                    />
                  ))}
                </ScrollView>
              )
            ) : null}

            {/* Waktu */}
            <Section title="Waktu" icon={<CalendarBlank size={16} color={colors.brandPrimary} weight="bold" />}>
              <Row label="Tanggal Penjualan" value={sale.tanggal_penjualan || formatTanggal(sale.created_at)} />
              <Row label="Jam Transaksi" value={formatJam(sale.created_at)} icon={<Clock size={14} color={colors.muted} weight="bold" />} last />
            </Section>

            {/* Barang & Pembeli */}
            <Section title="Barang & Pembeli" icon={<Bicycle size={16} color={colors.brandPrimary} weight="bold" />}>
              <Row label="Nama Pembeli" value={sale.nama_pembeli} />
              <Row label="Nama Barang" value={sale.nama_barang} />
              <Row label="Kode Barang" value={sale.kode_barang} />
              <Row label="Kode Huruf" value={sale.kode_huruf} mono />
              <Row label="Ukuran & Warna" value={sale.ukuran_warna} last />
            </Section>

            {/* Pembayaran & Pengambilan */}
            <Section title="Pembayaran & Pengambilan" icon={<CreditCard size={16} color={colors.brandPrimary} weight="bold" />}>
              <Row label="Metode Pembayaran" value={sale.metode_pembayaran} />
              <Row label="Status Pengambilan" value={sale.sudah_diambil ? (taken ? "Sudah diambil" : "Belum diambil") : null} />
              <Row label="Metode Pengambilan" value={sale.metode_pengambilan} icon={<Package size={14} color={colors.muted} weight="bold" />} />
              <Row label="Alamat Pengiriman" value={sale.alamat_pengiriman} icon={<MapPin size={14} color={colors.muted} weight="bold" />} last />
            </Section>

            {/* Rincian Harga */}
            <Section title="Rincian Harga" icon={<CreditCard size={16} color={colors.brandPrimary} weight="bold" />}>
              <Row label="Harga Modal" value={formatRupiah(sale.harga_modal)} />
              <Row label="Margin" value={formatRupiah(sale.margin)} accent />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>HARGA JUAL</Text>
                <Text style={styles.totalValue}>{formatRupiah(sale.harga_jual)}</Text>
              </View>
            </Section>
          </ScrollView>

          <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 12 }]}>
            <Pressable
              testID="detail-delete-button"
              onPress={() => setConfirmVisible(true)}
              style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.85 }]}
            >
              <TrashSimple size={20} color={colors.error} weight="bold" />
            </Pressable>
            <Pressable
              testID="detail-share-cta"
              onPress={onShare}
              style={({ pressed }) => [styles.shareCta, pressed && { opacity: 0.9 }]}
            >
              <WhatsappLogo size={20} color={colors.onBrandPrimary} weight="fill" />
              <Text style={styles.shareCtaText}>KIRIM KE WHATSAPP</Text>
            </Pressable>
          </View>

          <Modal
            visible={confirmVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setConfirmVisible(false)}
          >
            <Pressable
              style={styles.confirmOverlay}
              onPress={() => setConfirmVisible(false)}
              testID="confirm-overlay"
            >
              <Pressable style={styles.confirmCard} onPress={() => {}}>
                <Text style={styles.confirmTitle}>Hapus Penjualan?</Text>
                <Text style={styles.confirmText}>
                  Data penjualan ini akan dihapus dari riwayat.
                </Text>
                <View style={styles.confirmRow}>
                  <Pressable
                    testID="confirm-cancel"
                    onPress={() => setConfirmVisible(false)}
                    style={({ pressed }) => [
                      styles.confirmCancel,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text style={styles.confirmCancelText}>Batal</Text>
                  </Pressable>
                  <Pressable
                    testID="confirm-delete"
                    onPress={() => {
                      setConfirmVisible(false);
                      onDelete();
                    }}
                    style={({ pressed }) => [
                      styles.confirmDelete,
                      pressed && { opacity: 0.9 },
                    ]}
                  >
                    {deleteSale.isPending ? (
                      <ActivityIndicator color={colors.onError} />
                    ) : (
                      <Text style={styles.confirmDeleteText}>Hapus</Text>
                    )}
                  </Pressable>
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        </>
      )}
    </View>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({
  label,
  value,
  last,
  mono,
  accent,
  icon,
}: {
  label: string;
  value?: string | null;
  last?: boolean;
  mono?: boolean;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  const styles = useStyles();
  const has = value !== null && value !== undefined && String(value).length > 0;
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValueWrap}>
        {icon}
        <Text
          style={[
            styles.rowValue,
            mono && styles.rowValueMono,
            accent && styles.rowValueAccent,
            !has && styles.rowValueEmpty,
          ]}
        >
          {has ? value : "-"}
        </Text>
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
    fontSize: 20,
    color: colors.onSurface,
    letterSpacing: 0.5,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontFamily: fonts.displaySemi, fontSize: 20, color: colors.onSurface },
  scroll: { paddingHorizontal: 20, paddingTop: 6, gap: 16 },

  detailPhoto: {
    width: "100%",
    height: 220,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  photoStripContent: { gap: 10 },
  photoStripItem: {
    width: 200,
    height: 200,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },

  hero: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.brandPrimary,
    padding: 20,
    alignItems: "flex-start",
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroTitle: {
    fontFamily: fonts.displaySemi,
    fontSize: 24,
    color: colors.onSurface,
  },
  statusBadge: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  badgeSuccess: { backgroundColor: colors.success },
  badgeMuted: { backgroundColor: colors.surfaceTertiary },
  statusBadgeText: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1 },
  badgeTextSuccess: { color: colors.onSuccess },
  badgeTextMuted: { color: colors.muted },
  heroLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.brandPrimary,
    marginTop: 18,
  },
  heroPrice: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: colors.onSurface,
    marginTop: 2,
  },

  section: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 1.5,
    color: colors.muted,
    textTransform: "uppercase",
  },
  sectionBody: { paddingHorizontal: 16, paddingBottom: 6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
    flexShrink: 0,
  },
  rowValueWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    justifyContent: "flex-end",
  },
  rowValue: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.onSurface,
    textAlign: "right",
  },
  rowValueMono: { fontFamily: fonts.displaySemi, letterSpacing: 2 },
  rowValueAccent: { color: colors.brandPrimary, fontFamily: fonts.semibold },
  rowValueEmpty: { color: colors.surfaceTertiary },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.borderStrong,
  },
  totalLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 1.5,
    color: colors.brandPrimary,
  },
  totalValue: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.brandPrimary,
  },

  ctaBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  deleteBtn: {
    width: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.error,
  },
  shareCta: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
    backgroundColor: colors.brandPrimary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  shareCtaText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    letterSpacing: 1,
    color: colors.onBrandPrimary,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  confirmTitle: {
    fontFamily: fonts.displaySemi,
    fontSize: 20,
    color: colors.onSurface,
  },
  confirmText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.muted,
    marginTop: 6,
  },
  confirmRow: { flexDirection: "row", gap: 12, marginTop: 20 },
  confirmCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: colors.surfaceTertiary,
  },
  confirmCancelText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.onSurface,
  },
  confirmDelete: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.error,
  },
  confirmDeleteText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.onError,
  },
}));
