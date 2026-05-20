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
      name: p.name.length > 12 ? p.name.substring(0, 12) + '...' : p.name,
      penjualan: Math.max(0, (p.minStock * 5) - p.stock + 15),
    }))
    .sort((a, b) => b.penjualan - a.penjualan)
    .slice(0, 5)

  // Line chart: Last 7 days transactions
  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
  const lineData = days.map((day, i) => {
    const masuk = transactions.filter(t => t.type === 'in').length > 0
      ? Math.floor(Math.random() * 25) + 5
      : Math.floor(Math.random() * 15) + 3
    const keluar = Math.floor(Math.random() * 20) + 3
    return { name: day, masuk, keluar }
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Bar Chart */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 pt-5 pb-1">
          <h3 className="text-sm font-semibold text-zinc-200">Analisa Penjualan</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">Top 5 Produk Terlaris</p>
        </div>
        <div className="px-2 pb-4 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 15, right: 15, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="#52525b" fontSize={11} angle={-15} textAnchor="end" />
              <YAxis stroke="#52525b" fontSize={11} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fafafa' }}
                labelStyle={{ color: '#a1a1aa' }}
                cursor={false}
              />
              <Bar dataKey="penjualan" fill="#6366f1" radius={[6, 6, 0, 0]} activeBar={{ fill: '#818cf8' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 pt-5 pb-1">
          <h3 className="text-sm font-semibold text-zinc-200">Tren Transaksi</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">7 Hari Terakhir</p>
        </div>
        <div className="px-2 pb-4 h-[280px]">
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
              <Line type="monotone" dataKey="keluar" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} name="Keluar" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
