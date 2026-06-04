'use client'
import { useEffect, useState } from 'react'
import { Product, Transaction, formatRp, getStatus, getStatusLabel, uid, fetchProducts, fetchTransactions } from '@/lib/store'
import { useAuth } from '@/components/AuthProvider'
import dynamic from 'next/dynamic'

const DashboardCharts = dynamic(() => import('@/components/DashboardCharts'), { ssr: false })

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#0f0a2e] p-6 pt-8 pb-20">
        <div className="h-7 w-52 rounded-lg bg-white/10 mb-2" />
        <div className="h-4 w-72 rounded bg-white/5 mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-4 bg-black/30 border border-white/[0.08]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-16 rounded bg-white/10" />
                  <div className="h-5 w-24 rounded bg-white/10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] h-[340px]" />
        <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] h-[340px]" />
      </div>
      {/* Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] h-[280px]" />
        <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] h-[280px]" />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [mounted, setMounted] = useState(false)
  const [txPage, setTxPage] = useState(1)
  const txPerPage = 5

  useEffect(() => {
    async function loadData() {
      const p = await fetchProducts()
      setProducts(p)

      const tx = await fetchTransactions()
      setTransactions(tx)
      setMounted(true)
    }
    loadData()
  }, [])

  if (!mounted) return <DashboardSkeleton />

  const totalProducts = products.length
  const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0)
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length
  const outOfStock = products.filter(p => p.stock === 0).length
  const alertProducts = products.filter(p => p.stock > 0 && p.stock <= p.minStock)

  // Dynamic subtexts based on real data
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const newProductsThisWeek = products.filter(p => new Date(p.createdAt) >= oneWeekAgo).length
  const totalProductSubtitle = newProductsThisWeek > 0
    ? `+${newProductsThisWeek} minggu ini`
    : 'Tidak ada produk baru minggu ini'

  const inventoryValueSubtitle = 'Total nilai stok saat ini'

  const lowStockSubtitle = lowStock === 0
    ? 'Semua stok aman'
    : 'Perlu restock segera'

  const outOfStockSubtitle = outOfStock === 0
    ? 'Semua stok tersedia'
    : 'Produk tidak tersedia'

  const bestSellers = [...products]
    .map(p => {
      const sold = transactions.filter(t => t.productId === p.id && t.type === 'out').reduce((s, t) => s + t.quantity, 0)
      return { ...p, sold }
    })
    .filter(p => p.sold > 0)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5)

  const totalTxPages = Math.max(1, Math.ceil(transactions.length / txPerPage))
  const paginatedTx = transactions.slice((txPage - 1) * txPerPage, txPage * txPerPage)

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <Greeting products={products} transactions={transactions} lowStock={lowStock} outOfStock={outOfStock} />

      {/* Stat Cards - clean 4-column grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon="box" label="Total produk" value={String(totalProducts)} subtitle={totalProductSubtitle} border="border-l-indigo-500" />
        <StatCard icon="coins" label="Nilai inventory" value={formatRp(totalValue)} subtitle={inventoryValueSubtitle} border="border-l-emerald-500" />
        <StatCard icon="alert" label="Stok menipis" value={String(lowStock)} subtitle={lowStockSubtitle} border="border-l-amber-500" />
        <StatCard icon="x-circle" label="Stok habis" value={String(outOfStock)} subtitle={outOfStockSubtitle} border="border-l-red-500" />
      </div>

      {/* Charts */}
      <DashboardCharts products={products} transactions={transactions} />

      {/* Bottom: Transactions + Best Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Transactions */}
        <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-[#1a1a1a]">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
            <svg className="w-4 h-4 text-[#818cf8]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
            <h3 className="text-sm font-semibold text-white">Transaksi Terbaru</h3>
          </div>
          <div className="p-4 space-y-2">
            {paginatedTx.map(tx => (
              <div key={tx.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                <div>
                  <p className="text-[13px] font-semibold text-zinc-200">{tx.productName}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${tx.type === 'in' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                    {tx.type === 'in' ? 'Masuk' : 'Keluar'}
                  </span>
                  <span className="text-[13px] font-semibold text-zinc-200">{tx.quantity} unit</span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-center gap-4 pt-3 border-t border-white/[0.06]">
              <button onClick={() => setTxPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 rounded-lg border border-white/[0.1] text-xs font-medium text-zinc-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition">Prev</button>
              <span className="text-xs text-zinc-500">{txPage} / {totalTxPages}</span>
              <button onClick={() => setTxPage(p => Math.min(totalTxPages, p + 1))} className="px-3 py-1.5 rounded-lg border border-white/[0.1] text-xs font-medium text-zinc-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition">Next</button>
            </div>
          </div>
        </div>

        {/* Best Sellers */}
        <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-[#1a1a1a]">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
            <svg className="w-4 h-4 text-[#FDC800]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.996.178-1.768.535-2.251 1.084m13.004 0a15.522 15.522 0 00-12.003 0m12.003 0c.996.178 1.768.535 2.251 1.084" /></svg>
            <h3 className="text-sm font-semibold text-white">Produk Terlaris</h3>
          </div>
          <div className="p-4 space-y-2">
            {bestSellers.length === 0 ? (
              <div className="text-center py-10">
                <svg className="w-12 h-12 mx-auto text-zinc-600 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                <p className="text-zinc-500 text-sm">Belum ada data penjualan</p>
              </div>
            ) : (
              bestSellers.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 px-3 py-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                  <div className="w-8 h-8 rounded-lg bg-[#FDC800]/10 text-[#FDC800] flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#fafafa] truncate">{p.name}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{p.sold} terjual</p>
                  </div>
                  {i < 3 && p.sold > 0 && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FDC800]/10 text-[#FDC800] shrink-0">Best Seller</span>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Peringatan Section */}
      <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-[#1a1a1a]">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            <h3 className="text-sm font-semibold text-white">Peringatan</h3>
          </div>
          {(outOfStock + alertProducts.length) > 0 && (
            <span className="w-6 h-6 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">{outOfStock + alertProducts.length}</span>
          )}
        </div>
        {(outOfStock + alertProducts.length) === 0 ? (
          <div className="text-center py-10 px-5">
            <svg className="w-12 h-12 mx-auto text-emerald-400/60 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-zinc-500 text-sm">Semua produk stok aman</p>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Kolom Kiri: Stok Habis (merah) */}
            <div>
              <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wider mb-2 px-1">Stok Habis</p>
              <div className="max-h-[280px] overflow-y-auto space-y-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}>
                {products.filter(p => p.stock === 0).length > 0 ? products.filter(p => p.stock === 0).map(p => (
                  <div key={p.id} className="relative flex items-center justify-between px-4 py-3 rounded-lg border-l-2 border-l-red-500 bg-zinc-900/60 hover:bg-zinc-800/60 transition">
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                      <div>
                        <p className="text-[13px] font-medium text-white">{p.name}</p>
                        <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{p.sku} — Min: {p.minStock}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-semibold text-red-400">Stok: {p.stock}</p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">2 menit lalu</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-zinc-600 px-1">Tidak ada produk habis</p>
                )}
              </div>
            </div>

            {/* Kolom Kanan: Stok Menipis (amber) */}
            <div>
              <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-2 px-1">Stok Menipis</p>
              <div className="max-h-[280px] overflow-y-auto space-y-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}>
                {alertProducts.length > 0 ? alertProducts.map(p => (
                  <div key={p.id} className="relative flex items-center justify-between px-4 py-3 rounded-lg border-l-2 border-l-amber-400 bg-zinc-900/60 hover:bg-zinc-800/60 transition">
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                      <div>
                        <p className="text-[13px] font-medium text-white">{p.name}</p>
                        <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{p.sku} — Min: {p.minStock}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-semibold text-amber-400">Stok: {p.stock}</p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">5 menit lalu</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-zinc-600 px-1">Tidak ada produk menipis</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Greeting({ products, transactions, lowStock, outOfStock }: { products: Product[]; transactions: Transaction[]; lowStock: number; outOfStock: number }) {
  const { user } = useAuth()
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Selamat pagi' : hour < 17 ? 'Selamat siang' : hour < 20 ? 'Selamat sore' : 'Selamat malam'

  // Today's transactions
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTx = transactions.filter(t => new Date(t.createdAt) >= today)
  const todayIn = todayTx.filter(t => t.type === 'in').reduce((s, t) => s + t.quantity, 0)
  const todayOut = todayTx.filter(t => t.type === 'out').reduce((s, t) => s + t.quantity, 0)

  // Build subtitle parts
  const parts: string[] = []
  if (lowStock + outOfStock > 0) parts.push(`${lowStock + outOfStock} produk perlu perhatian`)
  if (todayTx.length > 0) parts.push(`${todayTx.length} transaksi hari ini`)
  if (parts.length === 0) parts.push('Semua stok aman, tidak ada aktivitas hari ini')

  return (
    <div>
      <h1 className="text-xl font-semibold text-white">
        {greeting}, {userName} <span className="inline-block animate-wave">👋</span>
      </h1>
      <p className="text-zinc-500 text-sm mt-1">{parts.join(' · ')}</p>
    </div>
  )
}

function useCountUp(end: number, duration: number = 1200) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (end === 0) { setCount(0); return }
    let start = 0
    const startTime = performance.now()
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * end))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [end, duration])
  return count
}

function AnimatedValue({ value, formatFn }: { value: string; formatFn?: (n: number) => string }) {
  // Extract number from value string
  const numMatch = value.replace(/[^\d]/g, '')
  const num = parseInt(numMatch) || 0
  const animated = useCountUp(num)

  // If it's a formatted currency (contains "Rp"), format it
  if (formatFn && num > 0) {
    return <>{formatFn(animated)}</>
  }
  // If pure number
  if (/^\d+$/.test(value)) {
    return <>{animated}</>
  }
  // Fallback: show original value
  return <>{value}</>
}

function StatCard({ icon, label, value, subtitle, border }: { icon: string; label: string; value: string; subtitle: string; border: string }) {
  const isRupiah = value.includes('Rp')
  const isPureNumber = /^\d+$/.test(value)

  return (
    <div className={`rounded-xl p-4 bg-[#343741] border border-white/[0.06]`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center text-white shrink-0">
          {icon === 'box' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>}
          {icon === 'coins' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>}
          {icon === 'alert' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
          {icon === 'x-circle' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
        </div>
        <p className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-xl font-bold text-white">
        {isRupiah ? <AnimatedValue value={value} formatFn={formatRp} /> : isPureNumber ? <AnimatedValue value={value} /> : value}
      </p>
      <p className="text-[10px] text-zinc-400 mt-1">{subtitle}</p>
    </div>
  )
}

