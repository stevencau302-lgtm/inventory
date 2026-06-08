'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Product, Transaction, Category, formatRp, fetchProducts, fetchTransactions, fetchCategories } from '@/lib/store'
import { useAuth } from '@/components/AuthProvider'
import dynamic from 'next/dynamic'
import { Plus, ArrowDownToLine, ArrowUpFromLine, Package, AlertTriangle, Activity, ArrowRight, CheckCircle2, ArrowLeftRight, Trophy, ChevronRight, DollarSign, XCircle, Tag, Skull, PieChart, TrendingUp, TrendingDown } from 'lucide-react'

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
  const [categories, setCategories] = useState<Category[]>([])
  const [mounted, setMounted] = useState(false)
  const [txPage, setTxPage] = useState(1)
  const [rangeDays, setRangeDays] = useState(7)
  const txPerPage = 4

  useEffect(() => {
    async function loadData() {
      const p = await fetchProducts()
      setProducts(p)
      const tx = await fetchTransactions()
      setTransactions(tx)
      const c = await fetchCategories()
      setCategories(c)
      setMounted(true)
    }
    loadData()
  }, [])

  if (!mounted) return <DashboardSkeleton />

  const totalProducts = products.length
  const totalItems = products.reduce((s, p) => s + p.stock, 0)
  const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0)
  const avgPrice = products.length ? products.reduce((s, p) => s + p.price, 0) / products.length : 0
  const inStockCount = products.filter(p => p.stock > 0).length
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock)
  const outStock = products.filter(p => p.stock === 0)

  // Kategori teratas berdasarkan nilai stok
  const topCategory = categories.map(c => ({
    name: c.name,
    value: products.filter(p => p.category === c.name).reduce((s, p) => s + p.price * p.stock, 0),
  })).sort((a, b) => b.value - a.value)
  const topCategoryName = topCategory.length > 0 && topCategory[0].value > 0 ? topCategory[0].name : null

  // Dead stock: produk tanpa transaksi keluar & berumur >= 30 hari
  const deadStock = (() => {
    const now = Date.now()
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
    const outProductIds = new Set(transactions.filter(t => t.type === 'out').map(t => t.productId))
    return products.filter(p => {
      if (outProductIds.has(p.id)) return false
      return (now - new Date(p.createdAt).getTime()) >= thirtyDaysMs
    })
  })()
  const deadStockValue = deadStock.reduce((s, p) => s + p.price * p.stock, 0)

  const priceRange = products.length === 0
    ? null
    : { min: Math.min(...products.map(p => p.price)), max: Math.max(...products.map(p => p.price)) }

  // Arus nilai dalam rentang waktu terpilih
  const rangeLabel = `${rangeDays} Hari Terakhir`
  const rangeStartMs = Date.now() - rangeDays * 24 * 60 * 60 * 1000
  const rangedTx = transactions.filter(t => new Date(t.createdAt).getTime() >= rangeStartMs)
  const valueTrend = (() => {
    const inValue = rangedTx.filter(t => t.type === 'in').reduce((s, t) => {
      const p = products.find(pr => pr.id === t.productId); return s + (p ? p.price * t.quantity : 0)
    }, 0)
    const outValue = rangedTx.filter(t => t.type === 'out').reduce((s, t) => {
      const p = products.find(pr => pr.id === t.productId); return s + (p ? p.price * t.quantity : 0)
    }, 0)
    return inValue - outValue
  })()

  const restockProducts = [...products].filter(p => p.stock <= p.minStock).sort((a, b) => a.stock - b.stock)

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
      <Greeting transactions={transactions} totalValue={totalValue} rangeDays={rangeDays} onRangeChange={setRangeDays} />

      {/* ===== STAT CARDS (bento grid) — sama seperti Analisa ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Big card - Total Nilai */}
        <div className="col-span-2 lg:col-span-2 lg:row-span-2 relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-[#0F4C4C] to-[#072C2C] text-white shadow-lg shadow-[#072C2C]/20">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="relative flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/70">Total Nilai Inventory</p>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white/80" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-extrabold mb-3">{formatRp(totalValue)}</p>
            <div className="flex flex-wrap items-center gap-2 mb-auto">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${valueTrend >= 0 ? 'bg-emerald-400/20 text-emerald-50' : 'bg-red-400/20 text-red-50'}`}>
                {valueTrend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{valueTrend >= 0 ? '+' : ''}{formatRp(Math.abs(valueTrend))}</span>
              </div>
              <span className="text-[11px] text-white/50">arus nilai {rangeLabel.toLowerCase()}</span>
            </div>
            {/* Mini breakdown */}
            <div className="mt-4 pt-4 border-t border-white/15 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">Produk Aktif</p>
                <p className="text-lg font-bold">{inStockCount}<span className="text-xs font-normal text-white/60">/{products.length}</span></p>
              </div>
              <div>
                <p className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">Kategori Teratas</p>
                <p className="text-lg font-bold truncate">{topCategoryName || '—'}</p>
              </div>
            </div>
          </div>
        </div>
        {/* Total Unit */}
        <div className="rounded-2xl p-4 bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Total Unit</p>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Package className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalItems.toLocaleString()}</p>
          <p className="text-[11px] mt-1 flex items-center gap-1">
            {outStock.length > 0 ? (
              <span className="text-red-500 font-medium">{outStock.length} produk habis</span>
            ) : lowStock.length > 0 ? (
              <span className="text-amber-500 font-medium">{lowStock.length} stok menipis</span>
            ) : (
              <span className="text-emerald-500 font-medium">semua stok aman</span>
            )}
          </p>
        </div>
        {/* Total Kategori */}
        <div className="rounded-2xl p-4 bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-[#072C2C]/20 transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Total Kategori</p>
            <div className="w-8 h-8 rounded-lg bg-[#072C2C]/10 flex items-center justify-center">
              <Tag className="w-4 h-4 text-[#072C2C]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
          <p className="text-[11px] text-gray-400 mt-1 truncate">
            {topCategoryName ? <>terbesar: <span className="text-gray-600 font-medium">{topCategoryName}</span></> : 'belum ada nilai'}
          </p>
        </div>
        {/* Dead Stock */}
        <div className="rounded-2xl p-4 bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Dead Stock</p>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Skull className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{deadStock.length}</p>
          <p className="text-[11px] mt-1">
            {deadStock.length > 0 ? (
              <span className="text-amber-500 font-medium">{formatRp(deadStockValue)} tertahan</span>
            ) : (
              <span className="text-emerald-500 font-medium">tidak ada 🎉</span>
            )}
          </p>
        </div>
        {/* Rata-rata Harga */}
        <div className="rounded-2xl p-4 bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Rata-rata Harga</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <PieChart className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatRp(avgPrice)}</p>
          <p className="text-[11px] text-gray-400 mt-1 truncate">
            {priceRange ? <>rentang {formatRp(priceRange.min)} – {formatRp(priceRange.max)}</> : 'belum ada produk'}
          </p>
        </div>
      </div>

      {/* Restock status banner */}
      {restockProducts.length === 0 ? (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-50/40 border border-emerald-100 px-5 py-4 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-emerald-800">Mantap! Tidak ada produk yang perlu direstock saat ini.</p>
              <p className="text-[11px] text-emerald-600/80 mt-0.5">Semua produk memiliki stok yang aman.</p>
            </div>
          </div>
          <Link href="/products" className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/70 text-[12px] font-semibold text-emerald-700 hover:bg-white border border-emerald-100 transition whitespace-nowrap">
            Lihat Semua Stok <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-amber-50/40 border border-amber-100 px-5 py-4 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-amber-800">{restockProducts.length} produk perlu direstock.</p>
              <p className="text-[11px] text-amber-600/80 mt-0.5">Segera lakukan pengadaan agar stok tidak habis.</p>
            </div>
          </div>
          <Link href="/products" className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/70 text-[12px] font-semibold text-amber-700 hover:bg-white border border-amber-100 transition whitespace-nowrap">
            Lihat Semua Stok <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Row 2: Recent Transactions + Restock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Transactions */}
        <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
          <SectionHeader icon={<ArrowLeftRight className="w-4 h-4" />} tint="bg-[#072C2C]/10 text-[#072C2C]" title="Transaksi Terbaru" href="/reports" />
          <div className="p-4">
            {paginatedTx.length === 0 ? (
              <EmptyState icon={<ArrowLeftRight className="w-6 h-6" />} title="Belum ada transaksi" subtitle="Transaksi yang kamu catat akan muncul di sini." />
            ) : (
              <div className="space-y-2">
                {paginatedTx.map(tx => (
                  <div key={tx.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50/70 border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition">
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
                  <button onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txPage === 1} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:bg-[#072C2C] hover:text-white hover:border-[#072C2C] disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-200 transition">Prev</button>
                  <span className="text-xs text-gray-500">{txPage} / {totalTxPages}</span>
                  <button onClick={() => setTxPage(p => Math.min(totalTxPages, p + 1))} disabled={txPage === totalTxPages} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:bg-[#072C2C] hover:text-white hover:border-[#072C2C] disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-200 transition">Next</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Perlu Restock */}
        <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
          <SectionHeader icon={<AlertTriangle className="w-4 h-4" />} tint="bg-amber-50 text-amber-500" title="Perlu Restock" href="/products" />
          <div className="p-4">
            {restockProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500" />
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
                    <div key={p.id} className="px-3 py-2.5 rounded-xl bg-gray-50/70 border border-gray-100 hover:border-gray-200 transition">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[12px] font-semibold text-gray-800 truncate max-w-[150px]">{p.name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOut ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                          {p.stock} / {p.minStock}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${isOut ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${pctVal}%` }} />
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
        <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
          <SectionHeader icon={<Trophy className="w-4 h-4" />} tint="bg-[#FF5F03]/10 text-[#FF5F03]" title="Produk Terlaris" href="/reports" />
          <div className="p-4">
            {bestSellers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#FF5F03]/10 flex items-center justify-center mb-3">
                  <Trophy className="w-6 h-6 text-[#FF5F03]/60" />
                </div>
                <p className="text-[13px] font-medium text-gray-700">Belum ada data penjualan</p>
                <p className="text-[11px] text-gray-400 mt-1 mb-4">Catat transaksi keluar untuk melihat<br />produk terlaris kamu.</p>
                <Link href="/transactions/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#072C2C] hover:bg-[#0a3d3d] text-white text-[12px] font-semibold transition active:scale-[0.98] shadow-sm">
                  <Plus className="w-3.5 h-3.5" /> Catat Penjualan
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {bestSellers.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50/70 border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition">
                    <RankBadge rank={i} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{p.sold} terjual</p>
                    </div>
                    {i === 0 && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-600 shrink-0">Terlaris</span>}
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
      <DashboardCharts products={products} transactions={transactions} rangeDays={rangeDays} />
    </div>
  )
}

function SectionHeader({ icon, tint, title, href }: { icon: React.ReactNode; tint: string; title: string; href: string }) {
  return (
    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${tint}`}>{icon}</span>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <Link href={href} className="group inline-flex items-center gap-0.5 text-[11px] font-medium text-gray-400 hover:text-[#072C2C] transition">
        Lihat Semua <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  )
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3 text-gray-300">{icon}</div>
      <p className="text-[13px] font-medium text-gray-700">{title}</p>
      <p className="text-[11px] text-gray-400 mt-1">{subtitle}</p>
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  const styles = [
    'bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-sm shadow-amber-500/30',
    'bg-gradient-to-br from-gray-200 to-gray-400 text-white',
    'bg-gradient-to-br from-orange-300 to-orange-500 text-white',
  ][rank] || 'bg-[#FF5F03]/10 text-[#FF5F03]'
  return <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${styles}`}>{rank + 1}</div>
}

function Greeting({ transactions, totalValue, rangeDays, onRangeChange }: { transactions: Transaction[]; totalValue: number; rangeDays: number; onRangeChange: (d: number) => void }) {
  const { user } = useAuth()
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  const wibHour = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).getHours()
  const greeting = wibHour < 12 ? 'Selamat pagi' : wibHour < 17 ? 'Selamat siang' : wibHour < 20 ? 'Selamat sore' : 'Selamat malam'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTx = transactions.filter(t => new Date(t.createdAt) >= today)

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
      <div className="relative">
        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
        <select
          value={rangeDays}
          onChange={e => onRangeChange(Number(e.target.value))}
          aria-label="Filter rentang waktu"
          className="appearance-none pl-9 pr-9 py-2 rounded-xl bg-white border border-gray-200 text-[13px] font-medium text-gray-600 cursor-pointer outline-none hover:bg-gray-50 focus:border-[#072C2C] transition shadow-sm"
        >
          <option value={7}>7 Hari Terakhir</option>
          <option value={14}>14 Hari Terakhir</option>
          <option value={30}>30 Hari Terakhir</option>
          <option value={90}>90 Hari Terakhir</option>
        </select>
        <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
      </div>
    </div>
  )
}

function HealthCard({ score, className = '' }: { score: number; className?: string }) {
  const status = score >= 80
    ? { label: 'Inventory Sehat', badge: 'bg-emerald-400/20 text-emerald-50', dot: 'bg-emerald-300', bar: 'from-emerald-300 to-emerald-400', msg: 'Bagus! Pertahankan kondisi inventory kamu.' }
    : score >= 50
      ? { label: 'Perlu Perhatian', badge: 'bg-amber-400/20 text-amber-50', dot: 'bg-amber-300', bar: 'from-amber-300 to-amber-400', msg: 'Beberapa produk perlu direstock segera.' }
      : { label: 'Kondisi Kritis', badge: 'bg-red-400/20 text-red-50', dot: 'bg-red-300', bar: 'from-red-300 to-red-400', msg: 'Banyak produk kehabisan stok, segera tindak lanjuti.' }

  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-[#0F4C4C] to-[#072C2C] text-white shadow-lg shadow-[#072C2C]/20 ${className}`}>
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
      <div className="relative flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-white/70">Kesehatan Inventory</p>
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white/80" />
          </div>
        </div>
        <div className="flex items-end gap-1 mb-3">
          <span className="text-3xl sm:text-4xl font-extrabold leading-none">{score}</span>
          <span className="text-white/50 text-lg font-semibold mb-0.5">/100</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-auto">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${status.badge}`}>
            <span className={`w-2 h-2 rounded-full ${status.dot}`} />
            <span>{status.label}</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/15">
          <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${status.bar}`} style={{ width: `${score}%` }} />
          </div>
          <p className="text-[12px] text-white/60 mt-3">{status.msg}</p>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, icon, iconTint, sub, subColor }: { label: string; value: string; icon: React.ReactNode; iconTint: string; sub: string; subColor: string }) {
  return (
    <div className="rounded-2xl p-4 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconTint}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
      <p className={`text-[11px] mt-1 font-medium ${subColor}`}>{sub}</p>
    </div>
  )
}

