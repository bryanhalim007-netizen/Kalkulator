// Indonesian Rupiah formatting helpers.

export function formatRupiah(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  const safe = isNaN(n) ? 0 : Math.round(n);
  return "Rp " + safe.toLocaleString("id-ID");
}

// Plain grouped number, no currency prefix (e.g. buyer-facing display).
export function formatNumber(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  const safe = isNaN(n) ? 0 : Math.round(n);
  return safe.toLocaleString("id-ID");
}

// Parse a user-typed string (may contain dots/spaces) into an integer.
export function parseNumberInput(text: string): number {
  const digits = (text || "").replace(/[^0-9]/g, "");
  if (!digits) return 0;
  return parseInt(digits, 10);
}

export function formatTanggal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
