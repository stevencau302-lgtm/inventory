'use client'

import Link from 'next/link'
import {
  Package, BarChart3, ClipboardCheck, ArrowRight, Play, Star, Sparkles,
  RefreshCw, ScanBarcode, Undo2, MessageCircle, Check, X, Cloud, Zap,
  TrendingUp, AlertCircle,
} from 'lucide-react'

function NexaLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="36" height="36" rx="10" fill="url(#lp-grad)" />
      <path d="M10 13.5L18 9L26 13.5V22.5L18 27L10 22.5V13.5Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
      <circle cx="18" cy="18" r="3" fill="white" opacity="0.9" />
      <defs>
        <linearGradient id="lp-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF5F03" />
          <stop offset="1" stopColor="#FF8A3D" />
        </linearGradient>
      </defs>
    </svg>
  )
}

const features = [
  { icon: Package, emoji: '📦', title: 'Manajemen Produk', desc: 'Simpan semua data produk — SKU, kategori, harga, dan stok — dalam satu tempat yang terorganisir.' },
  { icon: RefreshCw, emoji: '🔄', title: 'Transaksi Barang Masuk & Keluar', desc: 'Catat setiap mutasi stok dengan cepat. Riwayat lengkap, tidak ada yang terlewat.' },
  { icon: ScanBarcode, emoji: '📱', title: 'Barcode Scanner', desc: 'Input stok lebih cepat pakai scanner atau kamera HP. Tidak perlu ketik manual satu per satu.' },
  { icon: ClipboardCheck, emoji: '📋', title: 'Stok Opname Digital', desc: 'Bandingkan stok fisik dengan data sistem, temukan selisih, dan selesaikan lebih cepat dari sebelumnya.' },
  { icon: Undo2, emoji: '↩️', title: 'Manajemen Retur', desc: 'Setiap retur tercatat — termasuk alasan pengembalian dan kondisi barang. Tidak ada yang jatuh di celah.' },
  { icon: BarChart3, emoji: '📊', title: 'Analisa Inventory', desc: 'Lihat produk terlaris, produk stagnan, dan turnover stok dalam laporan yang mudah dibaca.' },
  { icon: Sparkles, emoji: '🤖', title: 'AI Inventory Assistant', desc: 'Tanya kondisi stok dalam bahasa sehari-hari. AI bantu analisa dan kasih rekomendasi berdasarkan data nyata bisnismu.' },
  { icon: MessageCircle, emoji: '📲', title: 'Laporan Harian via WhatsApp', desc: 'Setiap hari kamu terima ringkasan otomatis — barang masuk, keluar, dan stok menipis — langsung ke WhatsApp.' },
]

const problems = [
  'Stok di sistem tidak cocok dengan stok fisik di gudang',
  'Produk tiba-tiba habis padahal lagi ramai pembeli',
  'Masih catat keluar-masuk barang di Excel atau buku manual',
  'Tidak tahu produk mana yang paling cepat habis',
  'Bingung kapan waktu yang tepat untuk restock',
  'Retur dari pelanggan tidak ada catatannya sama sekali',
]

const benefits = [
  'Stok lebih akurat, selisih pencatatan berkurang drastis',
  'Proses stok opname jauh lebih cepat dan tidak melelahkan',
  'Tahu produk mana yang perlu direstock sebelum kehabisan',
  'Bisa dipantau dari laptop maupun HP kapan saja',
  'Data tersimpan aman di cloud, tidak takut hilang',
  'Tim bisa langsung pakai — tidak perlu training panjang',
]

const aiQuestions = [
  'Produk apa yang paling sering keluar bulan ini?',
  'Mana produk yang perlu segera direstock minggu ini?',
  'Apa penyebab retur paling banyak di bulan lalu?',
  'Produk mana yang sudah jadi dead stock lebih dari 30 hari?',
]

const plans = [
  {
    name: 'Starter', dot: 'bg-emerald-400', price: 'Rp 149.000', popular: false,
    tagline: 'Cocok untuk toko kecil atau bisnis yang baru mulai digitalisasi stok.',
    features: ['Hingga 500 produk', '2 pengguna', 'Barang masuk & keluar', 'Laporan dasar', 'Support via email'],
    cta: 'Mulai Sekarang', href: '/register',
  },
  {
    name: 'Pro', dot: 'bg-[#FF5F03]', price: 'Rp 349.000', popular: true,
    tagline: 'Untuk bisnis yang sudah aktif dan butuh kontrol lebih penuh atas inventory-nya.',
    features: ['Produk tidak terbatas', 'Hingga 10 pengguna', 'Semua fitur Starter', 'Stok opname digital', 'Manajemen retur', 'Laporan WhatsApp harian', 'AI Inventory Assistant', 'Support prioritas'],
    cta: 'Mulai Sekarang', href: '/register',
  },
  {
    name: 'Business', dot: 'bg-purple-400', price: 'Rp 749.000', popular: false,
    tagline: 'Untuk tim besar, gudang multi-lokasi, atau bisnis dengan volume transaksi tinggi.',
    features: ['Semua fitur Pro', 'Multi-gudang / multi-lokasi', 'Pengguna tidak terbatas', 'Integrasi API', 'Laporan custom', 'Onboarding & training tim', 'Dedicated account manager'],
    cta: 'Hubungi Sales', href: '/register',
  },
]

const testimonials = [
  { name: 'Rudi', role: 'Owner Toko Online, Surabaya', text: 'Dulu tiap minggu harus rekap manual. Sekarang tinggal buka dashboard, semua sudah ada.' },
  { name: 'Hendra', role: 'Distributor Sparepart Motor', text: 'Stok opname yang biasanya makan 2 hari sekarang beres dalam beberapa jam.' },
  { name: 'Ibu Sari', role: 'Pemilik Toko Bangunan, Bandung', text: 'Laporan WhatsApp tiap pagi bantu saya pantau gudang meski lagi di luar kota.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/[0.06] bg-[#0a0a0c]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <NexaLogo />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white leading-tight">Nexa</span>
              <span className="text-[8px] text-white/40 font-medium uppercase tracking-widest">Inventory</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <a href="#harga" className="hidden sm:inline-flex px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition">Harga</a>
            <Link href="/demo" className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition">
              <Play className="w-3.5 h-3.5" /> Demo
            </Link>
            <Link href="/login" className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#FF5F03] text-white hover:bg-[#FF5F03]/90 transition shadow-lg shadow-[#FF5F03]/20">
              Masuk
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative pt-28 pb-16 sm:pt-40 sm:pb-24 px-4 sm:px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] max-w-full h-[500px] bg-[#FF5F03]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs font-medium text-zinc-400 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Dipercaya ratusan bisnis di Indonesia
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">
            Kelola Stok Lebih Rapi.<br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-[#FF5F03] to-[#FFA726] bg-clip-text text-transparent">Tanpa Excel. Tanpa Drama.</span>
          </h1>
          <p className="mt-5 sm:mt-6 text-base sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Barang masuk, barang keluar, stok opname, retur — semuanya tercatat otomatis dalam satu dashboard yang bisa dibuka kapan saja, dari mana saja.
          </p>
          <p className="mt-4 text-sm sm:text-base text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            Nexa Inventory dipakai ratusan bisnis untuk menjaga stok tetap akurat, memangkas waktu cek gudang, dan tahu kondisi inventory tanpa harus tanya-tanya ke karyawan.
          </p>

          {/* Checklist */}
          <div className="mt-7 flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-center gap-x-5 gap-y-2 max-w-2xl mx-auto text-left">
            {['Stok terupdate secara real-time', 'Laporan lengkap barang masuk & keluar', 'AI Assistant untuk analisa & rekomendasi', 'Notifikasi ringkasan harian ke WhatsApp'].map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t}</span>
              </div>
            ))}
          </div>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link href="/register" className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-[#FF5F03] text-white hover:bg-[#FF5F03]/90 transition shadow-xl shadow-[#FF5F03]/25 flex items-center justify-center gap-2">
              Coba Gratis 14 Hari <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/demo" className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold bg-white/[0.05] border border-white/[0.1] text-white hover:bg-white/[0.08] transition flex items-center justify-center gap-2">
              <Play className="w-5 h-5" /> Lihat Demo
            </Link>
          </div>
          <p className="mt-5 text-[13px] text-zinc-600">Tanpa kartu kredit · Setup kurang dari 5 menit · Data aman terenkripsi</p>
        </div>
      </header>

      {/* Social proof */}
      <section className="border-y border-white/[0.06] py-7 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs uppercase tracking-widest text-zinc-600 font-semibold mb-5">Dipercaya Ribuan Bisnis di Indonesia</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { v: '500+', l: 'Bisnis Aktif' },
              { v: '50.000+', l: 'Produk Dikelola' },
              { v: '99.9%', l: 'Uptime' },
              { v: '4.9/5', l: 'Rating Pengguna' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">{s.v}</p>
                <p className="text-[11px] sm:text-xs text-zinc-500 font-medium mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
