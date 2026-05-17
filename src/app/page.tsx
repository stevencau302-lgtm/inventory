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
    if (p.length === 0) { const data = loadSampleData(); p = data.products; c = data.categories }
    setProducts(p); setCategories(c); setMounted(true)
  }, [])

  if (!mounted) return null

  const total = products.length
  const inStock = products.filter(p => p.stock > p.minStock).length
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length
  const outStock = products.filter(p => p.stock === 0).length
  const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0)
  const totalUnits = products.reduce((s, p) => s + p.stock, 0)
  const recent = products.slice(0, 6)

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-dash-text">Dashboard</h1>
          <p className="text-[13px] text-dash-subtle mt-0.5">Overview inventory</p>
        </div>
        <Link href="/transactions" className="dash-btn-primary text-[13px]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Transaksi
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Produk" value={total.toString()} sub={`${totalUnits.toLocaleString()} unit`} color="text-brand-400" />
        <StatCard label="Stok Aman" value={inStock.toString()} sub={`${total > 0 ? Math.round((inStock/total)*100) : 0}%`} color="text-accent-success" />
        <StatCard label="Stok Rendah" value={lowStock.toString()} sub="Perlu restock" color="text-accent-warning" />
        <StatCard label="Total Nilai" value={formatRp(totalValue)} sub={`${outStock} habis`} color="text-dash-text" small />
      </div>

      {/* Table */}
      <div className="dash-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-dash-border">
          <span className="text-[13px] font-medium text-dash-text">Produk Terbaru</span>
          <Link href="/products" className="text-[12px] text-dash-subtle hover:text-dash-text transition">Lihat Semua &rarr;</Link>
        </div>
        {/* Desktop */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dash-border">
                <th className="text-left px-4 py-2 text-[11px] font-medium text-dash-subtle uppercase tracking-wider">Produk</th>
                <th className="text-left px-4 py-2 text-[11px] font-medium text-dash-subtle uppercase tracking-wider">Kategori</th>
                <th className="text-left px-4 py-2 text-[11px] font-medium text-dash-subtle uppercase tracking-wider">Stok</th>
                <th className="text-left px-4 py-2 text-[11px] font-medium text-dash-subtle uppercase tracking-wider">Harga</th>
                <th className="text-left px-4 py-2 text-[11px] font-medium text-dash-subtle uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(p => (
                <tr key={p.id} className="border-b border-dash-border/50 hover:bg-dash-elevated/50 transition">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-[10px] font-medium text-brand-400">{p.name.substring(0,2).toUpperCase()}</div>
                      <span className="text-[13px] font-medium text-dash-text">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-[13px] text-dash-subtle">{p.category}</td>
                  <td className="px-4 py-2.5 text-[13px] font-medium text-dash-text font-mono">{p.stock}</td>
                  <td className="px-4 py-2.5 text-[13px] text-dash-subtle font-mono">{formatRp(p.price)}</td>
                  <td className="px-4 py-2.5"><StatusBadge product={p} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile */}
        <div className="md:hidden divide-y divide-dash-border/50">
          {recent.map(p => (
            <div key={p.id} className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-[10px] font-medium text-brand-400 shrink-0">{p.name.substring(0,2).toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-dash-text truncate">{p.name}</p>
                <p className="text-[11px] text-dash-subtle">{p.category} &middot; {p.stock} unit</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[12px] font-medium text-dash-text font-mono">{formatRp(p.price)}</p>
                <StatusBadge product={p} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color, small }: { label: string, value: string, sub: string, color: string, small?: boolean }) {
  return (
    <div className="dash-card p-4">
      <p className="text-[11px] text-dash-subtle font-medium uppercase tracking-wider">{label}</p>
      <p className={`${small ? 'text-[16px]' : 'text-[22px]'} font-semibold ${color} mt-1 truncate font-mono`}>{value}</p>
      <p className="text-[11px] text-dash-subtle mt-1">{sub}</p>
    </div>
  )
}

function StatusBadge({ product }: { product: Product }) {
  const status = getStatus(product)
  const label = getStatusLabel(product)
  const cls = status === 'in-stock' ? 'dash-badge-success' : status === 'low-stock' ? 'dash-badge-warning' : 'dash-badge-danger'
  return <span className={`dash-badge ${cls}`}>{label}</span>
}
