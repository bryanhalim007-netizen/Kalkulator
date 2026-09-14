import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Platform } from "react-native";

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
  foto_path?: string | null;
  created_at: string;
  deleted_at?: string | null;
};

export type SaleCreate = Omit<Sale, "id" | "created_at" | "deleted_at">;

export function fileUrl(path?: string | null): string | null {
  if (!path) return null;
  return `${BASE_URL}/api/files/${path}`;
}

export async function uploadImage(uri: string): Promise<string> {
  const name = uri.split("/").pop() || `photo-${Date.now()}.jpg`;
  const ext = (name.split(".").pop() || "jpg").toLowerCase();
  const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  const form = new FormData();
  if (Platform.OS === "web") {
    const blob = await (await fetch(uri)).blob();
    form.append("file", blob, name);
  } else {
    form.append("file", { uri, name, type } as any);
  }
  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    let detail = `Upload gagal (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {}
    throw new Error(detail);
  }
  const data = (await res.json()) as { path: string };
  return data.path;
}

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

export function useSale(id: string | undefined) {
  return useQuery({
    queryKey: ["sale", id],
    queryFn: () => request<Sale>(`/sales/${id}`),
    enabled: !!id,
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

export function useUpdateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SaleCreate }) =>
      request<Sale>(`/sales/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["sale", data.id] });
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
