import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as db from "./db";

export type Sale = {
  id: string;
  tanggal_penjualan?: string | null;
  nama_pembeli?: string | null;
  nama_barang?: string | null;
  kode_barang?: string | null;
  ukuran_warna?: string | null;
  kode_huruf?: string | null;
  harga_modal?: number | null;
  harga_jual?: number | null;
  margin?: number | null;
  metode_pembayaran?: string | null;
  sudah_diambil?: string | null;
  metode_pengambilan?: string | null;
  alamat_pengiriman?: string | null;
  foto_path?: string | null;
  foto_paths?: string[] | null;
  created_at: string;
  deleted_at?: string | null;
};

export type SaleCreate = Omit<Sale, "id" | "created_at" | "deleted_at">;

export function fileUrl(path?: string | null): string | null {
  // Offline: foto disimpan sebagai URI lokal, kembalikan apa adanya.
  return path ?? null;
}

// Daftar foto sebuah penjualan (dukung data lama `foto_path` tunggal).
export function salePhotos(sale?: Sale | null): string[] {
  if (!sale) return [];
  if (sale.foto_paths && sale.foto_paths.length) return sale.foto_paths;
  if (sale.foto_path) return [sale.foto_path];
  return [];
}

// Simpan foto ke penyimpanan lokal perangkat, kembalikan URI permanen.
export async function saveImage(uri: string): Promise<string> {
  return db.savePhotoLocal(uri);
}

export function useSales() {
  return useQuery({
    queryKey: ["sales"],
    queryFn: () => db.listSales(),
  });
}

export function useSale(id: string | undefined) {
  return useQuery({
    queryKey: ["sale", id],
    queryFn: () => db.getSale(id as string),
    enabled: !!id,
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaleCreate) => db.createSale(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
    },
  });
}

export function useUpdateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SaleCreate }) =>
      db.updateSale(id, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["sale", data.id] });
    },
  });
}

export function useDeleteSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.deleteSale(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
    },
  });
}

