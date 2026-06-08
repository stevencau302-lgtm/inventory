'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Product, Transaction } from '@/lib/store'
import { useState } from 'react'
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

// ─── Ringkasan Stok (Donut) ───
export function StockDonut({ products }: { products: Product[] }) {
  const total = products.length
  const aman = products.filter(p => p.stock > p.minStock).length
  const menipis = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length
  const habis = products.filter(p => p.stock === 0).length

  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0

  const data = [
    { name: 'Stok Aman', value: aman, color: '#16A34A' },
    { name: 'Stok Menipis', value: menipis, color: '#F59E0B' },
    { name: 'Stok Habis', value: habis, color: '#DC2626' },
  ].filter(d => d.value > 0)

  const legend = [
    { name: 'Stok Aman', value: aman, color: '#16A34A' },
    { name: 'Stok Menipis', value: menipis, color: '#F59E0B' },
    { name: 'Stok Habis', value: habis, color: '#DC2626' },
  ]

  return (
    <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Ringkasan Stok</h3>
      </div>
      <div className="p-5 flex items-center gap-6">
        <div className="relative w-[150px] h-[150px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.length > 0 ? data : [{ name: 'Kosong', value: 1, color: '#E5E7EB' }]}
                dataKey="value"
                innerRadius={52}
                outerRadius={72}
                paddingAngle={data.length > 1 ? 3 : 0}
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                {(data.length > 0 ? data : [{ color: '#E5E7EB' }]).map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-gray-900 leading-none">{total}</span>
            <span className="text-[10px] text-gray-500 mt-1">Total Produk</span>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          {legend.map(l => (
            <div key={l.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: l.color }} />
                <span className="text-[13px] text-gray-600">{l.name}</span>
              </div>
              <span className="text-[13px] font-semibold text-gray-900">
                {l.value} <span className="text-gray-400 font-normal">({pct(l.value)}%)</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Pergerakan Stok (Area Chart, full width) ───
export default function DashboardCharts({ transactions }: Props) {
  const [range, setRange] = useState<7 | 14 | 30>(7)

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
  const now = new Date()
  const areaData = (() => {
    const result = []
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dayStr = d.toISOString().split('T')[0]
      const masuk = transactions.filter(t => t.type === 'in' && t.createdAt.startsWith(dayStr)).reduce((s, t) => s + t.quantity, 0)
      const keluar = transactions.filter(t => t.type === 'out' && t.createdAt.startsWith(dayStr)).reduce((s, t) => s + t.quantity, 0)
      const label = range > 7 ? `${d.getDate()}/${d.getMonth() + 1}` : dayNames[d.getDay()]
      result.push({ name: label, masuk, keluar })
    }
    return result
  })()

  const hasMovementData = areaData.some(d => d.masuk > 0 || d.keluar > 0)
  const rangeLabel = range === 7 ? '7 Hari Terakhir' : range === 14 ? '14 Hari Terakhir' : '30 Hari Terakhir'

  return (
    <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
      <div className="px-5 pt-5 pb-2 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Pergerakan Stok</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Perubahan stok terakhir (barang masuk & keluar)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 mr-1">
            <span className="flex items-center gap-1.5 text-[11px] text-gray-500"><span className="w-2 h-2 rounded-full bg-[#16A34A]" />Masuk</span>
            <span className="flex items-center gap-1.5 text-[11px] text-gray-500"><span className="w-2 h-2 rounded-full bg-[#FF5F03]" />Keluar</span>
          </div>
          <select
            value={range}
            onChange={(e) => setRange(Number(e.target.value) as 7 | 14 | 30)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-[11px] font-medium text-gray-600 bg-white hover:bg-gray-50 transition cursor-pointer outline-none focus:border-[#072C2C]"
            aria-label="Rentang waktu"
          >
            <option value={7}>7 Hari Terakhir</option>
            <option value={14}>14 Hari Terakhir</option>
            <option value={30}>30 Hari Terakhir</option>
          </select>
        </div>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
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
  )
}
