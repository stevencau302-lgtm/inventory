import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nexa Inventory — Software Manajemen Stok & Inventory untuk Bisnis',
  description: 'Kelola stok barang masuk & keluar, stok opname, retur, dan analisa inventory dalam satu dashboard. Real-time, ada AI Assistant, dan laporan harian via WhatsApp. Coba gratis 14 hari.',
  keywords: [
    'aplikasi inventory', 'software manajemen stok', 'stok opname digital',
    'manajemen produk', 'barang masuk keluar', 'aplikasi gudang',
    'sistem inventory UMKM', 'restock', 'dead stock', 'laporan stok',
    'manajemen retur', 'inventory AI', 'aplikasi stok barang',
  ],
  authors: [{ name: 'Nexa Inventory' }],
  openGraph: {
    title: 'Nexa Inventory — Kelola Stok Lebih Rapi, Tanpa Excel',
    description: 'Barang masuk, keluar, stok opname, retur — tercatat otomatis dalam satu dashboard. Dipercaya ratusan bisnis di Indonesia. Coba gratis 14 hari.',
    type: 'website',
    locale: 'id_ID',
    siteName: 'Nexa Inventory',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nexa Inventory — Software Manajemen Stok & Inventory',
    description: 'Kelola stok real-time, stok opname digital, AI Assistant, dan laporan WhatsApp harian. Coba gratis 14 hari.',
  },
  robots: { index: true, follow: true },
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
