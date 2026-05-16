'use client'

import { useEffect, useState } from 'react'
import { Product, getProducts, getCategories, formatRp, getStatus, getStatusLabel, loadSampleData } from '@/lib/store'

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    let p = getProducts()
    if (p.length === 0) {
      const data = loadSampleData()
      p = data.products
    }
    setProducts(p)
    setMounted(true)
  }, [])

  if (!mounted) return null

  const total = products.length
  const inStock = products.filter(p => p.stock > p.minStock).length
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length
  const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0)
  const recent = products.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview inventory kamu hari ini</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={<BoxIcon />}
          label="Total Produk"
          value={total.toString()}
          gradient="from-brand-500/20 to-brand-600/5"
          iconColor="text-brand-400"
        />
        <StatCard
          icon={<CheckIcon />}
          label="Stok Tersedia"
          value={inStock.toString()}
          gradient="from-emerald-500/20 to-emerald-600/5"
          iconColor="text-emerald-400"
        />
        <StatCard
          icon={<AlertIcon />}
          label="Stok Rendah"
          value={lowStock.toString()}
          gradient="from-amber-500/20 to-amber-600/5"
          iconColor="text-amber-400"
        />
        <StatCard
          icon={<WalletIcon />}
          label="Total Nilai"
          value={formatRp(totalValue)}
          gradient="from-purple-500/20 to-purple-600/5"
          iconColor="text-purple-400"
          small
        />
      </div>

      {/* Recent Products */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-white/5">
          <h2 className="font-semibold text-white">Produk Terbaru</h2>
          <a href="/products" className="text-xs text-brand-400 hover:text-brand-300 font-medium transition flex items-center gap-1">
            Lihat Semua
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </a>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Produk</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Kategori</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Stok</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Harga</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(p => (
                <tr key={p.id} className="border-b border-white/[0.03] hover:bg-brand-500/5 transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {p.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-white">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-400">{p.category}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-300 font-medium">{p.stock}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-400">{formatRp(p.price)}</td>
                  <td className="px-5 py-3.5"><StatusBadge product={p} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-white/5">
          {recent.map(p => (
            <div key={p.id} className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {p.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{p.name}</p>
                <p className="text-xs text-slate-500">{p.category} &middot; Stok: {p.stock}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-white">{formatRp(p.price)}</p>
                <StatusBadge product={p} />
              </div>
            </div>
          ))}
        </div>

        {recent.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            <p>Belum ada produk</p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, gradient, iconColor, small }: {
  icon: React.ReactNode, label: string, value: string, gradient: string, iconColor: string, small?: boolean
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-3 md:gap-4">
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div className="min-w-0">
          <p className={`${small ? 'text-lg md:text-2xl' : 'text-xl md:text-2xl'} font-bold text-white truncate`}>{value}</p>
          <p className="text-[11px] md:text-xs text-slate-500 mt-0.5">{label}</p>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ product }: { product: Product }) {
  const status = getStatus(product)
  const label = getStatusLabel(product)
  const classes = status === 'in-stock' ? 'badge-success' : status === 'low-stock' ? 'badge-warning' : 'badge-danger'
  return <span className={`badge ${classes}`}>{label}</span>
}

// Icons
function BoxIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
}
function CheckIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}
function AlertIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
}
function WalletIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" /></svg>
}
