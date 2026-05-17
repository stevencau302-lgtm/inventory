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

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-[#111827]">Dashboard</h1>
        <p className="text-sm text-[#111827]/50 mt-1">Overview inventory kamu hari ini</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="paper-card p-4">
          <p className="text-[11px] text-[#111827]/50 font-medium uppercase tracking-wide">Total Produk</p>
          <p className="text-2xl font-bold font-display text-[#111827] mt-1">{total}</p>
          <p className="text-[11px] text-[#111827]/40 mt-1">{totalUnits.toLocaleString()} unit</p>
        </div>
        <div className="paper-card p-4">
          <p className="text-[11px] text-[#111827]/50 font-medium uppercase tracking-wide">Stok Aman</p>
          <p className="text-2xl font-bold font-display text-accent-success mt-1">{inStock}</p>
          <p className="text-[11px] text-[#111827]/40 mt-1">{total > 0 ? Math.round((inStock/total)*100) : 0}% tersedia</p>
        </div>
        <div className="paper-card p-4">
          <p className="text-[11px] text-[#111827]/50 font-medium uppercase tracking-wide">Stok Rendah</p>
          <p className="text-2xl font-bold font-display text-accent-warning mt-1">{lowStock}</p>
          <p className="text-[11px] text-[#111827]/40 mt-1">Perlu restock</p>
        </div>
        <div className="paper-card p-4">
          <p className="text-[11px] text-[#111827]/50 font-medium uppercase tracking-wide">Total Nilai</p>
          <p className="text-lg font-bold font-display text-[#111827] mt-1 truncate">{formatRp(totalValue)}</p>
          <p className="text-[11px] text-[#111827]/40 mt-1">{outStock} produk habis</p>
        </div>
      </div>

      {/* Recent Products */}
      <div className="paper-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-paper-300">
          <h2 className="text-sm font-semibold text-[#111827]">Produk Terbaru</h2>
          <Link href="/products" className="text-[12px] text-[#111827]/50 hover:text-[#111827] font-medium transition">
            Lihat Semua &rarr;
          </Link>
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-paper-200 bg-paper-cream">
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[#111827]/50 uppercase tracking-wide">Produk</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[#111827]/50 uppercase tracking-wide">Kategori</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[#111827]/50 uppercase tracking-wide">Stok</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[#111827]/50 uppercase tracking-wide">Harga</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[#111827]/50 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(p => (
                <tr key={p.id} className="border-b border-paper-200 last:border-0 hover:bg-paper-cream/50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-paper-200 flex items-center justify-center text-[10px] font-medium text-[#111827]/60 shrink-0">
                        {p.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-[#111827]">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#111827]/60">{p.category}</td>
                  <td className="px-4 py-3 text-sm font-medium text-[#111827]">{p.stock}</td>
                  <td className="px-4 py-3 text-sm text-[#111827]/60 font-mono">{formatRp(p.price)}</td>
                  <td className="px-4 py-3"><StatusBadge product={p} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-paper-200">
          {recent.map(p => (
            <div key={p.id} className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-paper-200 flex items-center justify-center text-[11px] font-medium text-[#111827]/60 shrink-0">
                {p.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#111827] truncate">{p.name}</p>
                <p className="text-[11px] text-[#111827]/40">{p.category} &middot; Stok: {p.stock}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-[#111827] font-mono">{formatRp(p.price)}</p>
                <StatusBadge product={p} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ product }: { product: Product }) {
  const status = getStatus(product)
  const label = getStatusLabel(product)
  const cls = status === 'in-stock' ? 'paper-badge-success' : status === 'low-stock' ? 'paper-badge-warning' : 'paper-badge-danger'
  return <span className={`paper-badge ${cls}`}>{label}</span>
}
