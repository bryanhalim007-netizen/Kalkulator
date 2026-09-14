import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

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
  created_at: string;
  deleted_at?: string | null;
};

export type SaleCreate = Omit<Sale, "id" | "created_at" | "deleted_at">;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export function useSales() {
  return useQuery({
    queryKey: ["sales"],
    queryFn: () => request<Sale[]>("/sales"),
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaleCreate) =>
      request<Sale>("/sales", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
    },
  });
}

export function useDeleteSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<{ ok: boolean }>(`/sales/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
    },
  });
}
