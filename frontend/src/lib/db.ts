import * as FileSystem from "expo-file-system/legacy";
import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

import { Sale, SaleCreate } from "./api";

// ---------------------------------------------------------------------------
// UUID sederhana (offline, tanpa dependency tambahan).
// ---------------------------------------------------------------------------
function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function nowIso(): string {
  return new Date().toISOString();
}

const isWeb = Platform.OS === "web";

// ---------------------------------------------------------------------------
// Fallback penyimpanan untuk Web preview (expo-sqlite web perlu setup wasm).
// Native pakai SQLite; Web pakai localStorage sederhana.
// ---------------------------------------------------------------------------
const WEB_KEY = "skbike_sales";

function webReadAll(): Sale[] {
  try {
    const raw = globalThis.localStorage?.getItem(WEB_KEY);
    return raw ? (JSON.parse(raw) as Sale[]) : [];
  } catch {
    return [];
  }
}

function webWriteAll(list: Sale[]): void {
  try {
    globalThis.localStorage?.setItem(WEB_KEY, JSON.stringify(list));
  } catch {}
}

function payloadToSale(id: string, createdAt: string, p: SaleCreate): Sale {
  const paths =
    p.foto_paths && p.foto_paths.length
      ? p.foto_paths
      : p.foto_path
        ? [p.foto_path]
        : null;
  return {
    id,
    tanggal_penjualan: p.tanggal_penjualan ?? null,
    nama_pembeli: p.nama_pembeli ?? null,
    nama_barang: p.nama_barang ?? null,
    kode_barang: p.kode_barang ?? null,
    ukuran_warna: p.ukuran_warna ?? null,
    kode_huruf: p.kode_huruf ?? null,
    harga_modal: p.harga_modal ?? null,
    harga_jual: p.harga_jual ?? null,
    margin: p.margin ?? null,
    metode_pembayaran: p.metode_pembayaran ?? null,
    sudah_diambil: p.sudah_diambil ?? null,
    metode_pengambilan: p.metode_pengambilan ?? null,
    alamat_pengiriman: p.alamat_pengiriman ?? null,
    foto_path: paths ? paths[0] : null,
    foto_paths: paths,
    created_at: createdAt,
  };
}

// ---------------------------------------------------------------------------
// SQLite (satu koneksi, inisialisasi sekali).
// ---------------------------------------------------------------------------
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync("skbike.db");
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS sales (
          id TEXT PRIMARY KEY NOT NULL,
          tanggal_penjualan TEXT,
          nama_pembeli TEXT,
          nama_barang TEXT,
          kode_barang TEXT,
          ukuran_warna TEXT,
          kode_huruf TEXT,
          harga_modal REAL,
          harga_jual REAL,
          margin REAL,
          metode_pembayaran TEXT,
          sudah_diambil TEXT,
          metode_pengambilan TEXT,
          alamat_pengiriman TEXT,
          foto_paths TEXT,
          created_at TEXT NOT NULL
        );
      `);
      return db;
    })();
  }
  return dbPromise;
}

type Row = Record<string, any>;

function rowToSale(row: Row): Sale {
  let fotoPaths: string[] | null = null;
  if (row.foto_paths) {
    try {
      const parsed = JSON.parse(row.foto_paths);
      if (Array.isArray(parsed) && parsed.length) fotoPaths = parsed;
    } catch {}
  }
  return {
    id: row.id,
    tanggal_penjualan: row.tanggal_penjualan ?? null,
    nama_pembeli: row.nama_pembeli ?? null,
    nama_barang: row.nama_barang ?? null,
    kode_barang: row.kode_barang ?? null,
    ukuran_warna: row.ukuran_warna ?? null,
    kode_huruf: row.kode_huruf ?? null,
    harga_modal: row.harga_modal ?? null,
    harga_jual: row.harga_jual ?? null,
    margin: row.margin ?? null,
    metode_pembayaran: row.metode_pembayaran ?? null,
    sudah_diambil: row.sudah_diambil ?? null,
    metode_pengambilan: row.metode_pengambilan ?? null,
    alamat_pengiriman: row.alamat_pengiriman ?? null,
    foto_path: fotoPaths ? fotoPaths[0] : null,
    foto_paths: fotoPaths,
    created_at: row.created_at,
  };
}

function payloadValues(id: string, createdAt: string, p: SaleCreate): any[] {
  const paths =
    p.foto_paths && p.foto_paths.length
      ? p.foto_paths
      : p.foto_path
        ? [p.foto_path]
        : null;
  return [
    id,
    p.tanggal_penjualan ?? null,
    p.nama_pembeli ?? null,
    p.nama_barang ?? null,
    p.kode_barang ?? null,
    p.ukuran_warna ?? null,
    p.kode_huruf ?? null,
    p.harga_modal ?? null,
    p.harga_jual ?? null,
    p.margin ?? null,
    p.metode_pembayaran ?? null,
    p.sudah_diambil ?? null,
    p.metode_pengambilan ?? null,
    p.alamat_pengiriman ?? null,
    paths ? JSON.stringify(paths) : null,
    createdAt,
  ];
}

const COLUMNS =
  "id, tanggal_penjualan, nama_pembeli, nama_barang, kode_barang, ukuran_warna, kode_huruf, harga_modal, harga_jual, margin, metode_pembayaran, sudah_diambil, metode_pengambilan, alamat_pengiriman, foto_paths, created_at";

export async function listSales(): Promise<Sale[]> {
  if (isWeb) {
    return webReadAll().sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(
    "SELECT * FROM sales ORDER BY created_at DESC",
  );
  return rows.map(rowToSale);
}

export async function getSale(id: string): Promise<Sale> {
  if (isWeb) {
    const found = webReadAll().find((s) => s.id === id);
    if (!found) throw new Error("Penjualan tidak ditemukan");
    return found;
  }
  const db = await getDb();
  const row = await db.getFirstAsync<Row>("SELECT * FROM sales WHERE id = ?", [id]);
  if (!row) throw new Error("Penjualan tidak ditemukan");
  return rowToSale(row);
}

export async function createSale(payload: SaleCreate): Promise<Sale> {
  const id = uuid();
  const createdAt = nowIso();
  if (isWeb) {
    const sale = payloadToSale(id, createdAt, payload);
    webWriteAll([sale, ...webReadAll()]);
    return sale;
  }
  const db = await getDb();
  const placeholders = new Array(16).fill("?").join(", ");
  await db.runAsync(
    `INSERT INTO sales (${COLUMNS}) VALUES (${placeholders})`,
    payloadValues(id, createdAt, payload),
  );
  return getSale(id);
}

export async function updateSale(id: string, payload: SaleCreate): Promise<Sale> {
  if (isWeb) {
    const list = webReadAll();
    const idx = list.findIndex((s) => s.id === id);
    if (idx < 0) throw new Error("Penjualan tidak ditemukan");
    const updated = payloadToSale(id, list[idx].created_at, payload);
    list[idx] = updated;
    webWriteAll(list);
    return updated;
  }
  const db = await getDb();
  const existing = await db.getFirstAsync<Row>(
    "SELECT created_at FROM sales WHERE id = ?",
    [id],
  );
  if (!existing) throw new Error("Penjualan tidak ditemukan");
  const values = payloadValues(id, existing.created_at, payload);
  // Same column order as COLUMNS; skip id (index 0) and created_at (last).
  await db.runAsync(
    `UPDATE sales SET
       tanggal_penjualan = ?, nama_pembeli = ?, nama_barang = ?, kode_barang = ?,
       ukuran_warna = ?, kode_huruf = ?, harga_modal = ?, harga_jual = ?, margin = ?,
       metode_pembayaran = ?, sudah_diambil = ?, metode_pengambilan = ?,
       alamat_pengiriman = ?, foto_paths = ?
     WHERE id = ?`,
    [...values.slice(1, 15), id],
  );
  return getSale(id);
}

export async function deleteSale(id: string): Promise<void> {
  if (isWeb) {
    webWriteAll(webReadAll().filter((s) => s.id !== id));
    return;
  }
  const db = await getDb();
  await db.runAsync("DELETE FROM sales WHERE id = ?", [id]);
}

// ---------------------------------------------------------------------------
// Foto lokal: salin file terpilih ke folder aplikasi agar permanen.
// ---------------------------------------------------------------------------
export async function savePhotoLocal(uri: string): Promise<string> {
  // Web preview tidak punya filesystem persisten -> pakai uri asli.
  if (Platform.OS === "web" || !FileSystem.documentDirectory) return uri;
  const dir = FileSystem.documentDirectory + "photos/";
  try {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  } catch {}
  const ext = (uri.split(".").pop() || "jpg").split("?")[0].toLowerCase();
  const dest = `${dir}${uuid()}.${ext}`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}
