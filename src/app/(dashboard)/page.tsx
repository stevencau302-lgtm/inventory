'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Product, Transaction, formatRp, fetchProducts, fetchTransactions } from '@/lib/store'
import { useAuth } from '@/components/AuthProvider'
import dynamic from 'next/dynamic'
import { Plus, ArrowDownToLine, ArrowUpFromLine, Sparkles, Package, AlertTriangle, Activity, ArrowRight, CheckCircle2, ArrowLeftRight, Trophy } from 'lucide-react'

const DashboardCharts = dynamic(() => import('@/components/DashboardCharts'), { ssr: false })
const StockDonut = dynamic(() => import('@/components/DashboardCharts').then(m => m.StockDonut), { ssr: false })

function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-8 w-64 rounded-lg bg-gray-200" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 rounded-2xl bg-white border border-gray-200 h-44" />
        <div className="lg:col-span-5 rounded-2xl bg-white border border-gray-200 h-44" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="rounded-2xl bg-white border border-gray-200 h-28" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-gray-200 h-64" />
        <div className="rounded-2xl bg-white border border-gray-200 h-64" />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [mounted, setMounted] = useState(false)
  const [txPage, setTxPage] = useState(1)
  const txPerPage = 4

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
  const safeStock = products.filter(p => p.stock > p.minStock).length

  // Health score: weighted by stock condition
  const healthScore = totalProducts === 0
    ? 100
    : Math.round(((safeStock * 1 + lowStock * 0.5 + outOfStock * 0) / totalProducts) * 100)
  const restockProducts = [...products].filter(p => p.stock <= p.minStock).sort((a, b) => a.stock - b.stock)

  // Trends (this week)
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const newProductsThisWeek = products.filter(p => new Date(p.createdAt) >= oneWeekAgo).length

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
    <div className="space-y-5">
      {/* Greeting */}
      <Greeting transactions={transactions} totalValue={totalValue} />

      {/* Row 1: Health Score + Quick Action */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <HealthCard score={healthScore} className="lg:col-span-7" />
        <QuickAction className="lg:col-span-5" />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard border="border-l-[#072C2C]" label="Total produk"
          value={String(totalProducts)} trend={newProductsThisWeek > 0 ? `+${newProductsThisWeek} minggu ini` : 'Tidak ada produk baru'} trendUp={newProductsThisWeek > 0} />
        <StatCard border="border-l-[#FF5F03]" label="Nilai inventory"
          value={formatRp(totalValue)} trend="Total nilai stok saat ini" trendUp />
        <StatCard border="border-l-[#D97706]" label="Stok menipis"
          value={String(lowStock)} trend={lowStock === 0 ? 'Semua stok aman' : 'Perlu restock segera'} trendUp={lowStock === 0} />
        <StatCard border="border-l-[#DC2626]" label="Stok habis"
          value={String(outOfStock)} trend={outOfStock === 0 ? 'Semua stok tersedia' : 'Produk tidak tersedia'} trendUp={outOfStock === 0} />
      </div>

      {/* Restock status banner */}
      {restockProducts.length === 0 ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-emerald-800">Mantap! Tidak ada produk yang perlu direstock saat ini.</p>
              <p className="text-[11px] text-emerald-600/80 mt-0.5">Semua produk memiliki stok yang aman.</p>
            </div>
          </div>
          <Link href="/products" className="hidden sm:flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 hover:text-emerald-800 whitespace-nowrap">
            Lihat Semua Stok <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="rounded-xl bg-amber-50 border border-amber-100 px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-amber-800">{restockProducts.length} produk perlu direstock.</p>
              <p className="text-[11px] text-amber-600/80 mt-0.5">Segera lakukan pengadaan agar stok tidak habis.</p>
            </div>
          </div>
          <Link href="/products" className="hidden sm:flex items-center gap-1.5 text-[12px] font-semibold text-amber-700 hover:text-amber-800 whitespace-nowrap">
            Lihat Semua Stok <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Row 2: Recent Transactions + Restock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Transactions */}
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-[#072C2C]" />
              <h3 className="text-sm font-semibold text-gray-900">Transaksi Terbaru</h3>
            </div>
            <Link href="/reports" className="text-[11px] font-medium text-gray-400 hover:text-gray-600">Lihat Semua</Link>
          </div>
          <div className="p-4">
            {paginatedTx.length === 0 ? (
              <div className="text-center py-10">
                <ArrowLeftRight className="w-10 h-10 mx-auto text-gray-200 mb-3" />
                <p className="text-gray-500 text-sm">Belum ada transaksi</p>
              </div>
            ) : (
              <div className="space-y-2">
                {paginatedTx.map(tx => (
                  <div key={tx.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tx.type === 'in' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                      {tx.type === 'in' ? <ArrowDownToLine className="w-4 h-4" /> : <ArrowUpFromLine className="w-4 h-4" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-800 truncate">{tx.productName}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{new Date(tx.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${tx.type === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                        {tx.type === 'in' ? 'Masuk' : 'Keluar'}
                      </span>
                      <span className="text-[13px] font-semibold text-gray-800">{tx.quantity} unit</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-center gap-4 pt-3">
                  <button onClick={() => setTxPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:bg-[#072C2C] hover:text-white hover:border-[#072C2C] transition">Prev</button>
                  <span className="text-xs text-gray-500">{txPage} / {totalTxPages}</span>
                  <button onClick={() => setTxPage(p => Math.min(totalTxPages, p + 1))} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:bg-[#072C2C] hover:text-white hover:border-[#072C2C] transition">Next</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Perlu Restock */}
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-gray-900">Perlu Restock</h3>
            </div>
            <Link href="/products" className="text-[11px] font-medium text-gray-400 hover:text-gray-600">Lihat Semua</Link>
          </div>
          <div className="p-4">
            {restockProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-3">
                  <Package className="w-6 h-6 text-amber-400" />
                </div>
                <p className="text-[13px] font-medium text-gray-700">Stok aman semua</p>
                <p className="text-[11px] text-gray-400 mt-1">Tidak ada produk yang perlu di restock.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {restockProducts.slice(0, 5).map(p => {
                  const pctVal = p.minStock > 0 ? Math.min(100, Math.round((p.stock / p.minStock) * 100)) : (p.stock > 0 ? 100 : 0)
                  const isOut = p.stock === 0
                  return (
                    <div key={p.id} className="px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[12px] font-semibold text-gray-800 truncate max-w-[150px]">{p.name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOut ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                          {p.stock} / {p.minStock}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div className={`h-full rounded-full ${isOut ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${pctVal}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Best Sellers + Stock Summary Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Best Sellers */}
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#FF5F03]" />
              <h3 className="text-sm font-semibold text-gray-900">Produk Terlaris</h3>
            </div>
            <Link href="/reports" className="text-[11px] font-medium text-gray-400 hover:text-gray-600">Lihat Semua</Link>
          </div>
          <div className="p-4">
            {bestSellers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-14 h-14 rounded-full bg-[#FF5F03]/10 flex items-center justify-center mb-3">
                  <Package className="w-6 h-6 text-[#FF5F03]/60" />
                </div>
                <p className="text-[13px] font-medium text-gray-700">Belum ada data penjualan</p>
                <p className="text-[11px] text-gray-400 mt-1 mb-4">Catat transaksi keluar untuk melihat<br />produk terlaris kamu.</p>
                <Link href="/transactions/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#072C2C] hover:bg-[#0a3d3d] text-white text-[12px] font-semibold transition active:scale-[0.98]">
                  <Plus className="w-3.5 h-3.5" /> Catat Penjualan
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {bestSellers.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-[#FF5F03] text-white' : 'bg-[#FF5F03]/10 text-[#FF5F03]'}`}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{p.sold} terjual</p>
                    </div>
                    {i < 3 && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FF5F03]/10 text-[#FF5F03] shrink-0">Best Seller</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ringkasan Stok donut */}
        <StockDonut products={products} />
      </div>

      {/* Row 4: Pergerakan Stok (full width) */}
      <DashboardCharts products={products} transactions={transactions} />
    </div>
  )
}

function Greeting({ transactions, totalValue }: { transactions: Transaction[]; totalValue: number }) {
  const { user } = useAuth()
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  const wibHour = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).getHours()
  const greeting = wibHour < 12 ? 'Selamat pagi' : wibHour < 17 ? 'Selamat siang' : wibHour < 20 ? 'Selamat sore' : 'Selamat malam'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTx = transactions.filter(t => new Date(t.createdAt) >= today)

  const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          {greeting}, {userName} <span className="inline-block animate-wave">📦</span>
        </h1>
        <p className="text-gray-500 text-[13px] mt-1">
          {todayTx.length} transaksi hari ini · Nilai inventory saat ini {formatRp(totalValue)}
        </p>
      </div>
      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-[13px] font-medium text-gray-600">
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
        {dateStr}
      </div>
    </div>
  )
}

function HealthCard({ score, className = '' }: { score: number; className?: string }) {
  const status = score >= 80
    ? { label: 'Inventory Sehat', color: 'text-emerald-600', dot: 'bg-emerald-500', bar: 'bg-emerald-500', iconBg: 'bg-emerald-50 text-emerald-500', msg: 'Bagus! Pertahankan kondisi inventory kamu.' }
    : score >= 50
      ? { label: 'Perlu Perhatian', color: 'text-amber-600', dot: 'bg-amber-500', bar: 'bg-amber-500', iconBg: 'bg-amber-50 text-amber-500', msg: 'Beberapa produk perlu direstock segera.' }
      : { label: 'Kondisi Kritis', color: 'text-red-600', dot: 'bg-red-500', bar: 'bg-red-500', iconBg: 'bg-red-50 text-red-500', msg: 'Banyak produk kehabisan stok, segera tindak lanjuti.' }

  return (
    <div className={`rounded-2xl bg-white border border-gray-200 p-5 flex flex-col ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-gray-900">Kesehatan Inventory</h3>
          <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
        </div>
        <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${status.iconBg}`}>
          <Activity className="w-5 h-5" />
        </span>
      </div>
      <div className="mt-3 flex items-end gap-1">
        <span className={`text-4xl font-bold ${status.color} leading-none`}>{score}</span>
        <span className="text-gray-400 text-lg font-semibold mb-0.5">/100</span>
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <span className={`w-2 h-2 rounded-full ${status.dot}`} />
        <span className={`text-[12px] font-semibold ${status.color}`}>{status.label}</span>
      </div>
      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden mt-3">
        <div className={`h-full rounded-full transition-all duration-700 ${status.bar}`} style={{ width: `${score}%` }} />
      </div>
      <p className="text-[12px] text-gray-500 mt-3">{status.msg}</p>
    </div>
  )
}

function QuickAction({ className = '' }: { className?: string }) {
  const actions = [
    { label: 'Tambah Produk', href: '/products/new', icon: <Plus className="w-5 h-5" />, tint: 'bg-[#072C2C]/10 text-[#072C2C] group-hover:bg-[#072C2C] group-hover:text-white' },
    { label: 'Stok Masuk', href: '/transactions/new', icon: <ArrowDownToLine className="w-5 h-5" />, tint: 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white' },
    { label: 'Stok Keluar', href: '/transactions/new', icon: <ArrowUpFromLine className="w-5 h-5" />, tint: 'bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white' },
    { label: 'Generate Insight', href: '/ai-chat', icon: <Sparkles className="w-5 h-5" />, tint: 'bg-[#FF5F03]/10 text-[#FF5F03] group-hover:bg-[#FF5F03] group-hover:text-white' },
  ]
  return (
    <div className={`rounded-2xl bg-white border border-gray-200 p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Action</h3>
      <div className="grid grid-cols-4 gap-2">
        {actions.map(a => (
          <Link key={a.label} href={a.href} className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all text-center">
            <span className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${a.tint}`}>{a.icon}</span>
            <span className="text-[10px] font-medium text-gray-600 leading-tight">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function useCountUp(end: number, duration: number = 1000) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (end === 0) { setCount(0); return }
    const startTime = performance.now()
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * end))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [end, duration])
  return count
}

function AnimatedValue({ value }: { value: string }) {
  const isRupiah = value.includes('Rp')
  const num = parseInt(value.replace(/[^\d]/g, '')) || 0
  const animated = useCountUp(num)
  if (isRupiah && num > 0) return <>{formatRp(animated)}</>
  if (/^\d+$/.test(value)) return <>{animated}</>
  return <>{value}</>
}

function StatCard({ border, label, value, trend, trendUp }: { border: string; label: string; value: string; trend: string; trendUp: boolean }) {
  return (
    <div className={`rounded-lg p-3 bg-white border border-gray-200 border-l-4 ${border} hover:shadow-sm transition-all`}>
      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900">
        <AnimatedValue value={value} />
      </p>
      <p className={`text-[10px] mt-0.5 flex items-center gap-0.5 ${trendUp ? 'text-emerald-500' : 'text-amber-500'}`}>
        {trendUp && <span>↑</span>}{trend}
      </p>
    </div>
  )
}
