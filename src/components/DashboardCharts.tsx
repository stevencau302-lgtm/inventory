'use client'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Product, Transaction } from '@/lib/store'
import Link from 'next/link'

interface Props {
  products: Product[]
  transactions: Transaction[]
}

// Animated floating dots SVG for empty state background
function FloatingDots() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
      <svg className="w-full h-full" viewBox="0 0 400 280">
        <circle cx="50" cy="60" r="3" fill="#a78bfa">
          <animate attributeName="cy" values="60;45;60" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="120" cy="180" r="2" fill="#818cf8">
          <animate attributeName="cy" values="180;165;180" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="300" cy="90" r="2.5" fill="#c084fc">
          <animate attributeName="cy" values="90;75;90" dur="3.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;1;0.5" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="350" cy="200" r="2" fill="#67e8f9">
          <animate attributeName="cy" values="200;185;200" dur="2.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="200" cy="140" r="3.5" fill="#a78bfa">
          <animate attributeName="cy" values="140;125;140" dur="3.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="3.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="80" cy="230" r="1.5" fill="#22d3ee">
          <animate attributeName="cy" values="230;218;230" dur="4.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="4.2s" repeatCount="indefinite" />
        </circle>
        {/* Subtle pulse ring */}
        <circle cx="200" cy="140" r="20" fill="none" stroke="#a78bfa" strokeWidth="0.5">
          <animate attributeName="r" values="20;35;20" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="4s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  )
}

// Ghost chart lines for premium empty state background
function GhostChart() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.08]">
      <svg className="w-full h-full" viewBox="0 0 400 280" preserveAspectRatio="none">
        {/* Ghost bar chart */}
        <rect x="60" y="160" width="35" height="80" rx="4" fill="#a78bfa" />
        <rect x="115" y="120" width="35" height="120" rx="4" fill="#a78bfa" />
        <rect x="170" y="90" width="35" height="150" rx="4" fill="#a78bfa" />
        <rect x="225" y="140" width="35" height="100" rx="4" fill="#a78bfa" />
        <rect x="280" y="170" width="35" height="70" rx="4" fill="#a78bfa" />
      </svg>
    </div>
  )
}

function GhostLineChart() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.08]">
      <svg className="w-full h-full" viewBox="0 0 400 280" preserveAspectRatio="none">
        <path
          d="M 40 200 C 80 180, 120 140, 160 150 S 240 100, 280 120 S 340 90, 380 110"
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M 40 220 C 80 210, 120 190, 160 200 S 240 160, 280 180 S 340 150, 380 160"
          fill="none"
          stroke="#f97316"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

function EmptyStateSales() {
  return (
    <div className="relative flex flex-col items-center justify-center h-[280px] px-6">
      <GhostChart />
      <FloatingDots />
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/20 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        {/* Text */}
        <h4 className="text-[15px] font-semibold text-zinc-200 mb-1.5">Belum ada data penjualan</h4>
        <p className="text-[12px] text-zinc-500 leading-relaxed max-w-[240px] mb-5">
          Produk terlaris akan muncul otomatis setelah transaksi keluar pertama dicatat.
        </p>
        {/* CTA */}
        <Link href="/transactions" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-[12px] font-semibold shadow-lg shadow-violet-500/20 transition-all duration-200 hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98]">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Input Penjualan
        </Link>
      </div>
    </div>
  )
}

function EmptyStateTrend() {
  return (
    <div className="relative flex flex-col items-center justify-center h-[280px] px-6">
      <GhostLineChart />
      <FloatingDots />
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
          </svg>
        </div>
        {/* Text */}
        <h4 className="text-[15px] font-semibold text-zinc-200 mb-1.5">Tren transaksi belum tersedia</h4>
        <p className="text-[12px] text-zinc-500 leading-relaxed max-w-[260px] mb-5">
          Grafik tren akan aktif setelah sistem mendeteksi aktivitas masuk & keluar barang.
        </p>
        {/* CTA */}
        <Link href="/transactions" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-[12px] font-semibold shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Tambah Transaksi
        </Link>
      </div>
    </div>
  )
}

export default function DashboardCharts({ products, transactions }: Props) {
  // Determine if we have real sales data (outgoing transactions)
  const outTransactions = transactions.filter(t => t.type === 'out')
  const hasOutData = outTransactions.length > 0
  const hasAnyTransactions = transactions.length > 0

  // Bar chart: Top 5 products by actual sales (out transactions)
  const barData = hasOutData
    ? (() => {
        const salesMap: Record<string, { name: string; penjualan: number }> = {}
        outTransactions.forEach(t => {
          if (!salesMap[t.productId]) {
            salesMap[t.productId] = {
              name: t.productName.length > 12 ? t.productName.substring(0, 12) + '...' : t.productName,
              penjualan: 0,
            }
          }
          salesMap[t.productId].penjualan += t.quantity
        })
        return Object.values(salesMap)
          .sort((a, b) => b.penjualan - a.penjualan)
          .slice(0, 5)
      })()
    : []

  // Line chart: Last 7 days transactions (real data)
  const lineData = hasAnyTransactions
    ? (() => {
        const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
        const now = new Date()
        const result = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now)
          d.setDate(d.getDate() - i)
          const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
          const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)

          const dayTx = transactions.filter(t => {
            const txDate = new Date(t.createdAt)
            return txDate >= dayStart && txDate < dayEnd
          })

          result.push({
            name: days[d.getDay()],
            masuk: dayTx.filter(t => t.type === 'in').reduce((s, t) => s + t.quantity, 0),
            keluar: dayTx.filter(t => t.type === 'out').reduce((s, t) => s + t.quantity, 0),
          })
        }
        return result
      })()
    : []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Bar Chart - Analisa Penjualan */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 pt-5 pb-1">
          <h3 className="text-sm font-semibold text-zinc-200">Analisa Penjualan</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">Top 5 Produk Terlaris</p>
        </div>
        <div className="px-2 pb-4">
          {hasOutData ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 15, right: 15, left: 0, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={11} angle={-15} textAnchor="end" />
                  <YAxis stroke="#52525b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fafafa' }}
                    labelStyle={{ color: '#a1a1aa' }}
                  />
                  <Bar dataKey="penjualan" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyStateSales />
          )}
        </div>
      </div>

      {/* Line Chart - Tren Transaksi */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 pt-5 pb-1">
          <h3 className="text-sm font-semibold text-zinc-200">Tren Transaksi</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">7 Hari Terakhir</p>
        </div>
        <div className="px-2 pb-4">
          {hasAnyTransactions ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 15, right: 15, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={12} />
                  <YAxis stroke="#52525b" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fafafa' }}
                    labelStyle={{ color: '#a1a1aa' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
                  <Line type="monotone" dataKey="masuk" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} name="Masuk" />
                  <Line type="monotone" dataKey="keluar" stroke="#f97316" strokeWidth={2.5} dot={{ fill: '#f97316', r: 4 }} name="Keluar" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyStateTrend />
          )}
        </div>
      </div>
    </div>
  )
}
