'use client'

import { useEffect, useState } from 'react'
import { Product, Category, getProducts, getCategories, formatRp, loadSampleData } from '@/lib/store'

export default function ReportsPage() {
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

  const totalItems = products.reduce((s, p) => s + p.stock, 0)
  const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0)
  const avgPrice = products.length ? products.reduce((s, p) => s + p.price, 0) / products.length : 0
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock)
  const outStock = products.filter(p => p.stock === 0)
  const topCategory = categories.map(c => ({
    ...c,
    count: products.filter(p => p.category === c.name).length,
    value: products.filter(p => p.category === c.name).reduce((s, p) => s + p.price * p.stock, 0)
  })).sort((a, b) => b.value - a.value)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Laporan</h1>
        <p className="text-slate-500 text-sm mt-1">Ringkasan inventory kamu</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportStat label="Total Unit" value={totalItems.toLocaleString()} icon={<BoxesIcon />} color="brand" />
        <ReportStat label="Total Nilai" value={formatRp(totalValue)} icon={<MoneyIcon />} color="emerald" />
        <ReportStat label="Rata-rata Harga" value={formatRp(avgPrice)} icon={<ChartIcon />} color="purple" />
        <ReportStat label="Total Kategori" value={categories.length.toString()} icon={<TagIcon />} color="amber" />
      </div>

      {/* Category Breakdown */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h2 className="font-semibold text-white">Nilai Per Kategori</h2>
          <p className="text-xs text-slate-500 mt-1">Distribusi nilai inventory berdasarkan kategori</p>
        </div>
        <div className="p-5 space-y-4">
          {topCategory.map(cat => {
            const pct = totalValue > 0 ? (cat.value / totalValue) * 100 : 0
            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                    <span className="text-sm font-medium text-white">{cat.name}</span>
                    <span className="text-xs text-slate-500">{cat.count} produk</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-white">{formatRp(cat.value)}</span>
                    <span className="text-xs text-slate-500 ml-2">({pct.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pct}%`, background: cat.color }}
                  />
                </div>
              </div>
            )
          })}
          {topCategory.length === 0 && (
            <p className="text-center text-slate-500 py-8">Belum ada data</p>
          )}
        </div>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Low Stock */}
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Stok Rendah</h3>
              <p className="text-xs text-slate-500">{lowStock.length} produk perlu restock</p>
            </div>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {lowStock.slice(0, 5).map(p => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/5 flex items-center justify-center text-amber-400 text-[10px] font-bold">
                    {p.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{p.name}</p>
                    <p className="text-[11px] text-slate-500">{p.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-amber-400">{p.stock}</p>
                  <p className="text-[10px] text-slate-500">min: {p.minStock}</p>
                </div>
              </div>
            ))}
            {lowStock.length === 0 && <p className="px-5 py-6 text-center text-slate-500 text-sm">Semua stok aman</p>}
          </div>
        </div>

        {/* Out of Stock */}
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Stok Habis</h3>
              <p className="text-xs text-slate-500">{outStock.length} produk habis</p>
            </div>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {outStock.slice(0, 5).map(p => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/5 flex items-center justify-center text-red-400 text-[10px] font-bold">
                    {p.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{p.name}</p>
                    <p className="text-[11px] text-slate-500">{p.category}</p>
                  </div>
                </div>
                <span className="badge badge-danger">Habis</span>
              </div>
            ))}
            {outStock.length === 0 && <p className="px-5 py-6 text-center text-slate-500 text-sm">Tidak ada produk habis</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function ReportStat({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
  const colors: Record<string, string> = {
    brand: 'from-brand-500/20 to-brand-600/5 text-brand-400',
    emerald: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400',
    purple: 'from-purple-500/20 to-purple-600/5 text-purple-400',
    amber: 'from-amber-500/20 to-amber-600/5 text-amber-400',
  }
  return (
    <div className="stat-card">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold text-white truncate">{value}</p>
          <p className="text-[11px] text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

function BoxesIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg> }
function MoneyIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg> }
function ChartIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg> }
function TagIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z M6 6h.008v.008H6V6z" /></svg> }
