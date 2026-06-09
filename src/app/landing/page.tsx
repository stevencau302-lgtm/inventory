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

      {/* Problem */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">
              <AlertCircle className="w-3.5 h-3.5" /> Masalah yang berulang
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold">Masalah Inventory yang Terus Berulang?</h2>
            <p className="mt-3 text-zinc-400 text-base sm:text-lg">Kalau kamu pernah mengalami salah satu dari ini, kamu tidak sendirian:</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {problems.map((p, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl p-4 bg-white/[0.02] border border-white/[0.06]">
                <span className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <X className="w-3.5 h-3.5 text-red-400" />
                </span>
                <p className="text-sm text-zinc-300 leading-relaxed">{p}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Masalah-masalah kecil ini kalau dibiarkan bisa berujung kerugian yang tidak sedikit — mulai dari stok mati, kehilangan penjualan, sampai selisih yang susah dipertanggungjawabkan. <span className="text-white font-semibold">Nexa Inventory hadir untuk menutup celah itu.</span>
          </p>
        </div>
      </section>

      {/* Solution */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl font-bold">Satu Dashboard. Semua Informasi Inventory.</h2>
          <p className="mt-3 text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto">
            Tidak perlu lagi buka banyak file atau rekap manual tiap pagi. Cukup buka Nexa, semua sudah ada — nilai inventory, stok menipis, produk terlaris, dan pergerakan stok hari ini.
          </p>

          {/* Dashboard mockup */}
          <div className="relative mt-12 max-w-4xl mx-auto">
            <div className="relative rounded-xl overflow-hidden border border-white/[0.1] shadow-2xl shadow-black/50 bg-[#1a1a1a] text-left">
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-white/[0.06]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 mx-2 sm:mx-4">
                  <div className="max-w-[180px] sm:max-w-xs mx-auto px-2 sm:px-3 py-1 rounded-md bg-white/[0.05] border border-white/[0.08] text-[10px] sm:text-[11px] text-zinc-500 text-center truncate">
                    nexo-inventory.vercel.app
                  </div>
                </div>
              </div>
              <div className="p-3 sm:p-5 space-y-3 sm:space-y-4 bg-gradient-to-br from-[#111] to-[#0d0d0d]">
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  <div className="col-span-4 sm:col-span-2 sm:row-span-2 rounded-xl p-4 sm:p-5 bg-gradient-to-br from-[#0F4C4C] to-[#072C2C]">
                    <p className="text-[10px] sm:text-xs text-white/50 mb-1">Total Nilai Inventory</p>
                    <p className="text-lg sm:text-2xl font-bold">Rp 474.400</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-emerald-400/20 text-emerald-300">+Rp 73.600</span>
                      <span className="text-[9px] text-white/40">30 hari</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2">
                      <div><p className="text-[9px] text-white/40">Produk Aktif</p><p className="text-sm font-bold">2/2</p></div>
                      <div><p className="text-[9px] text-white/40">Kategori</p><p className="text-sm font-bold">Home</p></div>
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1 rounded-xl p-3 bg-white/[0.03] border border-white/[0.06]"><p className="text-[9px] text-zinc-500">Total Unit</p><p className="text-base sm:text-lg font-bold mt-1">11</p><p className="text-[9px] text-emerald-400 mt-0.5">semua stok aman</p></div>
                  <div className="col-span-2 sm:col-span-1 rounded-xl p-3 bg-white/[0.03] border border-white/[0.06]"><p className="text-[9px] text-zinc-500">Kategori</p><p className="text-base sm:text-lg font-bold mt-1">7</p><p className="text-[9px] text-zinc-500 mt-0.5">terbesar: Home</p></div>
                  <div className="col-span-2 sm:col-span-1 rounded-xl p-3 bg-white/[0.03] border border-white/[0.06]"><p className="text-[9px] text-zinc-500">Dead Stock</p><p className="text-base sm:text-lg font-bold mt-1">0</p><p className="text-[9px] text-emerald-400 mt-0.5">tidak ada 🎉</p></div>
                  <div className="col-span-2 sm:col-span-1 rounded-xl p-3 bg-white/[0.03] border border-white/[0.06]"><p className="text-[9px] text-zinc-500">Rata-rata Harga</p><p className="text-base sm:text-lg font-bold mt-1">Rp 52.650</p><p className="text-[9px] text-zinc-500 mt-0.5">Rp 31.700 – Rp 73.600</p></div>
                </div>
                <div className="rounded-xl p-3 sm:p-4 bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] sm:text-xs font-medium text-zinc-400">Pergerakan Stok</p>
                    <div className="flex gap-2">
                      <span className="flex items-center gap-1 text-[9px] text-zinc-500"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Masuk</span>
                      <span className="flex items-center gap-1 text-[9px] text-zinc-500"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5F03]" />Keluar</span>
                    </div>
                  </div>
                  <div className="flex items-end gap-1 sm:gap-2 h-16 sm:h-24">
                    {[40, 65, 30, 80, 55, 70, 45].map((h, i) => (
                      <div key={i} className="flex-1 flex gap-0.5">
                        <div className="flex-1 rounded-t bg-emerald-400/60" style={{ height: `${h}%` }} />
                        <div className="flex-1 rounded-t bg-[#FF5F03]/60" style={{ height: `${h * 0.6}%` }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-[#FF5F03]/15 rounded-full blur-3xl pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-14">
            <h2 className="text-2xl sm:text-4xl font-bold">Fitur yang Memang Dibutuhkan Bisnis Nyata</h2>
            <p className="mt-3 text-zinc-400 text-base sm:text-lg max-w-xl mx-auto">Bukan sekadar fitur banyak — ini yang benar-benar kepakai sehari-hari.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div key={i} className="group rounded-2xl p-6 bg-white/[0.02] border border-white/[0.06] hover:border-[#FF5F03]/30 hover:bg-[#FF5F03]/[0.03] transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-[#FF5F03]/10 flex items-center justify-center mb-4 group-hover:bg-[#FF5F03]/20 transition">
                  <f.icon className="w-5 h-5 text-[#FF5F03]" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold">Kenapa Bisnis Pilih Nexa Inventory?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl p-4 bg-white/[0.02] border border-white/[0.06]">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                </span>
                <p className="text-sm text-zinc-300 leading-relaxed">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF5F03] uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5" /> AI Inventory Assistant
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold leading-tight">Tanya AI, Dapat Jawaban Berbasis Data Stokmu</h2>
              <p className="mt-4 text-zinc-400 text-base leading-relaxed">
                Tidak perlu analisa manual. Cukup tanya ke AI Assistant Nexa, dan kamu langsung dapat insight yang actionable.
              </p>
              <p className="mt-4 text-sm text-zinc-500 leading-relaxed">
                AI-nya tidak hanya menampilkan data — dia bantu kamu memahami apa artinya dan apa yang perlu dilakukan.
              </p>
            </div>
            <div className="space-y-3">
              {aiQuestions.map((q, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl p-4 bg-white/[0.03] border border-white/[0.06] hover:border-[#FF5F03]/30 transition">
                  <span className="w-8 h-8 rounded-lg bg-[#FF5F03]/10 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4 text-[#FF5F03]" />
                  </span>
                  <p className="text-sm text-zinc-300">"{q}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="harga" className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold">Harga Transparan. Tidak Ada Biaya Tersembunyi.</h2>
            <p className="mt-3 text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto">
              Pilih paket yang sesuai skala bisnismu. Semua paket sudah termasuk akses penuh fitur inti inventory.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-6 sm:p-7 flex flex-col h-full transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-b from-[#FF5F03]/[0.08] to-white/[0.02] border-2 border-[#FF5F03]/50 lg:scale-[1.03] shadow-xl shadow-[#FF5F03]/10'
                    : 'bg-white/[0.02] border border-white/[0.08]'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-bold bg-[#FF5F03] text-white shadow-lg shadow-[#FF5F03]/30 whitespace-nowrap">
                    ⭐ Paling Populer
                  </span>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${plan.dot}`} />
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                </div>
                <div className="mt-3 mb-1">
                  <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-sm text-zinc-500"> / tahun</span>
                </div>
                <p className="text-[13px] text-zinc-500 leading-relaxed mb-5 min-h-[40px]">{plan.tagline}</p>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-zinc-300">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`w-full py-3.5 rounded-xl text-sm font-bold text-center transition active:scale-[0.98] ${
                    plan.popular
                      ? 'bg-[#FF5F03] text-white hover:bg-[#FF5F03]/90 shadow-lg shadow-[#FF5F03]/25'
                      : 'bg-white/[0.06] border border-white/[0.1] text-white hover:bg-white/[0.1]'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-zinc-500">
            Semua paket tersedia <span className="text-white font-medium">uji coba gratis 14 hari</span>. Tidak perlu kartu kredit.
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold">Kata Mereka yang Sudah Pakai</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <div key={i} className="rounded-2xl p-5 bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-[#FFA726] text-[#FFA726]" />)}
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-[11px] text-zinc-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto relative overflow-hidden rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-[#FF5F03] to-[#B45309] text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Coba Dulu, Bayar Kalau Cocok.</h2>
            <p className="text-white/85 text-base mb-2 max-w-lg mx-auto leading-relaxed">
              14 hari gratis, semua fitur bisa diakses penuh. Tidak perlu instalasi, tidak perlu kartu kredit — langsung pakai dari browser.
            </p>
            <p className="text-white/70 text-sm mb-8">Ribuan bisnis sudah beralih dari Excel ke Nexa. Saatnya giliranmu.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register" className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-white text-[#B45309] hover:bg-white/90 transition shadow-xl flex items-center justify-center gap-2">
                Mulai Uji Coba Gratis <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/demo" className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/20 transition flex items-center justify-center gap-2">
                <Play className="w-4 h-4" /> Lihat Demo
              </Link>
            </div>
            <p className="mt-5 text-[13px] text-white/60">Setup kurang dari 5 menit. Bisa langsung input produk hari ini.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <NexaLogo />
              <span className="text-sm font-bold text-white">Nexa Inventory</span>
            </div>
            <div className="flex items-center gap-5 text-sm text-zinc-500">
              <a href="#fitur" className="hover:text-white transition">Fitur</a>
              <a href="#harga" className="hover:text-white transition">Harga</a>
              <Link href="/demo" className="hover:text-white transition">Demo</Link>
              <Link href="/login" className="hover:text-white transition">Masuk</Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[12px] text-zinc-600">&copy; {new Date().getFullYear()} Nexa Inventory. Software manajemen stok & inventory untuk bisnis Indonesia.</p>
            <div className="flex items-center gap-3 text-[11px] text-zinc-600">
              <span className="flex items-center gap-1"><Cloud className="w-3 h-3" /> Cloud-based</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Real-time</span>
              <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> AI-powered</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
