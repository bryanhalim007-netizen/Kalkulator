import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ArrowLeft, Bicycle, TrashSimple, WhatsappLogo } from "phosphor-react-native";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useToast } from "@/src/components/toast";
import { Sale, useDeleteSale, useSales } from "@/src/lib/api";
import { formatRupiah, formatTanggal } from "@/src/lib/format";
import { fonts, makeStyles, useTheme } from "@/src/theme";

const EMPTY_IMAGE =
  "https://images.unsplash.com/photo-1595886068978-59624dde48d1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzV8MHwxfHNlYXJjaHwxfHxlbXB0eSUyMGNsaXBib2FyZCUyMGRlc2t8ZW58MHx8fGJsYWNrfDE3ODkzODgyOTB8MA&ixlib=rb-4.1.0&q=85";

// WhatsApp tujuan (08125559681 -> format internasional).
const WA_NUMBER = "628125559681";

function buildSaleMessage(item: Sale): string {
  const line = (label: string, value?: string | null) =>
    `${label}: ${value && String(value).length ? value : "-"}`;
  return [
    "*Rincian Penjualan - SKBike*",
    "",
    line("Tanggal Penjualan", item.tanggal_penjualan || formatTanggal(item.created_at)),
    line("Nama Pembeli", item.nama_pembeli),
    line("Nama Barang", item.nama_barang),
    line("Kode Barang", item.kode_barang),
    line("Ukuran & Warna", item.ukuran_warna),
    line("Harga Modal", formatRupiah(item.harga_modal)),
    line("Margin", formatRupiah(item.margin)),
    line("Harga Jual", formatRupiah(item.harga_jual)),
  ].join("\n");
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { data, isLoading, isError, refetch, isRefetching } = useSales();
  const deleteSale = useDeleteSale();

  const onDelete = (sale: Sale) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    deleteSale.mutate(sale.id, {
      onSuccess: () => toast.show("Penjualan dihapus", "success"),
      onError: () => toast.show("Gagal menghapus", "error"),
    });
  };

  const onShare = async (sale: Sale) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const text = encodeURIComponent(buildSaleMessage(sale));
    // Official WhatsApp click-to-chat link: works on iOS, Android & web,
    // and opens the installed app when available.
    const url = `https://wa.me/${WA_NUMBER}?text=${text}`;
    try {
      await Linking.openURL(url);
    } catch {
      toast.show("Tidak dapat membuka WhatsApp", "error");
    }
  };

  const renderItem = ({ item }: { item: Sale }) => (
    <View style={styles.card} testID={`sale-card-${item.id}`}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.nama_barang || "Barang tanpa nama"}
          </Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {[item.nama_pembeli, item.tanggal_penjualan || formatTanggal(item.created_at)]
              .filter(Boolean)
              .join(" • ") || formatTanggal(item.created_at)}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <Pressable
            testID={`share-sale-${item.id}`}
            onPress={() => onShare(item)}
            hitSlop={8}
            style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.7 }]}
          >
            <WhatsappLogo size={18} color={colors.success} weight="fill" />
          </Pressable>
          <Pressable
            testID={`delete-sale-${item.id}`}
            onPress={() => onDelete(item)}
            hitSlop={8}
            style={({ pressed }) => [styles.delBtn, pressed && { opacity: 0.6 }]}
          >
            <TrashSimple size={18} color={colors.muted} weight="bold" />
          </Pressable>
        </View>
      </View>

      {(item.kode_barang || item.ukuran_warna) && (
        <Text style={styles.cardSub} numberOfLines={1}>
          {[item.kode_barang, item.ukuran_warna].filter(Boolean).join(" • ")}
        </Text>
      )}

      <View style={styles.cardDivider} />
      <View style={styles.priceRow}>
        <View>
          <Text style={styles.priceMini}>Modal</Text>
          <Text style={styles.priceMiniVal}>{formatRupiah(item.harga_modal)}</Text>
        </View>
        <View style={styles.alignEnd}>
          <Text style={styles.priceMini}>Harga Jual</Text>
          <Text style={styles.priceJual}>{formatRupiah(item.harga_jual)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          testID="history-back-button"
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
        >
          <ArrowLeft size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <Text style={styles.headerTitle}>Riwayat Penjualan</Text>
        <View style={{ width: 42 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brandPrimary} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Gagal memuat data</Text>
          <Pressable
            testID="retry-button"
            onPress={() => refetch()}
            style={styles.retryBtn}
          >
            <Text style={styles.retryText}>Coba Lagi</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          testID="sales-list"
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
            (data ?? []).length === 0 && styles.listEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.brandPrimary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap} testID="empty-state">
              <View style={styles.emptyImgWrap}>
                <Image source={{ uri: EMPTY_IMAGE }} style={styles.emptyImg} contentFit="cover" />
                <View style={styles.emptyIconBadge}>
                  <Bicycle size={28} color={colors.brandPrimary} weight="bold" />
                </View>
              </View>
              <Text style={styles.emptyTitle}>Belum ada penjualan</Text>
              <Text style={styles.emptyText}>
                Penjualan yang kamu simpan akan muncul di sini.
              </Text>
            </View>
          }
        />
      )}
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
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  listContent: { paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  listEmpty: { flexGrow: 1, justifyContent: "center" },

  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  cardActions: { flexDirection: "row", gap: 8 },
  shareBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
  },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.onSurface,
  },
  cardMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  cardSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.onSurfaceTertiary,
    marginTop: 6,
  },
  delBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
  },
  cardDivider: { height: 1, backgroundColor: colors.divider, marginVertical: 12 },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  alignEnd: { alignItems: "flex-end" },
  priceMini: {
    fontFamily: fonts.medium,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.muted,
    textTransform: "uppercase",
  },
  priceMiniVal: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.onSurfaceSecondary,
    marginTop: 2,
  },
  priceJual: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.brandPrimary,
    marginTop: 2,
  },

  emptyWrap: { alignItems: "center", paddingHorizontal: 24 },
  emptyImgWrap: {
    width: 140,
    height: 140,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyImg: { width: "100%", height: "100%", opacity: 0.35 },
  emptyIconBadge: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontFamily: fonts.displaySemi,
    fontSize: 20,
    color: colors.onSurface,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    marginTop: 6,
  },
  retryBtn: {
    backgroundColor: colors.brandPrimary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.onBrandPrimary,
  },
}));
