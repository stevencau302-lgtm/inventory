'use client'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Product, Transaction } from '@/lib/store'

interface Props {
  products: Product[]
  transactions: Transaction[]
}

export default function DashboardCharts({ products, transactions }: Props) {
  // Bar chart: Top 5 products by simulated sales
  const barData = [...products]
    .map(p => ({
      name: p.name.length > 14 ? p.name.substring(0, 14) + '...' : p.name,
      penjualan: Math.floor(Math.random() * 80) + 20,
    }))
    .slice(0, 5)

  // Line chart: Last 7 days transactions
  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
  const lineData = days.map(day => ({
    name: day,
    masuk: Math.floor(Math.random() * 30) + 5,
    keluar: Math.floor(Math.random() * 25) + 3,
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bar Chart */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 pt-5 pb-1">
          <h3 className="text-sm font-semibold text-zinc-200">Analisa Penjualan</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Top 5 Produk Terlaris</p>
        </div>
        <div className="px-3 pb-4 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 15, right: 15, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3a52" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} angle={-15} textAnchor="end" />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{ background: '#1e2a42', border: '1px solid #2d3a52', borderRadius: '8px', color: '#f1f5f9' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Bar dataKey="penjualan" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 pt-5 pb-1">
          <h3 className="text-sm font-semibold text-zinc-200">Tren Transaksi</h3>
          <p className="text-xs text-zinc-500 mt-0.5">7 Hari Terakhir</p>
        </div>
        <div className="px-3 pb-4 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 15, right: 15, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3a52" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{ background: '#1e2a42', border: '1px solid #2d3a52', borderRadius: '8px', color: '#f1f5f9' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="masuk" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} name="Masuk" />
              <Line type="monotone" dataKey="keluar" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 4 }} name="Keluar" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
