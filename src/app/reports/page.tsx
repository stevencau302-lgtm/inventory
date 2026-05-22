'use client'

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Product, Category, Transaction, fetchProducts, fetchCategories, fetchTransactions, formatRp } from '@/lib/store'
import {
  BarChart3, Package, DollarSign, Tag, TrendingUp, TrendingDown,
  AlertTriangle, XCircle, ArrowDownCircle, ArrowUpCircle,
  Activity, PieChart, Loader2, Download, RotateCcw, Skull, Sparkles
} from 'lucide-react'

const RechartsBarChart = dynamic(
  () => import('recharts').then((mod) => {
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } = mod
    const Chart = ({ data }: { data: { week: string; masuk: number; keluar: number }[] }) => (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 0 }} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.03)" vertical={false} />
          <XAxis dataKey="week" tick={{ fill: '#52525b', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} dy={8} />
          <YAxis tick={{ fill: '#3f3f46', fontSize: 11 }} axisLine={false} tickLine={false} dx={-4} />
          <Bar dataKey="masuk" name="Masuk" radius={[8, 8, 0, 0]} fill="url(#gradientMasuk)" isAnimationActive={false} />
          <Bar dataKey="keluar" name="Keluar" radius={[8, 8, 0, 0]} fill="url(#gradientKeluar)" isAnimationActive={false} />
          <defs>
            <linearGradient id="gradientMasuk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="gradientKeluar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    )
    return Chart
  }),
  { ssr: false, loading: () => <div className="h-[280px] flex items-center justify-center text-zinc-600 text-sm">Memuat grafik...</div> }
)


export default function ReportsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    async function loadData() {
      const p = await fetchProducts()
      const c = await fetchCategories()
      const tx = await fetchTransactions()
      setProducts(p)
      setCategories(c)
      setTransactions(tx)
      setMounted(true)
    }
    loadData()
  }, [])

  const totalItems = useMemo(() => products.reduce((s, p) => s + p.stock, 0), [products])
  const totalValue = useMemo(() => products.reduce((s, p) => s + p.price * p.stock, 0), [products])
  const avgPrice = useMemo(() => products.length ? products.reduce((s, p) => s + p.price, 0) / products.length : 0, [products])

  const deadStock = useMemo(() => {
    const now = Date.now()
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
    const outProductIds = new Set(transactions.filter(t => t.type === 'out').map(t => t.productId))
    return products.filter(p => {
      if (outProductIds.has(p.id)) return false
      const createdTime = new Date(p.createdAt).getTime()
      return (now - createdTime) >= thirtyDaysMs
    })
  }, [products, transactions])

  const stockTurnover = useMemo(() => {
    const totalOutQty = transactions.filter(t => t.type === 'out').reduce((s, t) => s + t.quantity, 0)
    return totalItems > 0 ? (totalOutQty / totalItems).toFixed(2) : '0'
  }, [transactions, totalItems])

  const topCategory = useMemo(() => categories.map(c => ({
    ...c,
    count: products.filter(p => p.category === c.name).length,
    value: products.filter(p => p.category === c.name).reduce((s, p) => s + p.price * p.stock, 0)
  })).sort((a, b) => b.value - a.value), [categories, products])


  const last30Days = useMemo(() => {
    const now = Date.now()
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
    return transactions.filter(t => new Date(t.createdAt).getTime() >= thirtyDaysAgo)
  }, [transactions])

  const totalMasuk30 = useMemo(() => last30Days.filter(t => t.type === 'in').reduce((s, t) => s + t.quantity, 0), [last30Days])
  const totalKeluar30 = useMemo(() => last30Days.filter(t => t.type === 'out').reduce((s, t) => s + t.quantity, 0), [last30Days])
  const netSelisih = totalMasuk30 - totalKeluar30

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

  const topStagnant = useMemo(() => {
    const now = Date.now()
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
    const eligibleProducts = products.filter(p => (now - new Date(p.createdAt).getTime()) >= 7 * 24 * 60 * 60 * 1000)
    const recentOutTx = transactions.filter(t => t.type === 'out' && (now - new Date(t.createdAt).getTime()) < thirtyDaysMs)
    const outCounts: Record<string, number> = {}
    recentOutTx.forEach(t => { outCounts[t.productId] = (outCounts[t.productId] || 0) + t.quantity })
    return eligibleProducts
      .map(p => ({ name: p.name, category: p.category, count: outCounts[p.id] || 0 }))
      .sort((a, b) => a.count - b.count)
      .slice(0, 5)
  }, [products, transactions])

  const lowStock = useMemo(() => products.filter(p => p.stock > 0 && p.stock <= p.minStock), [products])
  const outStock = useMemo(() => products.filter(p => p.stock === 0), [products])


  if (!mounted) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
        <p className="text-zinc-500 text-sm font-medium">Memuat laporan...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-10">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Analisa Inventory</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Ringkasan performa & status inventory</p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-white/[0.06] bg-white/[0.03] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.12] transition-all">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>


      {/* ===== 6 STAT CARDS ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
        <GlassStatCard label="Total Unit" value={totalItems.toLocaleString()} icon={<Package className="w-4 h-4" />} accent="text-blue-400" accentBg="bg-blue-500/10" />
        <GlassStatCard label="Total Nilai Stok" value={formatRp(totalValue)} icon={<DollarSign className="w-4 h-4" />} accent="text-emerald-400" accentBg="bg-emerald-500/10" />
        <GlassStatCard label="Rata-rata Harga" value={formatRp(avgPrice)} icon={<PieChart className="w-4 h-4" />} accent="text-violet-400" accentBg="bg-violet-500/10" />
        <GlassStatCard label="Dead Stock" value={`${deadStock.length} produk`} icon={<Skull className="w-4 h-4" />} accent="text-red-400" accentBg="bg-red-500/10" />
        <GlassStatCard label="Perputaran Stok" value={Number(stockTurnover) > 0 ? `${stockTurnover}x` : '—'} icon={<RotateCcw className="w-4 h-4" />} accent="text-amber-400" accentBg="bg-amber-500/10" subtitle={Number(stockTurnover) === 0 ? 'Belum ada penjualan' : undefined} />
        <GlassStatCard label="Total Kategori" value={categories.length.toString()} icon={<Tag className="w-4 h-4" />} accent="text-cyan-400" accentBg="bg-cyan-500/10" />
      </div>

      {/* ===== NILAI PER KATEGORI ===== */}
      <GlassPanel>
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <PieChart className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Nilai Per Kategori</h2>
              <p className="text-xs text-zinc-500">Distribusi nilai inventory berdasarkan kategori</p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {topCategory.map(cat => {
            const pct = totalValue > 0 ? (cat.value / totalValue) * 100 : 0
            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: cat.color || '#a855f7' }} />
                    <span className="text-sm font-medium text-white">{cat.name}</span>
                    <span className="text-[11px] text-zinc-500 bg-white/[0.04] px-2 py-0.5 rounded-full">{cat.count} produk</span>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{formatRp(cat.value)}</span>
                    <span className="text-[11px] font-medium text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded-full">{pct.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: cat.color || '#a855f7' }} />
                  </div>
                </div>
              </div>
            )
          })}
          {topCategory.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-zinc-300">Belum ada kategori produk</p>
              <p className="text-xs text-zinc-500 mt-1">Tambahkan kategori dan produk untuk melihat distribusi nilai</p>
            </div>
          )}
        </div>
      </GlassPanel>


      {/* ===== RINGKASAN TRANSAKSI 30 HARI ===== */}
      <GlassPanel>
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Ringkasan Transaksi</h2>
                <p className="text-xs text-zinc-500">Performa 30 hari terakhir</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-zinc-500">Masuk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-[11px] text-zinc-500">Keluar</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl p-4 bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-400" />
                <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Barang Masuk</p>
              </div>
              <p className="text-2xl font-bold text-white">+{totalMasuk30.toLocaleString()}</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">unit dalam 30 hari</p>
            </div>
            <div className="rounded-xl p-4 bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpCircle className="w-3.5 h-3.5 text-red-400" />
                <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Barang Keluar</p>
              </div>
              <p className="text-2xl font-bold text-white">-{totalKeluar30.toLocaleString()}</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">unit dalam 30 hari</p>
            </div>
            <div className="rounded-xl p-4 bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
                <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Selisih Net</p>
              </div>
              <p className={`text-2xl font-bold ${netSelisih >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {netSelisih >= 0 ? '+' : ''}{netSelisih.toLocaleString()}
              </p>
              <p className="text-[11px] text-zinc-600 mt-0.5">{netSelisih >= 0 ? 'stok bertambah' : 'stok berkurang'}</p>
            </div>
          </div>
          <div className="rounded-xl p-4 bg-white/[0.02] border border-white/[0.04]">
            <RechartsBarChart data={weeklyData} />
          </div>
        </div>
      </GlassPanel>


      {/* ===== PRODUK AKTIF vs STAGNAN ===== */}
      <GlassPanel>
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Produk Aktif vs Stagnan</h2>
              <p className="text-xs text-zinc-500">Berdasarkan jumlah transaksi keluar</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06]">
          {/* Top 5 Terlaris */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <h3 className="text-sm font-medium text-zinc-300">Top 5 Terlaris</h3>
            </div>
            <div className="space-y-2">
              {topActive.length > 0 ? topActive.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors">
                  <span className="w-6 h-6 rounded-md bg-white/[0.04] text-zinc-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{item.name}</p>
                    <span className="text-[10px] text-zinc-500">{item.category || '-'}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{item.count}</span>
                </div>
              )) : (
                <div className="text-center py-8">
                  <p className="text-sm text-zinc-300">Belum ada transaksi keluar</p>
                  <p className="text-xs text-zinc-500 mt-1">Mulai input penjualan pertama</p>
                </div>
              )}
            </div>
          </div>
          {/* Top 5 Stagnan */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
              <h3 className="text-sm font-medium text-zinc-300">Top 5 Stagnan</h3>
            </div>
            <div className="space-y-2">
              {topStagnant.length > 0 ? topStagnant.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors">
                  <span className="w-6 h-6 rounded-md bg-white/[0.04] text-zinc-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{item.name}</p>
                    <span className="text-[10px] text-zinc-500">{item.category}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{item.count}</span>
                </div>
              )) : (
                <div className="text-center py-8">
                  <p className="text-sm text-zinc-300">Semua produk masih aktif</p>
                  <p className="text-xs text-zinc-500 mt-1">Tidak ada produk yang diam tanpa transaksi</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassPanel>


      {/* ===== DEAD STOCK ===== */}
      <DeadStockTable deadStock={deadStock} transactions={transactions} formatRp={formatRp} />

      {/* ===== ALERT STOK ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock */}
        <GlassPanel>
          <div className="p-5 border-b border-white/[0.06] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
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
                <div key={p.id} className="px-6 py-4 hover:bg-white/[0.02] transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 text-[10px] font-bold">
                        {p.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{p.name}</p>
                        <p className="text-[11px] text-zinc-500">{p.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{p.stock}</p>
                      <p className="text-[10px] text-zinc-600">min: {p.minStock}</p>
                    </div>
                  </div>
                  <div className="mt-2.5 h-1.5 rounded-full bg-white/[0.04] border border-white/[0.04] overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${Math.min(ratio * 100, 100)}%` }} />
                  </div>
                </div>
              )
            })}
            {lowStock.length === 0 && (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-emerald-400 font-medium">Semua stok aman</p>
                <p className="text-xs text-zinc-500 mt-1">Tidak ada produk mendekati batas minimum</p>
              </div>
            )}
          </div>
        </GlassPanel>

        {/* Out of Stock */}
        <GlassPanel>
          <div className="p-5 border-b border-white/[0.06] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Stok Habis</h3>
              <p className="text-xs text-zinc-500">{outStock.length} produk habis</p>
            </div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {outStock.slice(0, 5).map(p => (
              <div key={p.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 text-[10px] font-bold">
                    {p.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{p.name}</p>
                    <p className="text-[11px] text-zinc-500">{p.category}</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-red-500/10 text-red-400">Habis</span>
              </div>
            ))}
            {outStock.length === 0 && (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-emerald-400 font-medium">Semua produk tersedia</p>
                <p className="text-xs text-zinc-500 mt-1">Tidak ada produk dengan stok kosong</p>
              </div>
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}


/* ─── GlassPanel Component ─── */
function GlassPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-[#141418] hover:border-white/[0.1] transition-colors duration-200">
      {children}
    </div>
  )
}

/* ─── GlassStatCard Component ─── */
function GlassStatCard({ label, value, icon, accent, accentBg, subtitle }: {
  label: string; value: string; icon: React.ReactNode; accent: string; accentBg: string; subtitle?: string
}) {
  return (
    <div className="rounded-2xl p-4 border border-white/[0.06] bg-[#141418] hover:border-white/[0.1] transition-colors duration-200">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg ${accentBg} flex items-center justify-center shrink-0 ${accent}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold text-white truncate">{value}</p>
          <p className="text-[11px] text-zinc-500 font-medium">{label}</p>
          {subtitle && <p className="text-[9px] text-zinc-600">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}


/* ─── DeadStockTable Component ─── */
function DeadStockTable({ deadStock, transactions, formatRp }: { deadStock: Product[]; transactions: Transaction[]; formatRp: (n: number) => string }) {
  const [sortCol, setSortCol] = useState<'days' | 'value' | 'stock' | 'price'>('days')
  const [sortAsc, setSortAsc] = useState(false)

  const now = Date.now()
  const deadStockWithDays = deadStock.map(p => {
    const lastIn = transactions
      .filter(t => t.productId === p.id && t.type === 'in')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    const addedDate = lastIn ? new Date(lastIn.createdAt).getTime() : new Date(p.updatedAt || Date.now()).getTime()
    const days = Math.max(0, Math.floor((now - addedDate) / (1000 * 60 * 60 * 24)))
    const value = p.price * p.stock
    return { ...p, days, value }
  })

  const handleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortAsc(!sortAsc)
    else { setSortCol(col); setSortAsc(false) }
  }

  const sorted = [...deadStockWithDays].sort((a, b) => {
    let diff = 0
    if (sortCol === 'days') diff = a.days - b.days
    else if (sortCol === 'value') diff = a.value - b.value
    else if (sortCol === 'stock') diff = a.stock - b.stock
    else if (sortCol === 'price') diff = a.price - b.price
    return sortAsc ? diff : -diff
  })

  const totalValue = deadStockWithDays.reduce((s, p) => s + p.value, 0)
  const avgDays = deadStockWithDays.length > 0 ? Math.round(deadStockWithDays.reduce((s, p) => s + p.days, 0) / deadStockWithDays.length) : 0

  const getDayColor = (days: number) => {
    if (days > 90) return 'text-red-400 font-extrabold'
    if (days > 30) return 'text-amber-400 font-bold'
    return 'text-yellow-400'
  }

  const getStatusBadge = (days: number) => {
    if (days > 90) return <span className="px-2.5 py-1 rounded-xl text-[9px] font-bold bg-red-500/10 border border-red-500/20 text-red-400">Kritis</span>
    if (days > 30) return <span className="px-2.5 py-1 rounded-xl text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">Stagnan</span>
    return <span className="px-2.5 py-1 rounded-xl text-[9px] font-bold bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">Perhatian</span>
  }

  const SortIcon = ({ col }: { col: typeof sortCol }) => {
    if (sortCol !== col) return <span className="text-zinc-600 ml-1">↕</span>
    return <span className="text-purple-400 ml-1">{sortAsc ? '↑' : '↓'}</span>
  }


  return (
    <GlassPanel>
      <div className="p-5 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
            <Skull className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Dead Stock</h2>
            <p className="text-xs text-zinc-500">{deadStock.length} produk tanpa transaksi keluar</p>
          </div>
        </div>
        {totalValue > 0 && (
          <p className="text-sm font-semibold text-red-400">
            Nilai tertahan: {formatRp(totalValue)}
          </p>
        )}
      </div>

      {deadStock.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-black/30">
                <th className="border-b border-white/[0.06] w-[48px] px-4 py-3.5 text-center text-[11px] font-bold text-zinc-500 uppercase tracking-wide">No</th>
                <th className="border-b border-white/[0.06] px-4 py-3.5 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Produk</th>
                <th className="border-b border-white/[0.06] w-[100px] px-4 py-3.5 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wide">SKU</th>
                <th className="border-b border-white/[0.06] w-[70px] px-4 py-3.5 text-center text-[11px] font-bold text-zinc-500 uppercase tracking-wide cursor-pointer hover:text-zinc-300 transition" onClick={() => handleSort('stock')}>Stok<SortIcon col="stock" /></th>
                <th className="border-b border-white/[0.06] w-[120px] px-4 py-3.5 text-right text-[11px] font-bold text-zinc-500 uppercase tracking-wide cursor-pointer hover:text-zinc-300 transition" onClick={() => handleSort('price')}>Harga<SortIcon col="price" /></th>
                <th className="border-b border-white/[0.06] w-[130px] px-4 py-3.5 text-right text-[11px] font-bold text-zinc-500 uppercase tracking-wide cursor-pointer hover:text-zinc-300 transition" onClick={() => handleSort('value')}>Nilai Tertahan<SortIcon col="value" /></th>
                <th className="border-b border-white/[0.06] w-[110px] px-4 py-3.5 text-center text-[11px] font-bold text-zinc-500 uppercase tracking-wide cursor-pointer hover:text-zinc-300 transition" onClick={() => handleSort('days')}>Hari<SortIcon col="days" /></th>
                <th className="border-b border-white/[0.06] w-[100px] px-4 py-3.5 text-center text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, idx) => (
                <tr key={p.id} className={`hover:bg-red-500/[0.03] transition-all duration-200 ${idx % 2 === 1 ? 'bg-white/[0.01]' : ''}`}>
                  <td className="border-b border-white/[0.04] px-4 py-3.5 text-center text-xs text-zinc-500">{idx + 1}</td>
                  <td className="border-b border-white/[0.04] px-4 py-3.5">
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-zinc-500 mt-0.5 inline-block">{p.category}</span>
                  </td>
                  <td className="border-b border-white/[0.04] px-4 py-3.5 font-mono text-xs text-zinc-400">{p.sku}</td>
                  <td className="border-b border-white/[0.04] px-4 py-3.5 text-center font-mono text-sm text-zinc-200">{p.stock}</td>
                  <td className="border-b border-white/[0.04] px-4 py-3.5 text-right font-mono text-xs text-zinc-300">{formatRp(p.price)}</td>
                  <td className="border-b border-white/[0.04] px-4 py-3.5 text-right font-mono text-sm font-bold text-red-400">{formatRp(p.value)}</td>
                  <td className="border-b border-white/[0.04] px-4 py-3.5 text-center">
                    <p className={`text-lg ${getDayColor(p.days)}`}>{p.days}</p>
                    <p className="text-[9px] text-zinc-600">hari</p>
                  </td>
                  <td className="border-b border-white/[0.04] px-4 py-3.5 text-center">{getStatusBadge(p.days)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-black/30">
                <td colSpan={5} className="px-4 py-3.5 text-xs font-medium text-zinc-400">{sorted.length} produk dead stock</td>
                <td className="px-4 py-3.5 text-right font-mono text-sm font-extrabold text-red-400">{formatRp(totalValue)}</td>
                <td className="px-4 py-3.5 text-center text-xs text-zinc-500">~{avgDays} hari</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center">
          <p className="text-sm text-emerald-400 font-medium">Tidak ada dead stock</p>
          <p className="text-xs text-zinc-500 mt-1">Semua produk memiliki transaksi keluar — inventory sehat</p>
        </div>
      )}
    </GlassPanel>
  )
}
