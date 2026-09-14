import { Linking } from "react-native";

import { Sale } from "./api";
import { formatJam, formatRupiah, formatTanggal } from "./format";

// WhatsApp tujuan (08125559681 -> format internasional).
export const WA_NUMBER = "628125559681";

export function buildSaleMessage(item: Sale): string {
  const line = (label: string, value?: string | null) =>
    `${label}: ${value && String(value).length ? value : "-"}`;
  return [
    "*Rincian Penjualan - SKBike*",
    "",
    line(
      "Tanggal Penjualan",
      item.tanggal_penjualan || formatTanggal(item.created_at),
    ),
    line("Jam Transaksi", formatJam(item.created_at)),
    line("Nama Pembeli", item.nama_pembeli),
    line("Nama Barang", item.nama_barang),
    line("Kode Barang", item.kode_barang),
    line("Ukuran & Warna", item.ukuran_warna),
    line("Harga Modal", formatRupiah(item.harga_modal)),
    line("Margin", formatRupiah(item.margin)),
    line("Harga Jual", formatRupiah(item.harga_jual)),
    line("Metode Pembayaran", item.metode_pembayaran),
    line("Sudah Diambil", item.sudah_diambil),
    line("Metode Pengambilan", item.metode_pengambilan),
    line("Alamat Pengiriman", item.alamat_pengiriman),
  ].join("\n");
}

// Official WhatsApp click-to-chat link: works on iOS, Android & web,
// and opens the installed app when available. Returns false on failure.
export async function shareSaleToWhatsApp(item: Sale): Promise<boolean> {
  const text = encodeURIComponent(buildSaleMessage(item));
  const url = `https://wa.me/${WA_NUMBER}?text=${text}`;
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
