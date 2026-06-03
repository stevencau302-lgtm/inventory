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
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-secondary)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Memuat analisa...</p>
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
          <BarChart3 className="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--color-text)' }}>Analisa Inventory</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Insight real-time performa & status inventory</p>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Unit" value={totalItems.toLocaleString('id-ID')} icon={<Package className="w-4 h-4" />} color="purple" />
        <StatCard label="Total Nilai Stok" value={formatRp(totalValue)} icon={<DollarSign className="w-4 h-4" />} color="emerald" />
        <StatCard label="Rata-rata Harga" value={formatRp(avgPrice)} icon={<PieChart className="w-4 h-4" />} color="purple" />
        <StatCard label="Total Kategori" value={categories.length.toString()} icon={<Tag className="w-4 h-4" />} color="emerald" />
      </div>

      {/* Transaction Flow */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Masuk" value={`+${totalIn.toLocaleString('id-ID')}`} icon={<ArrowDownCircle className="w-4 h-4" />} color="emerald" />
        <StatCard label="Total Keluar" value={`-${totalOut.toLocaleString('id-ID')}`} icon={<ArrowUpCircle className="w-4 h-4" />} color="red" />
        <StatCard label="Stok Rendah" value={lowStock.length.toString()} icon={<AlertTriangle className="w-4 h-4" />} color="amber" />
        <StatCard label="Stok Habis" value={outStock.length.toString()} icon={<XCircle className="w-4 h-4" />} color="red" />
      </div>

      {/* Category Breakdown */}
      <div className="neo-card overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
            <PieChart className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <h2 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Distribusi Nilai Kategori</h2>
            <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Breakdown nilai inventory per kategori</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {topCategory.map((cat) => {
            const pct = totalValue > 0 ? (cat.value / totalValue) * 100 : 0
            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: cat.color || '#a855f7' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{cat.name}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'var(--color-hover-bg)', color: 'var(--color-text-muted)' }}>{cat.count} produk</span>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{formatRp(cat.value)}</span>
                    <span className="text-[11px] font-bold text-purple-500 px-2 py-0.5 rounded-full" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>{pct.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-input-bg)' }}>
                  <div className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${pct}%`, background: cat.color || '#a855f7' }} />
                </div>
              </div>
            )
          })}
          {topCategory.length === 0 && (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>Belum ada data kategori</p>
          )}
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Low Stock Alert */}
        <div className="neo-card overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-badge-warning-bg)' }}>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Stok Rendah</h3>
              <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{lowStock.length} produk perlu restock</p>
            </div>
          </div>
          <div>
            {lowStock.slice(0, 5).map(p => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold" style={{ background: 'var(--color-badge-warning-bg)', color: 'var(--color-warning)' }}>
                    {p.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{p.name}</p>
                    <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{p.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-amber-500">{p.stock}</p>
                  <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>min: {p.min_stock}</p>
                </div>
              </div>
            ))}
            {lowStock.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Semua stok aman ✓</p>
              </div>
            )}
          </div>
        </div>

        {/* Out of Stock */}
        <div className="neo-card overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-badge-danger-bg)' }}>
              <XCircle className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Stok Habis</h3>
              <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{outStock.length} produk habis total</p>
            </div>
          </div>
          <div>
            {outStock.slice(0, 5).map(p => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold" style={{ background: 'var(--color-badge-danger-bg)', color: 'var(--color-danger)' }}>
                    {p.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{p.name}</p>
                    <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{p.category}</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: 'var(--color-badge-danger-bg)', color: 'var(--color-danger)' }}>
                  Habis
                </span>
              </div>
            ))}
            {outStock.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Tidak ada produk habis ✓</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="neo-card overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-badge-success-bg)' }}>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <h2 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Aktivitas Terakhir</h2>
            <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>10 transaksi terbaru</p>
          </div>
        </div>
        <div>
          {recentTx.map(tx => (
            <div key={tx.id} className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: tx.type === 'in' ? 'var(--color-badge-success-bg)' : 'var(--color-badge-danger-bg)' }}>
                {tx.type === 'in' ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{tx.product_name}</p>
                <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                  {new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {tx.note && ` · ${tx.note}`}
                </p>
              </div>
              <span className="text-sm font-bold px-3 py-1 rounded-lg shrink-0"
                style={{ background: tx.type === 'in' ? 'var(--color-badge-success-bg)' : 'var(--color-badge-danger-bg)', color: tx.type === 'in' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {tx.type === 'in' ? '+' : '-'}{tx.quantity}
              </span>
            </div>
          ))}
          {recentTx.length === 0 && (
            <div className="px-5 py-10 text-center">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Belum ada aktivitas transaksi</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Products by Value */}
      <div className="neo-card overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <h2 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Top Produk</h2>
            <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Produk dengan nilai inventory tertinggi</p>
          </div>
        </div>
        <div>
          {products
            .map(p => ({ ...p, totalValue: p.price * p.stock }))
            .sort((a, b) => b.totalValue - a.totalValue)
            .slice(0, 5)
            .map((p, idx) => (
              <div key={p.id} className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                  <span className="text-xs font-bold text-purple-500">#{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{p.name}</p>
                  <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{p.category} · {p.stock} unit × {formatRp(p.price)}</p>
                </div>
                <span className="text-sm font-bold text-emerald-500 shrink-0">{formatRp(p.totalValue)}</span>
              </div>
            ))}
          {products.length === 0 && (
            <div className="px-5 py-10 text-center">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Belum ada data produk</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Compact Stat Card ─── */
function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: 'purple' | 'emerald' | 'red' | 'amber' }) {
  const colorMap = {
    purple: { bg: 'rgba(139, 92, 246, 0.15)', text: 'text-purple-500' },
    emerald: { bg: 'var(--color-badge-success-bg)', text: 'text-emerald-500' },
    red: { bg: 'var(--color-badge-danger-bg)', text: 'text-red-500' },
    amber: { bg: 'var(--color-badge-warning-bg)', text: 'text-amber-500' },
  }
  const c = colorMap[color]

  return (
    <div className="neo-card p-4 hover:translate-y-[-1px] transition-all duration-200">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${c.text}`} style={{ background: c.bg }}>
        {icon}
      </div>
      <p className="text-xl md:text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{value}</p>
      <p className="text-[11px] font-medium mt-1 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
    </div>
  )
}
