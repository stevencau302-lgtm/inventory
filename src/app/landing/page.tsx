'use client'

import Link from 'next/link'
import { Package, BarChart3, ClipboardCheck, Zap, Shield, Smartphone, ArrowRight, Play, CheckCircle2, Star } from 'lucide-react'

function NexaLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  { icon: Package, title: 'Master Produk', desc: 'Kelola produk, SKU, kategori, dan stok awal dalam satu tempat yang rapi.' },
  { icon: BarChart3, title: 'Analisa Real-time', desc: 'Dashboard interaktif dengan grafik tren, dead stock, dan nilai inventory.' },
  { icon: ClipboardCheck, title: 'Stok Opname', desc: 'Proses stock opname digital — bandingkan stok sistem vs fisik secara instan.' },
  { icon: Zap, title: 'Transaksi Cepat', desc: 'Catat barang masuk/keluar dengan barcode scanner dan bulk entry.' },
  { icon: Shield, title: 'Retur Terlacak', desc: 'Catat retur dengan alasan, kondisi barang, dan analisis kerugian lengkap.' },
  { icon: Smartphone, title: 'Mobile Ready', desc: 'PWA responsif yang bisa diakses dari HP, tablet, atau desktop kapan saja.' },
]

const testimonials = [
  { name: 'Andi S.', role: 'Pemilik Toko Elektronik', text: 'Akhirnya nemu app inventory yang simpel tapi powerful. Stok opname jadi 10x lebih cepat.' },
  { name: 'Rina W.', role: 'Manager Gudang', text: 'Dashboard-nya bikin aku langsung tahu produk mana yang harus restock. Game changer!' },
  { name: 'Bayu P.', role: 'UMKM F&B', text: 'Fitur retur dan laporan stok sangat membantu tracking barang yang sering bermasalah.' },
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
          <div className="flex items-center gap-3">
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
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-4 sm:px-6">
        {/* BG glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#FF5F03]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs font-medium text-zinc-400 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Gratis untuk UMKM & bisnis kecil
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
            Kelola Inventory<br />
            <span className="bg-gradient-to-r from-[#FF5F03] to-[#FFA726] bg-clip-text text-transparent">Tanpa Ribet</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Platform inventory modern untuk UMKM. Real-time analytics, stok opname digital, laporan otomatis — semua dari browser.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/demo" className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-[#FF5F03] text-white hover:bg-[#FF5F03]/90 transition shadow-xl shadow-[#FF5F03]/25 flex items-center justify-center gap-2">
              <Play className="w-5 h-5" /> Coba Demo Gratis
            </Link>
            <Link href="/register" className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold bg-white/[0.05] border border-white/[0.1] text-white hover:bg-white/[0.08] transition flex items-center justify-center gap-2">
              Daftar Sekarang <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="mt-5 text-[13px] text-zinc-600">Tanpa kartu kredit · Setup 30 detik · Data aman terenkripsi</p>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="border-y border-white/[0.06] py-6 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">500+</p>
            <p className="text-[11px] text-zinc-500 font-medium">Bisnis Aktif</p>
          </div>
          <div className="w-px h-8 bg-white/[0.08] hidden sm:block" />
          <div className="text-center">
            <p className="text-2xl font-bold text-white">50k+</p>
            <p className="text-[11px] text-zinc-500 font-medium">Produk Dikelola</p>
          </div>
          <div className="w-px h-8 bg-white/[0.08] hidden sm:block" />
          <div className="text-center">
            <p className="text-2xl font-bold text-white">99.9%</p>
            <p className="text-[11px] text-zinc-500 font-medium">Uptime</p>
          </div>
          <div className="w-px h-8 bg-white/[0.08] hidden sm:block" />
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-[#FFA726] text-[#FFA726]" />)}
            <span className="text-sm font-bold text-white ml-1.5">4.9</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold">Semua yang kamu butuhkan</h2>
            <p className="mt-3 text-zinc-400 text-lg max-w-xl mx-auto">Fitur lengkap untuk mengelola inventory dari mana saja.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Testimonials */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">Dipercaya Ratusan Bisnis</h2>
            <p className="mt-3 text-zinc-400">Kata mereka tentang Nexa Inventory</p>
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

      {/* CTA */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto relative overflow-hidden rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-[#FF5F03] to-[#B45309] text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Siap Kelola Inventory Lebih Baik?</h2>
            <p className="text-white/80 text-base mb-8 max-w-lg mx-auto">Gabung ratusan bisnis yang sudah beralih ke Nexa. Gratis, tanpa kartu kredit.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register" className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-white text-[#B45309] hover:bg-white/90 transition shadow-xl flex items-center justify-center gap-2">
                Mulai Gratis <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/demo" className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/20 transition flex items-center justify-center gap-2">
                <Play className="w-4 h-4" /> Lihat Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <NexaLogo />
            <span className="text-sm font-bold text-white">Nexa Inventory</span>
          </div>
          <p className="text-[12px] text-zinc-600">&copy; 2024 Nexa Inventory. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
