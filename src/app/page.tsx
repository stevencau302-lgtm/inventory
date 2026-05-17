'use client'

import { useEffect, useState } from 'react'
import { Product, Category, getProducts, getCategories, formatRp, getStatus, getStatusLabel, loadSampleData } from '@/lib/store'
import Link from 'next/link'

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    let p = getProducts()
    let c = getCategories()
    if (p.length === 0) {
      const data = loadSampleData()
      p = data.products
      c = data.categories
    }
    setProducts(p)
    setCategories(c)
    setMounted(true)
  }, [])

  if (!mounted) return null

  const total = products.length
  const inStock = products.filter(p => p.stock > p.minStock).length
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length
  const outStock = products.filter(p => p.stock === 0).length
  const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0)
  const totalUnits = products.reduce((s, p) => s + p.stock, 0)
  const recent = products.slice(0, 5)
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= p.minStock).slice(0, 4)

  // Category breakdown
  const catBreakdown = categories.map(c => ({
    ...c,
    count: products.filter(p => p.category === c.name).length,
    units: products.filter(p => p.category === c.name).reduce((s, p) => s + p.stock, 0),
  })).sort((a, b) => b.units - a.units).slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden p-6 md:p-8" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #1e1b4b 100%)', boxShadow: '0 20px 60px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 60%)', filter: 'blur(40px)' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 60%)', filter: 'blur(30px)' }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v40H0z\' fill=\'none\'/%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'1\' fill=\'white\'/%3E%3C/svg%3E")' }} />
        </div>
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(99,102,241,0.1))', border: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 0 20px rgba(99,102,241,0.15)' }}>
                  <svg className="w-5 h-5 text-indigo-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white">Selamat Datang!</h1>
                  <p className="text-indigo-200/60 text-xs">Inventory Dashboard</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm md:text-base max-w-md">
                Pantau seluruh inventory kamu dari sini. {lowStock > 0 && <span className="text-amber-300 font-medium">{lowStock} produk perlu restock.</span>}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Link href="/products" className="px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:bg-white/10 transition border border-white/10 backdrop-blur-sm">
                Produk
              </Link>
              <Link href="/transactions" className="px-4 py-2.5 rounded-xl text-white text-sm font-medium transition" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}>
                + Transaksi
              </Link>
            </div>
          </div>
          
          {/* Quick Stats inside banner */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="rounded-xl p-3.5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
              <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)' }} />
              <p className="text-2xl md:text-3xl font-bold text-white">{totalUnits.toLocaleString()}</p>
              <p className="text-slate-400 text-[11px] md:text-xs mt-1 font-medium">Total Unit</p>
            </div>
            <div className="rounded-xl p-3.5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
              <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)' }} />
              <p className="text-2xl md:text-3xl font-bold text-white">{total}</p>
              <p className="text-slate-400 text-[11px] md:text-xs mt-1 font-medium">Jenis Produk</p>
            </div>
            <div className="rounded-xl p-3.5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
              <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)' }} />
              <p className="text-2xl md:text-3xl font-bold text-white">{categories.length}</p>
              <p className="text-slate-400 text-[11px] md:text-xs mt-1 font-medium">Kategori</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Stok Aman */}
        <div className="stat-card group" style={{ borderTop: '2px solid #6366f1' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.05))' }}>
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div className="absolute inset-0 rounded-xl bg-indigo-400/10 opacity-0 group-hover:opacity-100 blur-md transition-opacity" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl md:text-3xl font-bold text-white">{inStock}</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Stok Aman</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="text-[10px] text-slate-500">{total > 0 ? Math.round((inStock/total)*100) : 0}% dari total</span>
          </div>
        </div>

        {/* Stok Rendah */}
        <div className="stat-card group" style={{ borderTop: '2px solid #f59e0b' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))' }}>
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
              <div className="absolute inset-0 rounded-xl bg-amber-400/10 opacity-0 group-hover:opacity-100 blur-md transition-opacity" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl md:text-3xl font-bold text-white">{lowStock}</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Stok Rendah</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] text-slate-500">Perlu perhatian</span>
          </div>
        </div>

        {/* Habis */}
        <div className="stat-card group" style={{ borderTop: '2px solid #ef4444' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.05))' }}>
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
              <div className="absolute inset-0 rounded-xl bg-red-400/10 opacity-0 group-hover:opacity-100 blur-md transition-opacity" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl md:text-3xl font-bold text-white">{outStock}</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Habis</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="text-[10px] text-slate-500">Segera restock</span>
          </div>
        </div>

        {/* Total Nilai */}
        <div className="stat-card group" style={{ borderTop: '2px solid #a855f7' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.05))' }}>
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div className="absolute inset-0 rounded-xl bg-purple-400/10 opacity-0 group-hover:opacity-100 blur-md transition-opacity" />
            </div>
            <div className="min-w-0">
              <p className="text-lg md:text-xl font-bold text-white truncate">{formatRp(totalValue)}</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Total Nilai</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span className="text-[10px] text-slate-500">{totalUnits.toLocaleString()} unit</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Products - takes 2 cols */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="flex items-center justify-between p-4 md:p-5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400" />
              <h2 className="font-semibold text-white text-sm">Aktivitas Produk</h2>
            </div>
            <Link href="/products" className="text-xs text-brand-400 hover:text-brand-300 font-medium transition flex items-center gap-1">
              Lihat Semua
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Produk</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Kategori</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Stok</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Harga</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(p => (
                  <tr key={p.id} className="border-b border-white/[0.03] hover:bg-brand-500/5 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {p.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-white">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">{p.category}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-300 font-medium">{p.stock}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">{formatRp(p.price)}</td>
                    <td className="px-5 py-3.5"><StatusBadge product={p} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-white/5">
            {recent.map(p => (
              <div key={p.id} className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {p.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.category} &middot; Stok: {p.stock}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-white">{formatRp(p.price)}</p>
                  <StatusBadge product={p} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Category Breakdown */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <h3 className="text-sm font-semibold text-white">Stok per Kategori</h3>
            </div>
            <div className="space-y-3">
              {catBreakdown.map(cat => (
                <div key={cat.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${cat.color}20`, color: cat.color }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-white truncate">{cat.name}</p>
                      <p className="text-xs text-slate-400 ml-2">{cat.units}</p>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${totalUnits > 0 ? (cat.units / totalUnits) * 100 : 0}%`, background: cat.color }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Alert */}
          {lowStockProducts.length > 0 && (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <h3 className="text-sm font-semibold text-white">Perlu Restock</h3>
              </div>
              <div className="space-y-2.5">
                {lowStockProducts.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 text-[10px] font-bold shrink-0">
                      {p.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-500">{p.category}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-amber-400">{p.stock}/{p.minStock}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Aksi Cepat</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/transactions" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-4.5L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                </svg>
                <span className="text-[11px] font-medium text-emerald-300">Transaksi</span>
              </Link>
              <Link href="/products" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 hover:bg-brand-500/20 transition">
                <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="text-[11px] font-medium text-brand-300">Produk Baru</span>
              </Link>
              <Link href="/categories" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                </svg>
                <span className="text-[11px] font-medium text-purple-300">Kategori</span>
              </Link>
              <Link href="/reports" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition">
                <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
                <span className="text-[11px] font-medium text-rose-300">Laporan</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ product }: { product: Product }) {
  const status = getStatus(product)
  const label = getStatusLabel(product)
  const classes = status === 'in-stock' ? 'badge-success' : status === 'low-stock' ? 'badge-warning' : 'badge-danger'
  return <span className={`badge ${classes}`}>{label}</span>
}
