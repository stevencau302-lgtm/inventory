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
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= p.minStock).slice(0, 4)

  const catBreakdown = categories.map(c => ({
    ...c,
    count: products.filter(p => p.category === c.name).length,
    units: products.filter(p => p.category === c.name).reduce((s, p) => s + p.stock, 0),
  })).sort((a, b) => b.units - a.units).slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="neo-card p-6 md:p-8 bg-neo-blue relative overflow-hidden">
        <div className="absolute top-2 right-2 w-24 h-24 rounded-full bg-neo-yellow border-[3px] border-slate-900 opacity-50 -translate-y-8 translate-x-8" />
        <div className="absolute bottom-2 left-2 w-16 h-16 rounded-full bg-neo-pink border-[3px] border-slate-900 opacity-40 translate-y-4 -translate-x-4" />
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900">Selamat Datang! 👋</h1>
              <p className="text-slate-700 text-sm md:text-base mt-2 font-medium max-w-md">
                Pantau seluruh inventory kamu dari sini. {lowStock > 0 && <span className="font-bold text-slate-900 bg-neo-yellow px-1.5 rounded">{lowStock} produk perlu restock</span>}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Link href="/transactions" className="neo-btn bg-neo-yellow text-slate-900 font-bold">+ Transaksi</Link>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-white rounded-lg border-[2.5px] border-slate-900 p-3" style={{ boxShadow: '3px 3px 0px 0px #1e293b' }}>
              <p className="text-2xl md:text-3xl font-black text-slate-900">{totalUnits.toLocaleString()}</p>
              <p className="text-slate-600 text-[11px] md:text-xs mt-1 font-bold uppercase">Total Unit</p>
            </div>
            <div className="bg-white rounded-lg border-[2.5px] border-slate-900 p-3" style={{ boxShadow: '3px 3px 0px 0px #1e293b' }}>
              <p className="text-2xl md:text-3xl font-black text-slate-900">{total}</p>
              <p className="text-slate-600 text-[11px] md:text-xs mt-1 font-bold uppercase">Jenis Produk</p>
            </div>
            <div className="bg-white rounded-lg border-[2.5px] border-slate-900 p-3" style={{ boxShadow: '3px 3px 0px 0px #1e293b' }}>
              <p className="text-2xl md:text-3xl font-black text-slate-900">{categories.length}</p>
              <p className="text-slate-600 text-[11px] md:text-xs mt-1 font-bold uppercase">Kategori</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="neo-card p-4 bg-neo-green">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-white border-[2px] border-slate-900 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-900" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-slate-900">{inStock}</p>
              <p className="text-[11px] text-slate-700 font-bold uppercase">Stok Aman</p>
            </div>
          </div>
        </div>
        <div className="neo-card p-4 bg-neo-yellow">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-white border-[2px] border-slate-900 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-900" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-slate-900">{lowStock}</p>
              <p className="text-[11px] text-slate-700 font-bold uppercase">Stok Rendah</p>
            </div>
          </div>
        </div>
        <div className="neo-card p-4 bg-neo-pink">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-white border-[2px] border-slate-900 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-900" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-slate-900">{outStock}</p>
              <p className="text-[11px] text-slate-700 font-bold uppercase">Habis</p>
            </div>
          </div>
        </div>
        <div className="neo-card p-4 bg-neo-purple">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-white border-[2px] border-slate-900 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-900" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-lg md:text-xl font-black text-slate-900 truncate">{formatRp(totalValue)}</p>
              <p className="text-[11px] text-slate-700 font-bold uppercase">Total Nilai</p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="neo-card overflow-hidden">
        <div className="flex items-center justify-between p-4 md:p-5 border-b-[3px] border-slate-900">
          <h2 className="font-bold text-slate-900">Produk Terbaru</h2>
          <Link href="/products" className="text-xs font-bold text-brand-700 hover:text-brand-900 transition flex items-center gap-1">
            Lihat Semua →
          </Link>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-[2px] border-slate-900 bg-neo-yellow/30">
                <th className="text-left px-5 py-3 text-[11px] font-black text-slate-900 uppercase">Produk</th>
                <th className="text-left px-5 py-3 text-[11px] font-black text-slate-900 uppercase">Kategori</th>
                <th className="text-left px-5 py-3 text-[11px] font-black text-slate-900 uppercase">Stok</th>
                <th className="text-left px-5 py-3 text-[11px] font-black text-slate-900 uppercase">Harga</th>
                <th className="text-left px-5 py-3 text-[11px] font-black text-slate-900 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(p => (
                <tr key={p.id} className="border-b-[1.5px] border-slate-200 hover:bg-neo-yellow/20 transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-neo-blue border-[2px] border-slate-900 flex items-center justify-center text-slate-900 text-xs font-black shrink-0">
                        {p.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-slate-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600 font-medium">{p.category}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-900 font-bold">{p.stock}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600 font-medium">{formatRp(p.price)}</td>
                  <td className="px-5 py-3.5"><StatusBadge product={p} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y-[1.5px] divide-slate-200">
          {recent.map(p => (
            <div key={p.id} className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neo-blue border-[2px] border-slate-900 flex items-center justify-center text-slate-900 text-xs font-black shrink-0">
                {p.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{p.name}</p>
                <p className="text-xs text-slate-500 font-medium">{p.category} · Stok: {p.stock}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-slate-900">{formatRp(p.price)}</p>
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
  const classes = status === 'in-stock' ? 'neo-badge-success' : status === 'low-stock' ? 'neo-badge-warning' : 'neo-badge-danger'
  return <span className={`neo-badge ${classes}`}>{label}</span>
}
