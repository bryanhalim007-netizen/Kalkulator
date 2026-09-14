# BikePOS — Product Requirements Document

## Original Problem Statement
Aplikasi Kasir (POS) untuk toko sepeda dengan kalkulator berkode huruf untuk
menghitung harga modal, lalu harga jual (modal + margin), dengan tampilan harga
ke pembeli dan form penjualan yang tersimpan ke riwayat. Login PIN. Tema Merah & Hitam.

### Coded price rules
- Huruf → angka: P=0, Y=1, F=2, V=3, H=4, K=5, T=6, B=7, R=8, Q=9
- Z = menggandakan digit sebelumnya (QZ=99, YZ=11)
- Harga = string digit di-pad kanan dengan nol hingga 7 digit
  - YP=1.000.000, YF=1.200.000, YVK=1.350.000

## Architecture
- Frontend: Expo Router (stack), React Native, react-query, keyboard-controller, phosphor icons.
- Backend: FastAPI + MongoDB (motor). Routes prefixed `/api`.
- Theme: dark-first red & black in `src/theme.ts`; fonts Rajdhani (display) + IBM Plex Sans (body) via expo-font.

## User Persona
- Pemilik/kasir toko sepeda. Butuh menghitung harga modal secara rahasia (kode huruf),
  menetapkan margin, menunjukkan harga akhir ke pembeli, dan mencatat penjualan.

## Core Requirements (static)
1. PIN lock (8193) → Home.
2. Kalkulator huruf (tanpa angka) menghasilkan Harga Modal.
3. Check Harga Jual → input margin → Harga Jual = Modal + Margin.
4. View Harga Ke Pembeli (hanya angka, full-screen).
5. Barang Terjual → Form Penjualan (semua kolom opsional) → simpan.
6. Riwayat Penjualan (list + hapus/soft-delete).

## Implemented (2026-06)
- [x] PIN lock screen with bike-gear bg, shake on error (2026-06)
- [x] Coded calculator with letter keypad + digit hints, Z double logic (2026-06)
- [x] Harga Modal readout; Check Harga Jual step (2026-06)
- [x] Margin input bar + quick chips (+100rb/+250rb/+500rb/+1jt); live Harga Jual (2026-06)
- [x] View Harga Ke Pembeli full-screen price-only screen (2026-06)
- [x] Sales Form (Barang Terjual), all optional, prefilled from calculator (2026-06)
- [x] Riwayat Penjualan list + empty state + delete (soft) (2026-06)
- [x] Backend Sales CRUD (POST/GET/GET id/DELETE soft) (2026-06)
- [x] Full E2E testing passed 100% (backend 9/9, frontend 13 steps) (2026-06)

## Backlog (prioritized)
- P1: Ringkasan penjualan (total omzet & margin per hari/bulan).
- P1: Cari & filter riwayat (nama pembeli/barang/tanggal).
- P2: Ekspor/bagikan struk penjualan.
- P2: Ganti/atur PIN dari dalam aplikasi.
- P2: Detail penjualan (tap kartu riwayat) + edit.

## Next Tasks
- Add sales summary dashboard.
- Add search/filter on history.
