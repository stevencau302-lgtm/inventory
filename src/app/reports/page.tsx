'use client'

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Product, Category, Transaction, getProducts, getCategories, getTransactions, formatRp, loadSampleData } from '@/lib/store'

const RechartsBarChart = dynamic(
  () => import('recharts').then((mod) => {
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = mod
    const Chart = ({ data }: { data: { week: string; masuk: number; keluar: number }[] }) => (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="week" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fafafa' }}
            labelStyle={{ color: '#a1a1aa' }}
          />
          <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: 12 }} />
          <Bar dataKey="masuk" name="Masuk" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="keluar" name="Keluar" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )
    return Chart
  }),
  { ssr: false, loading: () => <div className="h-[260px] flex items-center justify-center text-zinc-500 text-sm">Memuat grafik...</div> }
)

export default function ReportsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
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
    setTransactions(getTransactions())
    setMounted(true)
  }, [])

  // ---- Computed Data ----
  const totalItems = useMemo(() => products.reduce((s, p) => s + p.stock, 0), [products])
  const totalValue = useMemo(() => products.reduce((s, p) => s + p.price * p.stock, 0), [products])
  const avgPrice = useMemo(() => products.length ? products.reduce((s, p) => s + p.price, 0) / products.length : 0, [products])

  // Dead stock: products with 0 'out' transactions
  const deadStock = useMemo(() => {
    const outProductIds = new Set(transactions.filter(t => t.type === 'out').map(t => t.productId))
    return products.filter(p => !outProductIds.has(p.id))
  }, [products, transactions])

  // Perputaran Stok: total out qty / total stock
  const stockTurnover = useMemo(() => {
    const totalOutQty = transactions.filter(t => t.type === 'out').reduce((s, t) => s + t.quantity, 0)
    return totalItems > 0 ? (totalOutQty / totalItems).toFixed(2) : '0'
  }, [transactions, totalItems])

  // Category breakdown
  const topCategory = useMemo(() => categories.map(c => ({
    ...c,
    count: products.filter(p => p.category === c.name).length,
    value: products.filter(p => p.category === c.name).reduce((s, p) => s + p.price * p.stock, 0)
  })).sort((a, b) => b.value - a.value), [categories, products])

  // Transactions last 30 days
  const last30Days = useMemo(() => {
    const now = Date.now()
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
    return transactions.filter(t => new Date(t.createdAt).getTime() >= thirtyDaysAgo)
  }, [transactions])

  const totalMasuk30 = useMemo(() => last30Days.filter(t => t.type === 'in').reduce((s, t) => s + t.quantity, 0), [last30Days])
  const totalKeluar30 = useMemo(() => last30Days.filter(t => t.type === 'out').reduce((s, t) => s + t.quantity, 0), [last30Days])
  const netSelisih = totalMasuk30 - totalKeluar30

  // Weekly chart data (last 4 weeks)
  const weeklyData = useMemo(() => {
    const now = Date.now()
    const weeks: { week: string; masuk: number; keluar: number }[] = []
    for (let i = 3; i >= 0; i--) {
      const weekStart = now - (i + 1) * 7 * 24 * 60 * 60 * 1000
      const weekEnd = now - i * 7 * 24 * 60 * 60 * 1000
      const weekTx = transactions.filter(t => {
        const ts = new Date(t.createdAt).getTime()
        return ts >= weekStart && ts < weekEnd
      })
      weeks.push({
        week: `Minggu ${4 - i}`,
        masuk: weekTx.filter(t => t.type === 'in').reduce((s, t) => s + t.quantity, 0),
        keluar: weekTx.filter(t => t.type === 'out').reduce((s, t) => s + t.quantity, 0),
      })
    }
    return weeks
  }, [transactions])

  // Top 5 active products (most out transactions)
  const topActive = useMemo(() => {
    const outCounts: Record<string, { name: string; category: string; count: number }> = {}
    transactions.filter(t => t.type === 'out').forEach(t => {
      if (!outCounts[t.productId]) outCounts[t.productId] = { name: t.productName, category: '', count: 0 }
      outCounts[t.productId].count += t.quantity
      const prod = products.find(p => p.id === t.productId)
      if (prod) outCounts[t.productId].category = prod.category
    })
    return Object.values(outCounts).sort((a, b) => b.count - a.count).slice(0, 5)
  }, [transactions, products])

  // Top 5 stagnant (fewest out transactions)
  const topStagnant = useMemo(() => {
    const outCounts: Record<string, number> = {}
    transactions.filter(t => t.type === 'out').forEach(t => {
      outCounts[t.productId] = (outCounts[t.productId] || 0) + t.quantity
    })
    return products
      .map(p => ({ name: p.name, category: p.category, count: outCounts[p.id] || 0 }))
      .sort((a, b) => a.count - b.count)
      .slice(0, 5)
  }, [products, transactions])

  // Alert stock
  const lowStock = useMemo(() => products.filter(p => p.stock > 0 && p.stock <= p.minStock), [products])
  const outStock = useMemo(() => products.filter(p => p.stock === 0), [products])

  if (!mounted) return null

  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Laporan Inventory</h1>
          <p className="text-zinc-400 text-sm mt-1">Analisis lengkap performa inventory kamu</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border border-white/[0.08] text-zinc-300 hover:bg-white/[0.04]">
            <DownloadIcon />
            Export PDF
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border border-white/[0.08] text-zinc-300 hover:bg-white/[0.04]">
            <DownloadIcon />
            Export Excel
          </button>
        </div>
      </div>

      {/* ===== 6 STAT CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Unit" value={totalItems.toLocaleString()} borderColor="border-l-emerald-400" />
        <StatCard label="Total Nilai" value={formatRp(totalValue)} borderColor="border-l-blue-400" />
        <StatCard label="Rata-rata Harga" value={formatRp(avgPrice)} borderColor="border-l-purple-400" />
        <StatCard label="Dead Stock" value={`${deadStock.length} produk`} borderColor="border-l-red-500" />
        <StatCard label="Perputaran Stok" value={`${stockTurnover}x`} borderColor="border-l-indigo-400" />
        <StatCard label="Total Kategori" value={categories.length.toString()} borderColor="border-l-zinc-400" />
      </div>

      {/* ===== NILAI PER KATEGORI ===== */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/[0.06]">
          <h2 className="font-semibold text-white">Nilai Per Kategori</h2>
          <p className="text-xs text-zinc-500 mt-1">Distribusi nilai inventory berdasarkan kategori</p>
        </div>
        <div className="p-5 space-y-4">
          {topCategory.map(cat => {
            const pct = totalValue > 0 ? (cat.value / totalValue) * 100 : 0
            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                    <span className="text-sm font-medium text-white">{cat.name}</span>
                    <span className="text-xs text-zinc-500">{cat.count} produk</span>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300">
                    {pct.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pct}%`, background: cat.color }}
                  />
                </div>
              </div>
            )
          })}
          {topCategory.length === 0 && (
            <p className="text-center text-zinc-500 py-8">Belum ada data</p>
          )}
        </div>
      </div>

      {/* ===== RINGKASAN TRANSAKSI (30 HARI TERAKHIR) ===== */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/[0.06]">
          <h2 className="font-semibold text-white">Ringkasan Transaksi</h2>
          <p className="text-xs text-zinc-500 mt-1">30 hari terakhir</p>
        </div>
        <div className="p-5 space-y-5">
          {/* 3 metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
              <p className="text-xs text-zinc-400 mb-1">Total Masuk</p>
              <p className="text-xl font-bold text-emerald-400">+{totalMasuk30.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4">
              <p className="text-xs text-zinc-400 mb-1">Total Keluar</p>
              <p className="text-xl font-bold text-red-400">-{totalKeluar30.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04] p-4">
              <p className="text-xs text-zinc-400 mb-1">Selisih Net</p>
              <p className={`text-xl font-bold ${netSelisih >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>
                {netSelisih >= 0 ? '+' : ''}{netSelisih.toLocaleString()}
              </p>
            </div>
          </div>
          {/* Bar Chart */}
          <div>
            <RechartsBarChart data={weeklyData} />
          </div>
        </div>
      </div>

      {/* ===== PRODUK PALING AKTIF vs PALING STAGNAN ===== */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/[0.06]">
          <h2 className="font-semibold text-white">Produk Paling Aktif vs Paling Stagnan</h2>
          <p className="text-xs text-zinc-500 mt-1">Berdasarkan jumlah transaksi keluar</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06]">
          {/* Top 5 Terlaris */}
          <div className="p-5">
            <h3 className="text-sm font-semibold text-emerald-400 mb-4">Top 5 Terlaris</h3>
            <div className="space-y-3">
              {topActive.length > 0 ? topActive.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{item.name}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400">{item.category || '-'}</span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-400">{item.count}</span>
                </div>
              )) : (
                <p className="text-sm text-zinc-500">Belum ada transaksi keluar</p>
              )}
            </div>
          </div>
          {/* Top 5 Stagnan */}
          <div className="p-5">
            <h3 className="text-sm font-semibold text-amber-400 mb-4">Top 5 Stagnan</h3>
            <div className="space-y-3">
              {topStagnant.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{item.name}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400">{item.category}</span>
                  </div>
                  <span className="text-sm font-semibold text-amber-400">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== DEAD STOCK SECTION ===== */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm">Dead Stock</h2>
            <p className="text-xs text-zinc-500">{deadStock.length} produk tanpa transaksi keluar</p>
          </div>
        </div>
        <div className="p-5">
          {deadStock.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {deadStock.map(p => (
                <div key={p.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 text-xs font-bold shrink-0">
                    {p.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{p.name}</p>
                    <p className="text-[11px] text-zinc-500">{p.category}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">0 transaksi keluar</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-zinc-400">{formatRp(p.price)}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/12 text-red-400">
                        DEAD STOCK
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-zinc-500 py-6 text-sm">Tidak ada dead stock — semua produk memiliki transaksi keluar</p>
          )}
        </div>
      </div>

      {/* ===== ALERT STOK ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Low Stock */}
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-white/[0.06] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Stok Rendah</h3>
              <p className="text-xs text-zinc-500">{lowStock.length} produk perlu restock</p>
            </div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {lowStock.slice(0, 5).map(p => {
              const ratio = p.minStock > 0 ? p.stock / p.minStock : 1
              const barColor = ratio < 0.5 ? 'bg-red-500' : ratio < 0.8 ? 'bg-amber-500' : 'bg-emerald-500'
              return (
                <div key={p.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/5 flex items-center justify-center text-amber-400 text-[10px] font-bold">
                        {p.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{p.name}</p>
                        <p className="text-[11px] text-zinc-500">{p.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-amber-400">{p.stock}</p>
                      <p className="text-[10px] text-zinc-500">min: {p.minStock}</p>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {lowStock.length === 0 && <p className="px-5 py-6 text-center text-zinc-500 text-sm">Semua stok aman</p>}
          </div>
        </div>

        {/* Out of Stock */}
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-white/[0.06] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Stok Habis</h3>
              <p className="text-xs text-zinc-500">{outStock.length} produk habis</p>
            </div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {outStock.slice(0, 5).map(p => {
              const ratio = 0
              const barColor = 'bg-red-500'
              return (
                <div key={p.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/5 flex items-center justify-center text-red-400 text-[10px] font-bold">
                        {p.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{p.name}</p>
                        <p className="text-[11px] text-zinc-500">{p.category}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/12 text-red-400">Habis</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {outStock.length === 0 && <p className="px-5 py-6 text-center text-zinc-500 text-sm">Tidak ada produk habis</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== COMPONENTS =====

function StatCard({ label, value, borderColor }: { label: string; value: string; borderColor: string }) {
  return (
    <div className={`glass-card border-l-4 ${borderColor} p-4`}>
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-white truncate">{value}</p>
    </div>
  )
}

function DownloadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}
