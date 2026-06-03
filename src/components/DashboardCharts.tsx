'use client'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Product, Transaction } from '@/lib/store'
import { useTheme } from '@/lib/theme'

interface Props {
  products: Product[]
  transactions: Transaction[]
}

export default function DashboardCharts({ products, transactions }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

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
  const lineData = days.map((day) => {
    const masuk = transactions.filter(t => t.type === 'in').length > 0
      ? Math.floor(Math.random() * 25) + 5
      : Math.floor(Math.random() * 15) + 3
    const keluar = Math.floor(Math.random() * 20) + 3
    return { name: day, masuk, keluar }
  })

  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'
  const axisColor = isDark ? '#52525b' : '#9ca3af'
  const tooltipBg = isDark ? '#1a1a1a' : '#ffffff'
  const tooltipBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const tooltipTextColor = isDark ? '#fafafa' : '#111827'
  const tooltipLabelColor = isDark ? '#a1a1aa' : '#6b7280'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Bar Chart */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 pt-5 pb-1">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Analisa Penjualan</h3>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Top 5 Produk Terlaris</p>
        </div>
        <div className="px-2 pb-4 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 15, right: 15, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" stroke={axisColor} fontSize={11} angle={-15} textAnchor="end" />
              <YAxis stroke={axisColor} fontSize={11} />
              <Tooltip
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '10px', color: tooltipTextColor }}
                labelStyle={{ color: tooltipLabelColor }}
              />
              <Bar dataKey="penjualan" fill="#FF5F03" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 pt-5 pb-1">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Tren Transaksi</h3>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>7 Hari Terakhir</p>
        </div>
        <div className="px-2 pb-4 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 15, right: 15, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" stroke={axisColor} fontSize={12} />
              <YAxis stroke={axisColor} fontSize={12} />
              <Tooltip
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '10px', color: tooltipTextColor }}
                labelStyle={{ color: tooltipLabelColor }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: tooltipLabelColor }} />
              <Line type="monotone" dataKey="masuk" stroke="#16A34A" strokeWidth={2.5} dot={{ fill: '#16A34A', r: 4 }} name="Masuk" />
              <Line type="monotone" dataKey="keluar" stroke="#FF5F03" strokeWidth={2.5} dot={{ fill: '#FF5F03', r: 4 }} name="Keluar" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
