'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  Product, Transaction, formatRp,
  fetchProducts, fetchTransactions,
} from '@/lib/store'
import { CardListSkeleton } from '@/components/PageSkeleton'
import {
  ArrowLeft, TrendingUp, AlertTriangle, DollarSign,
  Package, Calendar, ShoppingBag, RotateCcw,
} from 'lucide-react'

const COLORS = ['#D97706', '#16A34A', '#0EA5E9', '#8B5CF6', '#DC2626', '#F59E0B']

function isReturn(t: Transaction) {
  return t.note?.toUpperCase().startsWith('[RETURN]')
}

// Ambil "Alasan: X" dari note format: [RETURN] Kondisi: A | Alasan: B | catatan
function parseAlasan(note: string): string {
  const match = note?.match(/Alasan:\s*([^|]+)/i)
  return match ? match[1].trim() : 'Lainnya'
}

export default function AnalisisReturPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    Promise.all([fetchProducts(), fetchTransactions()]).then(([p, tx]) => {
      setProducts(p)
      setTransactions(tx)
      setMounted(true)
    })
  }, [])

  const data = useMemo(() => {
    const priceOf = (id: string) => products.find(p => p.id === id)?.price ?? 0
    const returns = transactions.filter(isReturn)

    const totalLostRevenue = returns.reduce((sum, t) => sum + priceOf(t.productId) * t.quantity, 0)
    const totalReturnCount = returns.length

    // Tren 12 bulan terakhir
    const trendMap = new Map<string, { name: string; count: number; value: number }>()
    const months: string[] = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
      months.push(key)
      trendMap.set(key, { name: key, count: 0, value: 0 })
    }
    returns.forEach(t => {
      const d = new Date(t.createdAt)
      const key = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
      const entry = trendMap.get(key)
      if (entry) {
        entry.count += 1
        entry.value += priceOf(t.productId) * t.quantity
      }
    })
    const trendData = months.map(m => trendMap.get(m)!)

    // Top 5 produk paling sering diretur (by qty)
    const productMap = new Map<string, { name: string; count: number; lost: number }>()
    returns.forEach(t => {
      const name = t.productName || 'Tidak diketahui'
      const cur = productMap.get(name) || { name, count: 0, lost: 0 }
      cur.count += t.quantity || 1
      cur.lost += priceOf(t.productId) * t.quantity
      productMap.set(name, cur)
    })
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Distribusi alasan retur
    const reasonMap = new Map<string, number>()
    returns.forEach(t => {
      const alasan = parseAlasan(t.note)
      reasonMap.set(alasan, (reasonMap.get(alasan) || 0) + 1)
    })
    const reasonData = Array.from(reasonMap.entries()).map(([name, value]) => ({ name, value }))

    const topReturnCount = topProducts.reduce((max, p) => Math.max(max, p.count), 0)

    return { totalLostRevenue, totalReturnCount, trendData, topProducts, reasonData, topReturnCount }
  }, [transactions, products])

  if (!mounted) return <CardListSkeleton />

  const hasData = data.totalReturnCount > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/returns"
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Analisis Retur</h1>
            <p className="text-sm text-gray-500">Insight mendalam mengenai pengembalian barang</p>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-2xl border border-gray-200">
          <div className="w-16 h-16 rounded-2xl bg-[#D97706]/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-[#D97706]" />
          </div>
          <p className="text-lg font-semibold text-gray-700 mb-1">Belum ada data retur</p>
          <p className="text-sm text-gray-500 max-w-xs mb-5">
            Catat retur barang terlebih dahulu untuk melihat analisisnya di sini.
          </p>
          <Link
            href="/returns"
            className="px-5 py-2.5 rounded-xl bg-[#D97706] text-white text-sm font-bold shadow-lg shadow-[#D97706]/20 hover:bg-[#B45309] transition active:scale-95"
          >
            Ke Halaman Retur
          </Link>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard
              label="Total Retur"
              icon={<AlertTriangle className="w-16 h-16 text-[#DC2626]" />}
              value={<><span className="text-3xl font-bold text-gray-900">{data.totalReturnCount}</span> <span className="text-sm text-gray-500">transaksi</span></>}
            />
            <SummaryCard
              label="Potensi Kerugian (Omset)"
              icon={<DollarSign className="w-16 h-16 text-[#D97706]" />}
              value={<span className="text-2xl lg:text-3xl font-bold text-[#D97706]">{formatRp(data.totalLostRevenue)}</span>}
            />
            <SummaryCard
              label="Rata-rata Nilai Retur"
              icon={<TrendingUp className="w-16 h-16 text-[#0EA5E9]" />}
              value={<span className="text-2xl lg:text-3xl font-bold text-[#0EA5E9]">{formatRp(data.totalReturnCount > 0 ? Math.round(data.totalLostRevenue / data.totalReturnCount) : 0)}</span>}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trend */}
            <div className="bg-white p-5 lg:p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-5">
                <Calendar className="w-[18px] h-[18px] text-[#0EA5E9]" />
                Tren Retur (12 Bulan Terakhir)
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRetur" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D97706" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }}
                      formatter={(value: number) => [`${value} retur`, 'Jumlah']}
                    />
                    <Area type="monotone" dataKey="count" stroke="#D97706" strokeWidth={3} fillOpacity={1} fill="url(#colorRetur)" name="Jumlah Retur" dot={{ fill: '#D97706', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#D97706', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Distribusi Alasan */}
            <div className="bg-white p-5 lg:p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-5">
                <ShoppingBag className="w-[18px] h-[18px] text-[#8B5CF6]" />
                Distribusi Alasan Retur
              </h3>
              <div className="h-[300px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.reasonData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {data.reasonData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }}
                      formatter={(value: number, name: string) => [`${value} kasus`, name]}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Produk */}
          <div className="bg-white p-5 lg:p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-5">
              <Package className="w-[18px] h-[18px] text-[#D97706]" />
              5 Produk Paling Sering Diretur
            </h3>
            <div className="space-y-3">
              {data.topProducts.length === 0 ? (
                <div className="text-center py-10 text-gray-500">Belum ada data retur produk</div>
              ) : data.topProducts.map((product, index) => (
                <div key={index} className="flex items-center p-3.5 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-base font-bold text-gray-400 mr-4 shrink-0">
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h4>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
                      <div
                        className="bg-[#D97706] h-2 rounded-full transition-all"
                        style={{ width: `${data.topReturnCount > 0 ? (product.count / data.topReturnCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <div className="font-bold text-gray-900 text-sm">{product.count} unit</div>
                    <div className="text-xs text-gray-500">{formatRp(product.lost)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function SummaryCard({ label, icon, value }: { label: string; icon: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-3 opacity-[0.07] group-hover:opacity-[0.14] transition-opacity">
        {icon}
      </div>
      <p className="text-sm font-medium text-gray-500 relative z-10">{label}</p>
      <div className="mt-2 flex items-baseline gap-2 relative z-10">{value}</div>
    </div>
  )
}
