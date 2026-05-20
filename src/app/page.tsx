'use client'
import { useEffect, useState } from 'react'
import { Product, Category, getProducts, getCategories, formatRp, getStatus, getStatusLabel, loadSampleData } from '@/lib/store'
import Link from 'next/link'

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [mounted, setMounted] = useState(false)
  const [time, setTime] = useState('')

  useEffect(() => {
    let p = getProducts(); let c = getCategories()
    if (!p.length) { const d = loadSampleData(); p = d.products; c = d.categories }
    setProducts(p); setCategories(c); setMounted(true)
    setTime(new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
  }, [])

  if (!mounted) return null

  const inStock = products.filter(p => p.stock > p.minStock).length
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length
  const outStock = products.filter(p => p.stock === 0).length
  const total = products.length
  const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0)
  const recent = products.slice(0, 4)

  return (
    <div className="space-y-4 max-w-[390px] lg:max-w-4xl mx-auto">
      {/* Welcome Header */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-orange-500/20">
              A
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-[15px] font-bold text-white">Halo, Admin!</h1>
                <span className="animate-wave inline-block">👋</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">{time}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards 2x2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={<CheckIcon />} label="Stok Aman" value={inStock} color="emerald" />
        <MetricCard icon={<AlertIcon />} label="Stok Rendah" value={lowStock} color="amber" />
        <MetricCard icon={<XIcon />} label="Habis" value={outStock} color="red" />
        <MetricCard icon={<BoxIcon />} label="Produk" value={total} color="blue" />
      </div>

      {/* Total Value Banner */}
      <div className="glass-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Total Nilai Inventory</p>
            <p className="text-base font-bold text-orange-400 mt-0.5">{formatRp(totalValue)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10">
          <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
          <span className="text-[10px] font-bold text-emerald-400">+12%</span>
        </div>
      </div>

      {/* Recent Products */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
          <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">Produk Terbaru</h2>
          <Link href="/products" className="px-3 py-1 rounded-full text-[10px] font-semibold text-orange-400 bg-orange-400/10 hover:bg-orange-400/15 transition">
            Semua →
          </Link>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {recent.map((p, i) => (
            <div key={p.id} className="px-4 py-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${
                ['bg-gradient-to-br from-violet-500 to-purple-600', 'bg-gradient-to-br from-blue-500 to-cyan-600', 'bg-gradient-to-br from-orange-500 to-red-500', 'bg-gradient-to-br from-emerald-500 to-teal-600'][i % 4]
              }`}>
                {p.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-white truncate">{p.name}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  <span className="px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-400">{p.category}</span>
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[12px] font-semibold text-zinc-200">{formatRp(p.price)}</p>
                <StatusPill product={p} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
  const colors: Record<string, { bg: string, text: string }> = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  }
  const c = colors[color]
  return (
    <div className="glass-card p-3.5">
      <div className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center mb-2.5`}>
        <div className={c.text}>{icon}</div>
      </div>
      <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-0.5 ${c.text}`}>{value}</p>
    </div>
  )
}

function StatusPill({ product }: { product: Product }) {
  const s = getStatus(product), l = getStatusLabel(product)
  const c = s === 'in-stock' ? 'badge-success' : s === 'low-stock' ? 'badge-warning' : 'badge-danger'
  return <span className={`badge ${c} mt-1`}>{l}</span>
}

function CheckIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
function AlertIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg> }
function XIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg> }
function BoxIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg> }
