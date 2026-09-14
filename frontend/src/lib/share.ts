import { Linking } from "react-native";

import { Sale } from "./api";
import { formatJam, formatRupiah, formatTanggal } from "./format";

// WhatsApp tujuan (08125559681 -> format internasional).
export const WA_NUMBER = "628125559681";

export function buildSaleMessage(item: Sale): string {
  const lines: string[] = [];
  const push = (s: string) => lines.push(s);
  const info = (emoji: string, label: string, value?: string | null) => {
    if (value && String(value).trim().length) {
      push(`${emoji} *${label}:* ${value}`);
    }
  };
  const DIV = "━━━━━━━━━━━━━━━━━━";

  push("🚲 *S K B I K E*");
  push("🧾 _Nota Penjualan_");
  push(DIV);

  info(
    "🗓️",
    "Tanggal",
    item.tanggal_penjualan || formatTanggal(item.created_at),
  );
  info("🕒", "Jam", formatJam(item.created_at));

  if (item.nama_pembeli || item.nama_barang || item.kode_barang || item.ukuran_warna) {
    push("");
  }
  info("👤", "Pembeli", item.nama_pembeli);
  info("🚲", "Barang", item.nama_barang);
  info("🔖", "Kode Barang", item.kode_barang);
  info("📐", "Ukuran & Warna", item.ukuran_warna);

  if (
    item.metode_pembayaran ||
    item.metode_pengambilan ||
    item.alamat_pengiriman ||
    item.sudah_diambil
  ) {
    push("");
  }
  info("💳", "Pembayaran", item.metode_pembayaran);
  info("🚚", "Pengambilan", item.metode_pengambilan);
  info("📍", "Alamat", item.alamat_pengiriman);
  if (item.sudah_diambil) {
    const done = item.sudah_diambil === "Sudah";
    push(`${done ? "✅" : "⏳"} *Status:* ${done ? "Sudah diambil" : "Belum diambil"}`);
  }

  // Rincian harga (rata kanan dalam blok monospace).
  const rows: [string, number][] = [];
  if (item.harga_modal != null) rows.push(["Modal", item.harga_modal]);
  if (item.margin != null) rows.push(["Margin", item.margin]);
  const amounts = rows.map(([, v]) => formatRupiah(v));
  const total = formatRupiah(item.harga_jual);
  const width = Math.max(...[...amounts, total].map((a) => a.length));
  const labelW = 7;

  push("");
  push(DIV);
  push("💰 *RINCIAN HARGA*");
  push("```");
  rows.forEach(([label], i) => {
    push(`${label.padEnd(labelW)}${amounts[i].padStart(width)}`);
  });
  push(`${"TOTAL".padEnd(labelW)}${total.padStart(width)}`);
  push("```");
  push(DIV);
  push("");
  push("🙏 _Terima kasih telah berbelanja_");
  push("     _di SKBike!_");

  return lines.join("\n");
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
