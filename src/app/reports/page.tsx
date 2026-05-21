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
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#FDC800] animate-spin" />
          <p className="text-zinc-400 text-sm font-medium">Memuat laporan...</p>
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

  // Recent transactions (last 10)
  const recentTx = transactions.slice(0, 10)

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[#FDC800]/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[#FDC800]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#fafafa]">Laporan Inventory</h1>
            <p className="text-zinc-500 text-sm">Ringkasan performa dan status inventory kamu</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Unit"
          value={totalItems.toLocaleString('id-ID')}
          icon={<Package className="w-5 h-5" />}
          iconBg="bg-[#FDC800]/10"
          iconColor="text-[#FDC800]"
        />
        <StatCard
          label="Total Nilai Stok"
          value={formatRp(totalValue)}
          icon={<DollarSign className="w-5 h-5" />}
          iconBg="bg-[#16A34A]/10"
          iconColor="text-[#16A34A]"
        />
        <StatCard
          label="Rata-rata Harga"
          value={formatRp(avgPrice)}
          icon={<PieChart className="w-5 h-5" />}
          iconBg="bg-[#432DD7]/10"
          iconColor="text-[#432DD7]"
        />
        <StatCard
          label="Total Kategori"
          value={categories.length.toString()}
          icon={<Tag className="w-5 h-5" />}
          iconBg="bg-[#FDC800]/10"
          iconColor="text-[#FDC800]"
        />
      </div>

      {/* Transaction Flow Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Masuk"
          value={`+${totalIn.toLocaleString('id-ID')}`}
          icon={<ArrowDownCircle className="w-5 h-5" />}
          iconBg="bg-[#16A34A]/10"
          iconColor="text-[#16A34A]"
          valueColor="text-[#16A34A]"
        />
        <StatCard
          label="Total Keluar"
          value={`-${totalOut.toLocaleString('id-ID')}`}
          icon={<ArrowUpCircle className="w-5 h-5" />}
          iconBg="bg-[#DC2626]/10"
          iconColor="text-[#DC2626]"
          valueColor="text-[#DC2626]"
        />
        <StatCard
          label="Stok Rendah"
          value={lowStock.length.toString()}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-400"
          valueColor="text-amber-400"
        />
        <StatCard
          label="Stok Habis"
          value={outStock.length.toString()}
          icon={<XCircle className="w-5 h-5" />}
          iconBg="bg-[#DC2626]/10"
          iconColor="text-[#DC2626]"
          valueColor="text-[#DC2626]"
        />
      </div>

      {/* Category Breakdown */}
      <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] overflow-hidden">
        <div className="p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#432DD7]/10 flex items-center justify-center">
              <PieChart className="w-4 h-4 text-[#432DD7]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#fafafa]">Nilai Per Kategori</h2>
              <p className="text-xs text-zinc-500">Distribusi nilai inventory berdasarkan kategori</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-5">
          {topCategory.map((cat) => {
            const pct = totalValue > 0 ? (cat.value / totalValue) * 100 : 0
            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: cat.color || '#432DD7' }} />
                    <span className="text-sm font-medium text-[#fafafa]">{cat.name}</span>
                    <span className="text-xs text-zinc-500 bg-white/[0.04] px-2 py-0.5 rounded-full">{cat.count} produk</span>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#fafafa]">{formatRp(cat.value)}</span>
                    <span className="text-xs font-medium text-[#FDC800] bg-[#FDC800]/10 px-2 py-0.5 rounded-full">{pct.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pct}%`, background: cat.color || '#432DD7' }}
                  />
                </div>
              </div>
            )
          })}
          {topCategory.length === 0 && (
            <p className="text-center text-zinc-500 py-8">Belum ada data kategori</p>
          )}
        </div>
      </div>

      {/* Alerts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
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
            {lowStock.slice(0, 5).map(p => (
              <div key={p.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
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
                  <p className="text-[10px] text-zinc-500">min: {p.min_stock}</p>
                </div>
              </div>
            ))}
            {lowStock.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-zinc-500 text-sm">Semua stok aman ✓</p>
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
              <p className="text-xs text-zinc-500">{outStock.length} produk habis total</p>
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
                <span className="text-xs font-semibold text-[#DC2626] bg-[#DC2626]/10 px-2.5 py-1 rounded-lg">
                  Habis
                </span>
              </div>
            ))}
            {outStock.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-zinc-500 text-sm">Tidak ada produk habis ✓</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] overflow-hidden">
        <div className="p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FDC800]/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-[#FDC800]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#fafafa]">Aktivitas Terakhir</h2>
              <p className="text-xs text-zinc-500">10 transaksi terakhir</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {recentTx.map(tx => (
            <div key={tx.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                tx.type === 'in' ? 'bg-[#16A34A]/10' : 'bg-[#DC2626]/10'
              }`}>
                {tx.type === 'in' ? (
                  <TrendingUp className="w-4 h-4 text-[#16A34A]" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-[#DC2626]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#fafafa] truncate">{tx.product_name}</p>
                <p className="text-[11px] text-zinc-500">
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
              <span className={`text-sm font-bold px-3 py-1 rounded-lg shrink-0 ${
                tx.type === 'in'
                  ? 'text-[#16A34A] bg-[#16A34A]/10'
                  : 'text-[#DC2626] bg-[#DC2626]/10'
              }`}>
                {tx.type === 'in' ? '+' : '-'}{tx.quantity}
              </span>
            </div>
          ))}
          {recentTx.length === 0 && (
            <div className="px-6 py-10 text-center">
              <p className="text-zinc-500 text-sm">Belum ada aktivitas transaksi</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Products by Value */}
      <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] overflow-hidden">
        <div className="p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#432DD7]/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#432DD7]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#fafafa]">Top Produk (Nilai Stok)</h2>
              <p className="text-xs text-zinc-500">Produk dengan nilai inventory terbesar</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {products
            .map(p => ({ ...p, totalValue: p.price * p.stock }))
            .sort((a, b) => b.totalValue - a.totalValue)
            .slice(0, 5)
            .map((p, idx) => (
              <div key={p.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-[#432DD7]/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-[#432DD7]">#{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#fafafa] truncate">{p.name}</p>
                  <p className="text-[11px] text-zinc-500">{p.category} · {p.stock} unit × {formatRp(p.price)}</p>
                </div>
                <span className="text-sm font-bold text-[#FDC800] shrink-0">
                  {formatRp(p.totalValue)}
                </span>
              </div>
            ))}
          {products.length === 0 && (
            <div className="px-6 py-10 text-center">
              <p className="text-zinc-500 text-sm">Belum ada data produk</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  valueColor,
}: {
  label: string
  value: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  valueColor?: string
}) {
  return (
    <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] p-5 hover:border-white/[0.12] transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0 ${iconColor}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className={`text-lg font-bold truncate ${valueColor || 'text-[#fafafa]'}`}>{value}</p>
          <p className="text-[11px] text-zinc-500 font-medium">{label}</p>
        </div>
      </div>
    </div>
  )
}
