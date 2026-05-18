'use client'
import { useEffect, useState } from 'react'
import { Product, Category, getProducts, getCategories, formatRp, getStatus, getStatusLabel, loadSampleData } from '@/lib/store'
import Link from 'next/link'

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    let p = getProducts(); let c = getCategories()
    if (!p.length) { const d = loadSampleData(); p = d.products; c = d.categories }
    setProducts(p); setCategories(c); setMounted(true)
  }, [])
  if (!mounted) return null

  const total = products.length
  const inStock = products.filter(p => p.stock > p.minStock).length
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length
  const outStock = products.filter(p => p.stock === 0).length
  const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0)
  const totalUnits = products.reduce((s, p) => s + p.stock, 0)
  const recent = products.slice(0, 4)

  return (
    <div className="space-y-4 md:space-y-5 max-w-5xl">
      {/* Welcome - compact */}
      <div className="cozy-card p-4 md:p-5 bg-cozy-navy !border-transparent text-white relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-cozy-gold/10" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">Halo, Admin! 👋</h1>
              <p className="text-white/60 text-xs mt-0.5">Ringkasan hari ini</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-cozy-gold">{totalUnits.toLocaleString()}</p>
              <p className="text-white/50 text-[10px]">Total Unit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats - 2x2 grid, very compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <StatCard label="Stok Aman" value={inStock} color="text-emerald-500 dark:text-emerald-400" />
        <StatCard label="Stok Rendah" value={lowStock} color="text-amber-500 dark:text-amber-400" />
        <StatCard label="Habis" value={outStock} color="text-red-500 dark:text-red-400" />
        <StatCard label="Produk" value={total} color="text-cozy-navy dark:text-cozy-gold" />
      </div>

      {/* Total value bar */}
      <div className="cozy-card p-3 flex items-center justify-between">
        <span className="text-xs font-medium text-cozy-subtle dark:text-[#a1a1aa]">Total Nilai Inventory</span>
        <span className="text-sm font-bold text-cozy-navy dark:text-cozy-gold">{formatRp(totalValue)}</span>
      </div>

      {/* Recent - compact list */}
      <div className="cozy-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-cozy-border dark:border-[#27272a]">
          <h2 className="text-xs font-semibold text-cozy-text dark:text-[#fafafa] uppercase tracking-wide">Terbaru</h2>
          <Link href="/products" className="text-[11px] text-cozy-navy dark:text-cozy-gold font-semibold">Semua →</Link>
        </div>
        <div className="divide-y divide-cozy-border/50 dark:divide-[#27272a]/50">
          {recent.map(p => (
            <div key={p.id} className="px-4 py-2.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cozy-gray dark:bg-[#27272a] flex items-center justify-center text-[10px] font-bold text-cozy-navy dark:text-cozy-gold shrink-0">{p.name.substring(0,2).toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-cozy-text dark:text-[#fafafa] truncate">{p.name}</p>
                <p className="text-[10px] text-cozy-muted dark:text-[#71717a]">{p.category}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[12px] font-semibold text-cozy-text dark:text-[#e4e4e7]">{formatRp(p.price)}</p>
                <StatusBadge product={p} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="cozy-card p-3">
      <p className="text-[10px] text-cozy-muted dark:text-[#71717a] font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold mt-0.5 ${color}`}>{value}</p>
    </div>
  )
}

function StatusBadge({ product }: { product: Product }) {
  const s = getStatus(product), l = getStatusLabel(product)
  const c = s === 'in-stock' ? 'cozy-badge-success' : s === 'low-stock' ? 'cozy-badge-warning' : 'cozy-badge-danger'
  return <span className={`cozy-badge ${c}`}>{l}</span>
}
