import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Bicycle,
  CalendarBlank,
  MagnifyingGlass,
  TrashSimple,
  WhatsappLogo,
  X,
} from "phosphor-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DatePickerModal } from "@/src/components/date-picker-modal";
import { useToast } from "@/src/components/toast";
import { Sale, fileUrl, useDeleteSale, useSales } from "@/src/lib/api";
import { formatJam, formatRupiah, formatTanggal } from "@/src/lib/format";
import { shareSaleToWhatsApp } from "@/src/lib/share";
import { fonts, makeStyles, useTheme } from "@/src/theme";

const EMPTY_IMAGE =
  "https://images.unsplash.com/photo-1595886068978-59624dde48d1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzV8MHwxfHNlYXJjaHwxfHxlbXB0eSUyMGNsaXBib2FyZCUyMGRlc2t8ZW58MHx8fGJsYWNrfDE3ODkzODgyOTB8MA&ixlib=rb-4.1.0&q=85";

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "belum", label: "Belum diambil" },
  { key: "sudah", label: "Sudah diambil" },
];

const DATE_FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "Semua tanggal" },
  { key: "today", label: "Hari ini" },
  { key: "week", label: "Minggu ini" },
  { key: "month", label: "Bulan ini" },
];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function matchDate(sale: Sale, mode: string, custom: Date | null): boolean {
  if (mode === "all") return true;
  const t = new Date(sale.created_at);
  const now = new Date();
  if (mode === "today") return startOfDay(t) === startOfDay(now);
  if (mode === "week") {
    const weekAgo = startOfDay(now) - 6 * 86400000;
    return startOfDay(t) >= weekAgo && startOfDay(t) <= startOfDay(now);
  }
  if (mode === "month")
    return t.getFullYear() === now.getFullYear() && t.getMonth() === now.getMonth();
  if (mode === "custom" && custom) return startOfDay(t) === startOfDay(custom);
  return true;
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { data, isLoading, isError, refetch, isRefetching } = useSales();
  const deleteSale = useDeleteSale();
  const [filter, setFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customDate, setCustomDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [query, setQuery] = useState("");

  const all = data ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((s) => {
      const statusOk =
        filter === "all"
          ? true
          : filter === "sudah"
            ? s.sudah_diambil === "Sudah"
            : s.sudah_diambil !== "Sudah";
      const dateOk = matchDate(s, dateFilter, customDate);
      const searchOk =
        q.length === 0 ||
        (s.nama_pembeli || "").toLowerCase().includes(q) ||
        (s.nama_barang || "").toLowerCase().includes(q) ||
        (s.kode_barang || "").toLowerCase().includes(q);
      return statusOk && dateOk && searchOk;
    });
  }, [all, filter, dateFilter, customDate, query]);
  const totalOmzet = filtered.reduce((sum, s) => sum + (s.harga_jual || 0), 0);

  const onDelete = (sale: Sale) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    deleteSale.mutate(sale.id, {
      onSuccess: () => toast.show("Penjualan dihapus", "success"),
      onError: () => toast.show("Gagal menghapus", "error"),
    });
  };

  const onShare = async (sale: Sale) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const ok = await shareSaleToWhatsApp(sale);
    if (!ok) toast.show("Tidak dapat membuka WhatsApp", "error");
  };

  const renderItem = ({ item }: { item: Sale }) => (
    <Pressable
      testID={`sale-card-${item.id}`}
      onPress={() => router.push(`/sale/${item.id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardTop}>
        {item.foto_path ? (
          <Image
            source={{ uri: fileUrl(item.foto_path)! }}
            style={styles.cardThumb}
            contentFit="cover"
          />
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.nama_barang || "Barang tanpa nama"}
          </Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {[
              item.nama_pembeli,
              item.tanggal_penjualan || formatTanggal(item.created_at),
              formatJam(item.created_at),
            ]
              .filter(Boolean)
              .join(" • ")}
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

      {(item.metode_pembayaran ||
        item.sudah_diambil ||
        item.metode_pengambilan) && (
        <View style={styles.tagRow}>
          {[item.metode_pembayaran, item.metode_pengambilan]
            .filter(Boolean)
            .map((t, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          {item.sudah_diambil && (
            <View
              style={[
                styles.tag,
                item.sudah_diambil === "Sudah" && styles.tagSuccess,
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  item.sudah_diambil === "Sudah" && styles.tagTextSuccess,
                ]}
              >
                {item.sudah_diambil === "Sudah" ? "Sudah diambil" : "Belum diambil"}
              </Text>
            </View>
          )}
        </View>
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
    </Pressable>
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

      <View style={styles.searchWrap}>
        <MagnifyingGlass size={18} color={colors.muted} weight="bold" />
        <TextInput
          testID="search-input"
          value={query}
          onChangeText={setQuery}
          placeholder="Cari pembeli / barang / kode"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable testID="search-clear" onPress={() => setQuery("")} hitSlop={8}>
            <X size={16} color={colors.muted} weight="bold" />
          </Pressable>
        )}
      </View>

      <View style={styles.filterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                testID={`filter-${f.key}`}
                onPress={() => setFilter(f.key)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.dateFilterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {DATE_FILTERS.map((f) => {
            const active = dateFilter === f.key;
            return (
              <Pressable
                key={f.key}
                testID={`date-filter-${f.key}`}
                onPress={() => {
                  setDateFilter(f.key);
                  setCustomDate(null);
                }}
                style={[styles.chipSm, active && styles.chipActive]}
              >
                <Text style={[styles.chipTextSm, active && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            testID="date-filter-custom"
            onPress={() => setShowDatePicker(true)}
            style={[
              styles.chipSm,
              styles.chipDate,
              dateFilter === "custom" && styles.chipActive,
            ]}
          >
            <CalendarBlank
              size={14}
              color={dateFilter === "custom" ? colors.onBrandPrimary : colors.brandPrimary}
              weight="bold"
            />
            <Text
              style={[
                styles.chipTextSm,
                dateFilter === "custom" && styles.chipTextActive,
              ]}
            >
              {dateFilter === "custom" && customDate
                ? customDate.toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                  })
                : "Pilih tanggal"}
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      <DatePickerModal
        visible={showDatePicker}
        value={customDate ?? new Date()}
        onSelect={(d) => {
          setCustomDate(d);
          setDateFilter("custom");
        }}
        onClose={() => setShowDatePicker(false)}
      />

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
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={
            filtered.length > 0 ? (
              <View style={styles.summary} testID="summary-bar">
                <View>
                  <Text style={styles.summaryLabel}>TRANSAKSI</Text>
                  <Text style={styles.summaryValue}>{filtered.length}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryLabel}>TOTAL OMZET</Text>
                  <Text
                    style={styles.summaryOmzet}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {formatRupiah(totalOmzet)}
                  </Text>
                </View>
              </View>
            ) : null
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
            filtered.length === 0 && styles.listEmpty,
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
              <Text style={styles.emptyTitle}>
                {all.length === 0 ? "Belum ada penjualan" : "Tidak ada hasil"}
              </Text>
              <Text style={styles.emptyText}>
                {all.length === 0
                  ? "Penjualan yang kamu simpan akan muncul di sini."
                  : "Tidak ada penjualan pada filter ini."}
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
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 4,
    paddingHorizontal: 14,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.onSurface,
    paddingVertical: 12,
  },
  filterWrap: { height: 56, justifyContent: "center" },
  dateFilterWrap: { height: 44, justifyContent: "center", marginBottom: 2 },
  filterRow: { paddingHorizontal: 20, gap: 10, alignItems: "center" },
  chip: {
    height: 36,
    flexShrink: 0,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSm: {
    height: 30,
    flexShrink: 0,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipDate: { flexDirection: "row", gap: 6 },
  chipActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  chipText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.onSurfaceSecondary,
  },
  chipTextSm: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.onSurfaceSecondary,
  },
  chipTextActive: { color: colors.onBrandPrimary },
  cardThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: colors.surfaceTertiary,
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 4,
  },
  summaryLabel: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.muted,
  },
  summaryValue: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.onSurface,
    marginTop: 2,
  },
  summaryDivider: { width: 1, height: 36, backgroundColor: colors.divider },
  summaryOmzet: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.brandPrimary,
    marginTop: 2,
  },

  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderLeftColor: colors.brandPrimary,
    padding: 16,
  },
  cardPressed: {
    backgroundColor: colors.surfaceTertiary,
    transform: [{ scale: 0.99 }],
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
    fontFamily: fonts.displaySemi,
    fontSize: 18,
    letterSpacing: 0.3,
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
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  tag: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  tagText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.onSurfaceTertiary,
  },
  tagSuccess: { backgroundColor: colors.success },
  tagTextSuccess: { color: colors.onSuccess },
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
