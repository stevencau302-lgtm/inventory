# Nexo Inventory

Aplikasi manajemen inventory modern dengan dark mode UI, real-time analytics, dan notifikasi WhatsApp otomatis.

Built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, dan **Supabase**.

---

## Fitur

- **Dashboard** — Statistik real-time, chart transaksi, best sellers, stock alerts
- **Master Produk** — CRUD lengkap, search, filter kategori/status, barcode scanner
- **Kategori** — Manajemen kategori dengan icon & color picker
- **Transaksi** — Input stok masuk/keluar, riwayat dengan filter periode
- **Analisa Inventory** — Dead stock, perputaran stok, produk aktif vs stagnan, distribusi nilai per kategori
- **Laporan Stok** — Ringkasan stok dengan status alert
- **Export CSV & PDF** — Download laporan lengkap dengan tampilan profesional
- **Date Range Picker** — Filter data 7 hari, 30 hari, 3 bulan, 6 bulan, 1 tahun, atau custom
- **Notifikasi WhatsApp** — Laporan harian otomatis via Fonnte (cron job)
- **Barcode Scanner** — Scan SKU langsung dari kamera HP
- **CSV Import** — Bulk import produk dari file CSV
- **Responsive** — Mobile-first, desktop sidebar + mobile bottom nav
- **Dark Mode** — Full dark theme modern

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Charts | Recharts |
| PDF | jsPDF + jspdf-autotable |
| WhatsApp | Fonnte API |
| Barcode | html5-qrcode |
| Deploy | Vercel |

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-username/inventory.git
cd inventory
npm install
```

### 2. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka **SQL Editor**
3. Copy-paste isi file `supabase-schema.sql` dan jalankan
4. Copy **Project URL** dan **Anon Key** dari Settings → API

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 4. Run Development

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

### 5. Deploy ke Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push repo ke GitHub
2. Import di Vercel
3. Set environment variables di Vercel Dashboard
4. Deploy

---

## Notifikasi WhatsApp (Opsional)

Fitur laporan harian otomatis via WhatsApp menggunakan [Fonnte](https://fonnte.com).

### Setup:

1. Daftar di fonnte.com, hubungkan device WhatsApp
2. Buka app → **Settings** → section **Notifikasi WhatsApp**
3. Isi Token Fonnte, Nomor Personal, dan/atau ID Grup
4. Klik **Simpan** → **Test Kirim**

### Cron Job (Vercel):

Laporan dikirim otomatis setiap hari sesuai jadwal di `vercel.json`:
```json
{
  "crons": [{ "path": "/api/daily-report", "schedule": "0 13 * * *" }]
}
```
`0 13 * * *` = Jam 20:00 WIB setiap hari.

---

## Struktur Project

```
src/
├── app/
│   ├── api/
│   │   ├── daily-report/     # Cron endpoint + test
│   │   └── settings/         # Save/load app config
│   ├── categories/           # Halaman kategori
│   ├── products/             # Halaman produk + form tambah
│   ├── transactions/         # Halaman transaksi + form
│   ├── reports/              # Halaman analisa inventory
│   ├── laporan-stok/         # Halaman laporan stok
│   ├── settings/             # Halaman pengaturan
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Dashboard
├── components/
│   ├── BarcodeScanner.tsx
│   ├── BottomNav.tsx
│   ├── CsvImportModal.tsx
│   ├── DashboardCharts.tsx
│   ├── DeleteModal.tsx
│   ├── PageSkeleton.tsx
│   ├── ProductModal.tsx
│   ├── Sidebar.tsx
│   └── Toast.tsx
├── lib/
│   ├── store.ts              # Data layer (Supabase CRUD)
│   └── supabase.ts           # Supabase client
└── types/
    └── jspdf-autotable.d.ts
```

---

## Database Schema

Jalankan `supabase-schema.sql` untuk membuat semua tabel:

- **products** — Master produk (nama, SKU, kategori, stok, harga, min_stock)
- **categories** — Kategori produk (nama, icon, warna)
- **transactions** — Log transaksi masuk/keluar
- **settings** — Key-value store untuk konfigurasi app

---

## Environment Variables

| Variable | Required | Keterangan |
|----------|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Ya | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Ya | Anon/public key Supabase |
| `FONNTE_TOKEN` | Tidak | Token API Fonnte (untuk WA) |
| `FONNTE_TARGET_NUMBER` | Tidak | Nomor WA target (fallback) |
| `CRON_SECRET` | Tidak | Secret untuk proteksi cron endpoint |

---

## License

MIT License. Bebas digunakan untuk keperluan komersial.
