'use client'

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Product, Category, Transaction, fetchProducts, fetchCategories, fetchTransactions, formatRp } from '@/lib/store'
import {
  BarChart3, Package, DollarSign, Tag, TrendingUp, TrendingDown,
  AlertTriangle, XCircle, ArrowDownCircle, ArrowUpCircle,
  Activity, PieChart, Loader2, Download, RotateCcw, Skull
} from 'lucide-react'

const RechartsBarChart = dynamic(
  () => import('recharts').then((mod) => {
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } = mod
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
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#16A34A" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="gradientKeluar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#DC2626" stopOpacity={0.4} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    )
    return Chart
  }),
  { ssr: false, loading: () => <div className="h-[280px] flex items-center justify-center text-zinc-500 text-sm">Memuat grafik...</div> }
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

  // ---- Computed Data ----
  const totalItems = useMemo(() => products.reduce((s, p) => s + p.stock, 0), [products])
  const totalValue = useMemo(() => products.reduce((s, p) => s + p.price * p.stock, 0), [products])
  const avgPrice = useMemo(() => products.length ? products.reduce((s, p) => s + p.price, 0) / products.length : 0, [products])

  const deadStock = useMemo(() => {
    const now = Date.now()
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
    const outProductIds = new Set(transactions.filter(t => t.type === 'out').map(t => t.productId))
    return products.filter(p => {
      // Product must NOT have any outbound transactions
      if (outProductIds.has(p.id)) return false
      // Product must be at least 30 days old (grace period for new products)
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
    // Only consider products older than 7 days (exclude brand new products)
    const eligibleProducts = products.filter(p => (now - new Date(p.createdAt).getTime()) >= 7 * 24 * 60 * 60 * 1000)
    // Count outbound transactions in last 30 days only
    const recentOutTx = transactions.filter(t => t.type === 'out' && (now - new Date(t.createdAt).getTime()) < thirtyDaysMs)
    const outCounts: Record<string, number> = {}
    recentOutTx.forEach(t => {
      outCounts[t.productId] = (outCounts[t.productId] || 0) + t.quantity
    })
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
        <Loader2 className="w-8 h-8 text-[#FDC800] animate-spin" />
        <p className="text-zinc-400 text-sm font-medium">Memuat laporan...</p>
      </div>
    </div>
  )


  return (
    <div className="space-y-8">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#FDC800]/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[#FDC800]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#fafafa]">Laporan Inventory</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Analisis lengkap performa inventory kamu</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#1a1a1a] border border-white/[0.06] text-zinc-300 hover:bg-white/[0.04] hover:border-white/[0.12] transition-all">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* ===== 6 STAT CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Unit" value={totalItems.toLocaleString()} icon={<Package className="w-5 h-5" />} iconBg="bg-[#FDC800]/10" iconColor="text-[#FDC800]" />
        <StatCard label="Total Nilai Stok" value={formatRp(totalValue)} icon={<DollarSign className="w-5 h-5" />} iconBg="bg-[#16A34A]/10" iconColor="text-[#16A34A]" />
        <StatCard label="Rata-rata Harga" value={formatRp(avgPrice)} icon={<PieChart className="w-5 h-5" />} iconBg="bg-[#432DD7]/10" iconColor="text-[#432DD7]" />
        <StatCard label="Dead Stock" value={`${deadStock.length} produk`} icon={<Skull className="w-5 h-5" />} iconBg="bg-[#DC2626]/10" iconColor="text-[#DC2626]" valueColor="text-[#DC2626]" />
        <StatCard label="Perputaran Stok" value={Number(stockTurnover) > 0 ? `${stockTurnover}x` : 'Menunggu data'} subtitle={Number(stockTurnover) === 0 ? 'Muncul setelah ada penjualan' : undefined} icon={<RotateCcw className="w-5 h-5" />} iconBg="bg-[#432DD7]/10" iconColor="text-[#432DD7]" />
        <StatCard label="Total Kategori" value={categories.length.toString()} icon={<Tag className="w-5 h-5" />} iconBg="bg-[#FDC800]/10" iconColor="text-[#FDC800]" />
      </div>


      {/* ===== NILAI PER KATEGORI ===== */}
      <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] overflow-hidden">
        <div className="p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#432DD7]/10 flex items-center justify-center">
              <PieChart className="w-4 h-4 text-[#432DD7]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#fafafa]">Nilai Per Kategori</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Distribusi nilai inventory berdasarkan kategori</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-5">
          {topCategory.map(cat => {
            const pct = totalValue > 0 ? (cat.value / totalValue) * 100 : 0
            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                    <span className="text-sm font-medium text-[#fafafa]">{cat.name}</span>
                    <span className="text-xs text-zinc-500 bg-white/[0.04] px-2 py-0.5 rounded-full">{cat.count} produk</span>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#fafafa]">{formatRp(cat.value)}</span>
                    <span className="text-xs font-medium text-[#FDC800] bg-[#FDC800]/10 px-2 py-0.5 rounded-full">{pct.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: cat.color }} />
                </div>
              </div>
            )
          })}
          {topCategory.length === 0 && (
            <div className="text-center py-10">
              <p className="text-sm text-zinc-300">Belum ada kategori produk</p>
              <p className="text-xs text-zinc-500 mt-1">Tambahkan kategori dan produk untuk melihat distribusi nilai</p>
            </div>
          )}
        </div>
      </div>


      {/* ===== RINGKASAN TRANSAKSI 30 HARI ===== */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1a2e 50%, #16213e 100%)', border: '1px solid rgba(99, 102, 241, 0.08)' }}>
        <div className="p-6 border-b border-white/[0.04]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1))' }}>
                <Activity className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="font-bold text-[#fafafa] text-lg">Ringkasan Transaksi</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Performa 30 hari terakhir</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-zinc-400">Masuk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="text-[11px] text-zinc-400">Keluar</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl p-5" style={{ background: 'rgba(22, 163, 74, 0.06)', border: '1px solid rgba(22, 163, 74, 0.12)' }}>
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
                <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Barang Masuk</p>
              </div>
              <p className="text-3xl font-bold text-emerald-400">+{totalMasuk30.toLocaleString()}</p>
              <p className="text-[11px] text-zinc-500 mt-1">unit dalam 30 hari</p>
            </div>
            <div className="rounded-xl p-5" style={{ background: 'rgba(220, 38, 38, 0.06)', border: '1px solid rgba(220, 38, 38, 0.12)' }}>
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpCircle className="w-4 h-4 text-red-400" />
                <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Barang Keluar</p>
              </div>
              <p className="text-3xl font-bold text-red-400">-{totalKeluar30.toLocaleString()}</p>
              <p className="text-[11px] text-zinc-500 mt-1">unit dalam 30 hari</p>
            </div>
            <div className="rounded-xl p-5" style={{ background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.12)' }}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Selisih Net</p>
              </div>
              <p className={`text-3xl font-bold ${netSelisih >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {netSelisih >= 0 ? '+' : ''}{netSelisih.toLocaleString()}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">{netSelisih >= 0 ? 'stok bertambah' : 'stok berkurang'}</p>
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <RechartsBarChart data={weeklyData} />
          </div>
        </div>
      </div>


      {/* ===== PRODUK AKTIF vs STAGNAN ===== */}
      <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] overflow-hidden">
        <div className="p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FDC800]/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#FDC800]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#fafafa]">Produk Paling Aktif vs Stagnan</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Berdasarkan jumlah transaksi keluar</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06]">
          {/* Top 5 Terlaris */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#16A34A]" />
              <h3 className="text-sm font-semibold text-[#16A34A]">Top 5 Terlaris</h3>
            </div>
            <div className="space-y-3">
              {topActive.length > 0 ? topActive.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#16A34A]/10 text-[#16A34A] text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#fafafa] font-medium truncate">{item.name}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-zinc-500">{item.category || '-'}</span>
                  </div>
                  <span className="text-sm font-bold text-[#16A34A]">{item.count}</span>
                </div>
              )) : (
                <div className="text-center py-6">
                  <p className="text-sm text-zinc-300">Belum ada transaksi keluar</p>
                  <p className="text-xs text-zinc-500 mt-1">Mulai input penjualan pertama untuk melihat produk terlaris</p>
                </div>
              )}
            </div>
          </div>
          {/* Top 5 Stagnan */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-4 h-4 text-[#FDC800]" />
              <h3 className="text-sm font-semibold text-[#FDC800]">Top 5 Stagnan</h3>
            </div>
            <div className="space-y-3">
              {topStagnant.length > 0 ? topStagnant.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#FDC800]/10 text-[#FDC800] text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#fafafa] font-medium truncate">{item.name}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-zinc-500">{item.category}</span>
                  </div>
                  <span className="text-sm font-bold text-[#FDC800]">{item.count}</span>
                </div>
              )) : (
                <div className="text-center py-6">
                  <p className="text-sm text-zinc-300">Semua produk masih aktif bergerak</p>
                  <p className="text-xs text-zinc-500 mt-1">Tidak ada produk yang diam tanpa transaksi</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* ===== DEAD STOCK ===== */}
      <DeadStockTable deadStock={deadStock} transactions={transactions} formatRp={formatRp} />

      {/* ===== ALERT STOK ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Low Stock */}
        <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] overflow-hidden">
          <div className="p-5 border-b border-white/[0.06] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-[#fafafa] text-sm">Stok Rendah</h3>
              <p className="text-xs text-zinc-500">{lowStock.length} produk perlu restock</p>
            </div>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {lowStock.slice(0, 5).map(p => {
              const ratio = p.minStock > 0 ? p.stock / p.minStock : 1
              const barColor = ratio < 0.5 ? 'bg-[#DC2626]' : ratio < 0.8 ? 'bg-amber-500' : 'bg-[#16A34A]'
              return (
                <div key={p.id} className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 text-[10px] font-bold">
                        {p.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-[#fafafa] font-medium">{p.name}</p>
                        <p className="text-[11px] text-zinc-500">{p.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-400">{p.stock}</p>
                      <p className="text-[10px] text-zinc-500">min: {p.minStock}</p>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(ratio * 100, 100)}%` }} />
                  </div>
                </div>
              )
            })}
            {lowStock.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-emerald-400">Semua stok aman</p>
                <p className="text-xs text-zinc-400 mt-1">Tidak ada produk yang mendekati batas minimum</p>
              </div>
            )}
          </div>
        </div>


        {/* Out of Stock */}
        <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] overflow-hidden">
          <div className="p-5 border-b border-white/[0.06] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#DC2626]/10 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-[#DC2626]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#fafafa] text-sm">Stok Habis</h3>
              <p className="text-xs text-zinc-500">{outStock.length} produk habis</p>
            </div>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {outStock.slice(0, 5).map(p => (
              <div key={p.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#DC2626]/10 flex items-center justify-center text-[#DC2626] text-[10px] font-bold">
                    {p.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-[#fafafa] font-medium">{p.name}</p>
                    <p className="text-[11px] text-zinc-500">{p.category}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-[#DC2626]/10 text-[#DC2626]">Habis</span>
              </div>
            ))}
            {outStock.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-emerald-400">Semua produk tersedia</p>
                <p className="text-xs text-zinc-400 mt-1">Tidak ada produk dengan stok kosong saat ini</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


// ===== STAT CARD COMPONENT =====
function StatCard({ label, value, icon, iconBg, iconColor, valueColor, subtitle }: {
  label: string; value: string; icon: React.ReactNode; iconBg: string; iconColor: string; valueColor?: string; subtitle?: string
}) {
  return (
    <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] p-5 hover:border-white/[0.12] transition-all">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0 ${iconColor}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className={`text-lg font-bold truncate ${valueColor || 'text-[#fafafa]'}`}>{value}</p>
          <p className="text-[11px] text-zinc-500 font-medium">{label}</p>
          {subtitle && <p className="text-[10px] text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}


// ===== DEAD STOCK TABLE COMPONENT =====
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
    if (days > 90) return 'text-[#DC2626] font-bold'
    if (days > 30) return 'text-amber-400 font-semibold'
    return 'text-[#FDC800]'
  }

  const getStatusBadge = (days: number) => {
    if (days > 90) return <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-[#DC2626]/10 text-[#DC2626]">Kritis</span>
    if (days > 30) return <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-amber-500/10 text-amber-400">Stagnan</span>
    return <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-[#FDC800]/10 text-[#FDC800]">Perlu Perhatian</span>
  }

  const SortIcon = ({ col }: { col: typeof sortCol }) => {
    if (sortCol !== col) return <span className="text-zinc-600 ml-1">↕</span>
    return <span className="text-[#432DD7] ml-1">{sortAsc ? '↑' : '↓'}</span>
  }

  return (
    <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] overflow-hidden">
      <div className="p-6 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#DC2626]/10 flex items-center justify-center">
            <Skull className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div>
            <h2 className="font-semibold text-[#fafafa]">Dead Stock</h2>
            <p className="text-xs text-zinc-500">{deadStock.length} produk tanpa transaksi keluar</p>
          </div>
        </div>
        {totalValue > 0 && (
          <p className="text-sm font-bold text-[#DC2626]">Nilai tertahan: {formatRp(totalValue)}</p>
        )}
      </div>


      {deadStock.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#0f0f0f]">
                <th className="border-b border-white/[0.06] w-[48px] px-3 py-3 text-center text-[11px] font-bold text-zinc-500 uppercase tracking-wide">No</th>
                <th className="border-b border-white/[0.06] px-3 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Produk</th>
                <th className="border-b border-white/[0.06] w-[100px] px-3 py-3 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wide">SKU</th>
                <th className="border-b border-white/[0.06] w-[70px] px-3 py-3 text-center text-[11px] font-bold text-zinc-500 uppercase tracking-wide cursor-pointer hover:text-zinc-300 transition" onClick={() => handleSort('stock')}>
                  Stok<SortIcon col="stock" />
                </th>
                <th className="border-b border-white/[0.06] w-[120px] px-3 py-3 text-right text-[11px] font-bold text-zinc-500 uppercase tracking-wide cursor-pointer hover:text-zinc-300 transition" onClick={() => handleSort('price')}>
                  Harga<SortIcon col="price" />
                </th>
                <th className="border-b border-white/[0.06] w-[130px] px-3 py-3 text-right text-[11px] font-bold text-zinc-500 uppercase tracking-wide cursor-pointer hover:text-zinc-300 transition" onClick={() => handleSort('value')}>
                  Nilai Tertahan<SortIcon col="value" />
                </th>
                <th className="border-b border-white/[0.06] w-[110px] px-3 py-3 text-center text-[11px] font-bold text-zinc-500 uppercase tracking-wide cursor-pointer hover:text-zinc-300 transition" onClick={() => handleSort('days')}>
                  Hari<SortIcon col="days" />
                </th>
                <th className="border-b border-white/[0.06] w-[100px] px-3 py-3 text-center text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, idx) => (
                <tr key={p.id} className={`hover:bg-[#DC2626]/[0.03] transition ${idx % 2 === 1 ? 'bg-white/[0.01]' : ''}`}>
                  <td className="border-b border-white/[0.04] px-3 py-3 text-center text-xs text-zinc-500">{idx + 1}</td>
                  <td className="border-b border-white/[0.04] px-3 py-3">
                    <p className="text-sm font-medium text-[#fafafa]">{p.name}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-500 mt-0.5 inline-block">{p.category}</span>
                  </td>
                  <td className="border-b border-white/[0.04] px-3 py-3 font-mono text-xs text-zinc-400">{p.sku}</td>
                  <td className="border-b border-white/[0.04] px-3 py-3 text-center font-mono text-sm text-zinc-200">{p.stock}</td>
                  <td className="border-b border-white/[0.04] px-3 py-3 text-right font-mono text-xs text-zinc-300">{formatRp(p.price)}</td>
                  <td className="border-b border-white/[0.04] px-3 py-3 text-right font-mono text-sm text-[#DC2626]">{formatRp(p.value)}</td>
                  <td className="border-b border-white/[0.04] px-3 py-3 text-center">
                    <p className={`text-lg ${getDayColor(p.days)}`}>{p.days}</p>
                    <p className="text-[9px] text-zinc-600">hari</p>
                  </td>
                  <td className="border-b border-white/[0.04] px-3 py-3 text-center">{getStatusBadge(p.days)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#0f0f0f]">
                <td colSpan={5} className="px-3 py-3 text-xs font-medium text-zinc-400">{sorted.length} produk dead stock</td>
                <td className="px-3 py-3 text-right font-mono text-sm font-bold text-[#DC2626]">{formatRp(totalValue)}</td>
                <td className="px-3 py-3 text-center text-xs text-zinc-500">~{avgDays} hari</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="p-10 text-center">
          <p className="text-sm text-emerald-400">Tidak ada dead stock</p>
          <p className="text-xs text-zinc-400 mt-1">Semua produk memiliki transaksi keluar — inventory bergerak sehat</p>
        </div>
      )}
    </div>
  )
}
