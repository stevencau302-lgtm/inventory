'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Product, Transaction } from '@/lib/store'
import Link from 'next/link'

interface Props {
  products: Product[]
  transactions: Transaction[]
}

function EmptyStateSales() {
  return (
    <div className="relative flex flex-col items-center justify-center h-[280px] px-6">
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#072C2C]/10 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-[#072C2C]" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <h4 className="text-[15px] font-semibold text-gray-800 mb-1.5">Belum ada data pergerakan stok</h4>
        <p className="text-[12px] text-gray-500 leading-relaxed max-w-[240px] mb-5">
          Grafik akan muncul setelah transaksi barang masuk atau keluar dicatat.
        </p>
        <Link href="/transactions/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#072C2C] hover:bg-[#0a3d3d] text-white text-[12px] font-semibold shadow-lg shadow-[#072C2C]/20 transition-all duration-200 active:scale-[0.98]">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Input Transaksi
        </Link>
      </div>
    </div>
  )
}

export default function DashboardCharts({ products, transactions }: Props) {
  // Products that need restock (sorted by stock level ascending)
  const restockProducts = [...products]
    .filter(p => p.stock <= p.minStock)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6)

  // Area chart: daily stock movement (masuk/keluar) last 7 days
  const areaData = (() => {
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    const now = new Date()
    const result = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dayStr = d.toISOString().split('T')[0]
      const masuk = transactions.filter(t => t.type === 'in' && t.createdAt.startsWith(dayStr)).reduce((s, t) => s + t.quantity, 0)
      const keluar = transactions.filter(t => t.type === 'out' && t.createdAt.startsWith(dayStr)).reduce((s, t) => s + t.quantity, 0)
      result.push({ name: dayNames[d.getDay()], masuk, keluar })
    }
    return result
  })()

  const hasMovementData = areaData.some(d => d.masuk > 0 || d.keluar > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Area Chart - Pergerakan Stok (2/3 width) */}
      <div className="lg:col-span-2 rounded-xl bg-white border border-gray-200 overflow-hidden">
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Pergerakan Stok</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">7 hari terakhir · barang masuk & keluar</p>
          </div>
          <Link href="/reports" className="px-3 py-1.5 rounded-lg border border-gray-200 text-[11px] font-medium text-gray-500 hover:bg-gray-50 transition flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
            Lihat Detail
          </Link>
        </div>
        <div className="px-2 pb-4">
          {hasMovementData ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData} margin={{ top: 15, right: 20, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorMasuk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorKeluar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF5F03" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF5F03" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827', fontSize: '12px' }}
                    labelStyle={{ color: '#6b7280' }}
                    formatter={(value: number, name: string) => [`${value} unit`, name === 'masuk' ? 'Masuk' : 'Keluar']}
                  />
                  <Area type="monotone" dataKey="masuk" stroke="#16A34A" strokeWidth={2.5} fill="url(#colorMasuk)" dot={{ fill: '#16A34A', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#16A34A', stroke: '#fff', strokeWidth: 2 }} />
                  <Area type="monotone" dataKey="keluar" stroke="#FF5F03" strokeWidth={2.5} fill="url(#colorKeluar)" dot={{ fill: '#FF5F03', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#FF5F03', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyStateSales />
          )}
        </div>
      </div>

      {/* Perlu Restock - produk stok terendah */}
      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Perlu Restock</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Stok paling rendah</p>
          </div>
          <Link href="/products" className="px-2.5 py-1 rounded-lg border border-gray-200 text-[10px] font-medium text-gray-500 hover:bg-gray-50 transition">
            Semua
          </Link>
        </div>
        <div className="px-4 pb-4">
          {restockProducts.length > 0 ? (
            <div className="space-y-2 mt-2">
              {restockProducts.map(p => {
                const percentage = p.minStock > 0 ? Math.min(100, Math.round((p.stock / p.minStock) * 100)) : (p.stock > 0 ? 100 : 0)
                const isOut = p.stock === 0
                const isLow = p.stock > 0 && p.stock <= p.minStock
                return (
                  <div key={p.id} className="px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[12px] font-semibold text-gray-800 truncate max-w-[120px]">{p.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isOut ? 'bg-red-50 text-red-600' : isLow ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {p.stock} / {p.minStock}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[260px] text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-[13px] font-medium text-gray-700">Stok aman semua</p>
              <p className="text-[11px] text-gray-400 mt-1">Tidak ada produk yang perlu restock</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
