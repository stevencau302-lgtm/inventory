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
  const recent = products.slice(0, 5)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Welcome */}
      <div className="cozy-card p-6 bg-cozy-navy text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-cozy-gold/20 -translate-y-8 translate-x-8" />
        <div className="relative z-10">
          <h1 className="text-xl font-bold">Halo, Admin! 👋</h1>
          <p className="text-white/70 text-sm mt-1">Inventory kamu dalam kondisi baik hari ini.</p>
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <p className="text-2xl font-bold text-cozy-gold">{totalUnits.toLocaleString()}</p>
              <p className="text-white/60 text-[11px] mt-0.5">Total Unit</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-white/60 text-[11px] mt-0.5">Produk</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <p className="text-2xl font-bold">{categories.length}</p>
              <p className="text-white/60 text-[11px] mt-0.5">Kategori</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="cozy-card p-4"><p className="text-[11px] text-cozy-muted font-medium uppercase">Stok Aman</p><p className="text-2xl font-bold text-emerald-600 mt-1">{inStock}</p></div>
        <div className="cozy-card p-4"><p className="text-[11px] text-cozy-muted font-medium uppercase">Stok Rendah</p><p className="text-2xl font-bold text-amber-600 mt-1">{lowStock}</p></div>
        <div className="cozy-card p-4"><p className="text-[11px] text-cozy-muted font-medium uppercase">Habis</p><p className="text-2xl font-bold text-red-500 mt-1">{outStock}</p></div>
        <div className="cozy-card p-4"><p className="text-[11px] text-cozy-muted font-medium uppercase">Total Nilai</p><p className="text-lg font-bold text-cozy-navy mt-1 truncate">{formatRp(totalValue)}</p></div>
      </div>

      {/* Recent */}
      <div className="cozy-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-cozy-border">
          <h2 className="text-sm font-semibold text-cozy-text">Produk Terbaru</h2>
          <Link href="/products" className="text-[12px] text-cozy-navy font-semibold hover:underline">Lihat Semua</Link>
        </div>
        {/* Desktop */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead><tr className="border-b border-cozy-border bg-cozy-gray">
              <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-cozy-muted uppercase">Produk</th>
              <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-cozy-muted uppercase">Kategori</th>
              <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-cozy-muted uppercase">Stok</th>
              <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-cozy-muted uppercase">Harga</th>
              <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-cozy-muted uppercase">Status</th>
            </tr></thead>
            <tbody>{recent.map(p => (
              <tr key={p.id} className="border-b border-cozy-border/50 hover:bg-cozy-gray/50 transition">
                <td className="px-5 py-3"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-xl bg-cozy-goldLight flex items-center justify-center text-[11px] font-bold text-cozy-navy">{p.name.substring(0,2).toUpperCase()}</div><span className="text-sm font-medium text-cozy-text">{p.name}</span></div></td>
                <td className="px-5 py-3 text-sm text-cozy-subtle">{p.category}</td>
                <td className="px-5 py-3 text-sm font-semibold text-cozy-text">{p.stock}</td>
                <td className="px-5 py-3 text-sm text-cozy-subtle">{formatRp(p.price)}</td>
                <td className="px-5 py-3"><StatusBadge product={p} /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {/* Mobile */}
        <div className="md:hidden divide-y divide-cozy-border/50">
          {recent.map(p => (
            <div key={p.id} className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cozy-goldLight flex items-center justify-center text-[11px] font-bold text-cozy-navy shrink-0">{p.name.substring(0,2).toUpperCase()}</div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-cozy-text truncate">{p.name}</p><p className="text-[11px] text-cozy-muted">{p.category} · Stok: {p.stock}</p></div>
              <div className="text-right shrink-0"><p className="text-sm font-semibold text-cozy-text">{formatRp(p.price)}</p><StatusBadge product={p} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ product }: { product: Product }) {
  const s = getStatus(product), l = getStatusLabel(product)
  const c = s === 'in-stock' ? 'cozy-badge-success' : s === 'low-stock' ? 'cozy-badge-warning' : 'cozy-badge-danger'
  return <span className={`cozy-badge ${c}`}>{l}</span>
}
