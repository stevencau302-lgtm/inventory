'use client'

import { useEffect, useState } from 'react'
import { fetchProducts, fetchCategories, fetchTransactions, formatRp, Product, Category, Transaction } from '@/lib/supabase'
import {
  Package,
  DollarSign,
  BarChart3,
  Tag,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  PieChart,
  Activity,
  Zap,
  Sparkles,
} from 'lucide-react'

export default function ReportsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [p, c, t] = await Promise.all([
          fetchProducts(),
          fetchCategories(),
          fetchTransactions(),
        ])
        setProducts(p)
        setCategories(c)
        setTransactions(t)
      } catch (err) {
        console.error('Failed to load report data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl animate-pulse" />
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin relative" />
          </div>
          <p className="text-zinc-400 text-sm font-medium tracking-wide">Memuat analisa...</p>
        </div>
      </div>
    )
  }

  const totalItems = products.reduce((s, p) => s + p.stock, 0)
  const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0)
  const avgPrice = products.length ? products.reduce((s, p) => s + p.price, 0) / products.length : 0
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.min_stock)
  const outStock = products.filter(p => p.stock === 0)

  const totalIn = transactions.filter(t => t.type === 'in').reduce((s, t) => s + t.quantity, 0)
  const totalOut = transactions.filter(t => t.type === 'out').reduce((s, t) => s + t.quantity, 0)

  const topCategory = categories.map(c => ({
    ...c,
    count: products.filter(p => p.category === c.name).length,
    value: products.filter(p => p.category === c.name).reduce((s, p) => s + p.price * p.stock, 0),
  })).sort((a, b) => b.value - a.value)

  const recentTx = transactions.slice(0, 10)

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="relative">
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-5 right-20 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.15)]">
            <BarChart3 className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent tracking-tight">
              Analisa Inventory
            </h1>
            <p className="text-zinc-500 text-sm mt-0.5">Insight real-time performa & status inventory</p>
          </div>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <GlassStatCard
          label="Total Unit"
          value={totalItems.toLocaleString('id-ID')}
          icon={<Package className="w-5 h-5" />}
          glowColor="purple"
          valueColor="text-white"
        />
        <GlassStatCard
          label="Total Nilai Stok"
          value={formatRp(totalValue)}
          icon={<DollarSign className="w-5 h-5" />}
          glowColor="emerald"
          valueColor="text-emerald-400"
        />
        <GlassStatCard
          label="Rata-rata Harga"
          value={formatRp(avgPrice)}
          icon={<PieChart className="w-5 h-5" />}
          glowColor="purple"
          valueColor="text-purple-400"
        />
        <GlassStatCard
          label="Total Kategori"
          value={categories.length.toString()}
          icon={<Tag className="w-5 h-5" />}
          glowColor="emerald"
          valueColor="text-white"
        />
      </div>

      {/* Transaction Flow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <GlassStatCard
          label="Total Masuk"
          value={`+${totalIn.toLocaleString('id-ID')}`}
          icon={<ArrowDownCircle className="w-5 h-5" />}
          glowColor="emerald"
          valueColor="text-emerald-400"
        />
        <GlassStatCard
          label="Total Keluar"
          value={`-${totalOut.toLocaleString('id-ID')}`}
          icon={<ArrowUpCircle className="w-5 h-5" />}
          glowColor="red"
          valueColor="text-red-400"
        />
        <GlassStatCard
          label="Stok Rendah"
          value={lowStock.length.toString()}
          icon={<AlertTriangle className="w-5 h-5" />}
          glowColor="red"
          valueColor="text-amber-400"
        />
        <GlassStatCard
          label="Stok Habis"
          value={outStock.length.toString()}
          icon={<XCircle className="w-5 h-5" />}
          glowColor="red"
          valueColor="text-red-400"
        />
      </div>

      {/* Category Breakdown */}
      <GlassPanel>
        <div className="p-7 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.1)]">
              <PieChart className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="font-bold text-white tracking-tight">Distribusi Nilai Kategori</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Breakdown nilai inventory per kategori</p>
            </div>
          </div>
        </div>
        <div className="p-7 space-y-6">
          {topCategory.map((cat) => {
            const pct = totalValue > 0 ? (cat.value / totalValue) * 100 : 0
            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shadow-[0_0_6px_currentColor]" style={{ background: cat.color || '#a855f7', color: cat.color || '#a855f7' }} />
                    <span className="text-sm font-semibold text-white">{cat.name}</span>
                    <span className="text-[11px] text-zinc-500 bg-white/[0.04] border border-white/[0.06] px-2.5 py-0.5 rounded-full">{cat.count} produk</span>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="text-sm font-bold text-white">{formatRp(cat.value)}</span>
                    <span className="text-[11px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full">{pct.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-white/[0.04] border border-white/[0.04] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out relative"
                    style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${cat.color || '#a855f7'}88, ${cat.color || '#a855f7'})` }}
                  >
                    <div className="absolute inset-0 rounded-full opacity-50" style={{ boxShadow: `0 0 8px ${cat.color || '#a855f7'}` }} />
                  </div>
                </div>
              </div>
            )
          })}
          {topCategory.length === 0 && (
            <p className="text-center text-zinc-500 py-10 text-sm">Belum ada data kategori</p>
          )}
        </div>
      </GlassPanel>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <GlassPanel>
          <div className="p-6 border-b border-white/[0.06] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.1)]">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Stok Rendah</h3>
              <p className="text-xs text-zinc-500">{lowStock.length} produk perlu restock</p>
            </div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {lowStock.slice(0, 5).map(p => (
              <div key={p.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/10 flex items-center justify-center text-amber-400 text-[11px] font-bold">
                    {p.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{p.name}</p>
                    <p className="text-[11px] text-zinc-500">{p.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold text-amber-400">{p.stock}</p>
                  <p className="text-[10px] text-zinc-600">min: {p.min_stock}</p>
                </div>
              </div>
            ))}
            {lowStock.length === 0 && (
              <div className="px-6 py-10 text-center">
                <p className="text-zinc-500 text-sm">Semua stok aman ✓</p>
              </div>
            )}
          </div>
        </GlassPanel>

        {/* Out of Stock */}
        <GlassPanel>
          <div className="p-6 border-b border-white/[0.06] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.1)]">
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Stok Habis</h3>
              <p className="text-xs text-zinc-500">{outStock.length} produk habis total</p>
            </div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {outStock.slice(0, 5).map(p => (
              <div key={p.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/10 flex items-center justify-center text-red-400 text-[11px] font-bold">
                    {p.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{p.name}</p>
                    <p className="text-[11px] text-zinc-500">{p.category}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl">
                  Habis
                </span>
              </div>
            ))}
            {outStock.length === 0 && (
              <div className="px-6 py-10 text-center">
                <p className="text-zinc-500 text-sm">Tidak ada produk habis ✓</p>
              </div>
            )}
          </div>
        </GlassPanel>
      </div>

      {/* Recent Transactions */}
      <GlassPanel>
        <div className="p-7 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.1)]">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold text-white tracking-tight">Aktivitas Terakhir</h2>
              <p className="text-xs text-zinc-500 mt-0.5">10 transaksi terbaru</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {recentTx.map(tx => (
            <div key={tx.id} className="px-7 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-all duration-200">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                tx.type === 'in'
                  ? 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.08)]'
                  : 'bg-red-500/10 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.08)]'
              }`}>
                {tx.type === 'in' ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{tx.product_name}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {new Date(tx.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {tx.note && ` · ${tx.note}`}
                </p>
              </div>
              <span className={`text-base font-extrabold px-4 py-1.5 rounded-xl shrink-0 border ${
                tx.type === 'in'
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : 'text-red-400 bg-red-500/10 border-red-500/20'
              }`}>
                {tx.type === 'in' ? '+' : '-'}{tx.quantity}
              </span>
            </div>
          ))}
          {recentTx.length === 0 && (
            <div className="px-7 py-12 text-center">
              <p className="text-zinc-500 text-sm">Belum ada aktivitas transaksi</p>
            </div>
          )}
        </div>
      </GlassPanel>

      {/* Top Products by Value */}
      <GlassPanel>
        <div className="p-7 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.1)]">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="font-bold text-white tracking-tight">Top Produk</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Produk dengan nilai inventory tertinggi</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {products
            .map(p => ({ ...p, totalValue: p.price * p.stock }))
            .sort((a, b) => b.totalValue - a.totalValue)
            .slice(0, 5)
            .map((p, idx) => (
              <div key={p.id} className="px-7 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/15 to-purple-600/5 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-extrabold text-purple-400">#{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{p.category} · {p.stock} unit × {formatRp(p.price)}</p>
                </div>
                <span className="text-base font-extrabold text-emerald-400 shrink-0">
                  {formatRp(p.totalValue)}
                </span>
              </div>
            ))}
          {products.length === 0 && (
            <div className="px-7 py-12 text-center">
              <p className="text-zinc-500 text-sm">Belum ada data produk</p>
            </div>
          )}
        </div>
      </GlassPanel>
    </div>
  )
}

/* ─── Glass Panel Component ─── */
function GlassPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative group">
      {/* Subtle glow on hover */}
      <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-purple-500/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
      <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-[#0f0f14]/80 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.4)]">
        {children}
      </div>
    </div>
  )
}

/* ─── Glassmorphism Stat Card ─── */
function GlassStatCard({
  label,
  value,
  icon,
  glowColor,
  valueColor,
}: {
  label: string
  value: string
  icon: React.ReactNode
  glowColor: 'purple' | 'emerald' | 'red'
  valueColor?: string
}) {
  const glowStyles = {
    purple: {
      iconBg: 'from-purple-500/20 to-purple-600/10',
      iconBorder: 'border-purple-500/25',
      iconText: 'text-purple-400',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.08)]',
      hoverBorder: 'group-hover:border-purple-500/30',
      hoverGlow: 'group-hover:shadow-[0_0_30px_rgba(168,85,247,0.12)]',
    },
    emerald: {
      iconBg: 'from-emerald-500/20 to-emerald-600/10',
      iconBorder: 'border-emerald-500/25',
      iconText: 'text-emerald-400',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.08)]',
      hoverBorder: 'group-hover:border-emerald-500/30',
      hoverGlow: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.12)]',
    },
    red: {
      iconBg: 'from-red-500/20 to-red-600/10',
      iconBorder: 'border-red-500/25',
      iconText: 'text-red-400',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.08)]',
      hoverBorder: 'group-hover:border-red-500/30',
      hoverGlow: 'group-hover:shadow-[0_0_30px_rgba(239,68,68,0.12)]',
    },
  }

  const s = glowStyles[glowColor]

  return (
    <div className={`group relative rounded-3xl p-6 border border-white/[0.08] bg-[#0f0f14]/80 backdrop-blur-xl transition-all duration-300 ${s.glow} ${s.hoverBorder} ${s.hoverGlow} hover:translate-y-[-2px]`}>
      {/* Background glow */}
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
        glowColor === 'purple' ? 'bg-purple-500/5' : glowColor === 'emerald' ? 'bg-emerald-500/5' : 'bg-red-500/5'
      }`} />
      <div className="relative">
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${s.iconBg} border ${s.iconBorder} flex items-center justify-center mb-4 ${s.iconText}`}>
          {icon}
        </div>
        <p className={`text-2xl md:text-3xl font-extrabold tracking-tight ${valueColor || 'text-white'}`}>
          {value}
        </p>
        <p className="text-[12px] text-zinc-500 font-medium mt-1 tracking-wide uppercase">{label}</p>
      </div>
    </div>
  )
}
