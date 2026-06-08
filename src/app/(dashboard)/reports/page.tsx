'use client'

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Product, Category, Transaction, fetchProducts, fetchCategories, fetchTransactions, formatRp } from '@/lib/store'
import {
  BarChart3, Package, DollarSign, Tag, TrendingUp, TrendingDown,
  AlertTriangle, XCircle, ArrowDownCircle, ArrowUpCircle,
  Activity, PieChart, Loader2, RotateCcw, Skull,
  Calendar, ChevronDown, FileSpreadsheet, FileText, Sparkles
} from 'lucide-react'

type DateRange = '7d' | '30d' | '3m' | '6m' | '1y' | 'all' | 'custom'

function getDateRangeMs(range: DateRange, customFrom?: string, customTo?: string): { from: number; to: number; label: string } {
  const now = Date.now()
  const to = now
  switch (range) {
    case '7d': return { from: now - 7 * 24 * 60 * 60 * 1000, to, label: '7 Hari Terakhir' }
    case '30d': return { from: now - 30 * 24 * 60 * 60 * 1000, to, label: '30 Hari Terakhir' }
    case '3m': return { from: now - 90 * 24 * 60 * 60 * 1000, to, label: '3 Bulan Terakhir' }
    case '6m': return { from: now - 180 * 24 * 60 * 60 * 1000, to, label: '6 Bulan Terakhir' }
    case '1y': return { from: now - 365 * 24 * 60 * 60 * 1000, to, label: '1 Tahun Terakhir' }
    case 'all': return { from: 0, to, label: 'Semua Waktu' }
    case 'custom': {
      const f = customFrom ? new Date(customFrom).getTime() : now - 30 * 24 * 60 * 60 * 1000
      const t = customTo ? new Date(customTo + 'T23:59:59').getTime() : now
      return { from: f, to: t, label: 'Custom' }
    }
    default: return { from: now - 30 * 24 * 60 * 60 * 1000, to, label: '30 Hari Terakhir' }
  }
}

function exportToCSV(products: Product[], transactions: Transaction[], categories: Category[], rangeLabel: string) {
  const rows: string[][] = []

  // Sheet 1: Ringkasan Produk
  rows.push(['=== LAPORAN INVENTORY ==='])
  rows.push([`Periode: ${rangeLabel}`])
  rows.push([`Tanggal Export: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`])
  rows.push([])
  rows.push(['--- DAFTAR PRODUK ---'])
  rows.push(['Nama', 'SKU', 'Kategori', 'Stok', 'Min Stok', 'Harga', 'Nilai Stok', 'Status'])
  products.forEach(p => {
    const status = p.stock === 0 ? 'Habis' : p.stock <= p.minStock ? 'Stok Rendah' : 'Tersedia'
    rows.push([p.name, p.sku, p.category, String(p.stock), String(p.minStock), String(p.price), String(p.price * p.stock), status])
  })

  rows.push([])
  rows.push(['--- TRANSAKSI ---'])
  rows.push(['Tanggal', 'Produk', 'Tipe', 'Jumlah', 'Catatan'])
  transactions.forEach(t => {
    rows.push([
      new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      t.productName,
      t.type === 'in' ? 'Masuk' : 'Keluar',
      String(t.quantity),
      t.note || '-'
    ])
  })

  rows.push([])
  rows.push(['--- RINGKASAN ---'])
  rows.push(['Total Produk', String(products.length)])
  rows.push(['Total Unit', String(products.reduce((s, p) => s + p.stock, 0))])
  rows.push(['Total Nilai Inventory', String(products.reduce((s, p) => s + p.price * p.stock, 0))])
  rows.push(['Total Transaksi', String(transactions.length)])
  rows.push(['Total Masuk', String(transactions.filter(t => t.type === 'in').reduce((s, t) => s + t.quantity, 0))])
  rows.push(['Total Keluar', String(transactions.filter(t => t.type === 'out').reduce((s, t) => s + t.quantity, 0))])
  rows.push(['Total Kategori', String(categories.length)])

  const csvContent = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `laporan-inventory-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

async function exportToPDF(products: Product[], transactions: Transaction[], categories: Category[], rangeLabel: string, formatRpFn: (n: number) => string) {
  const jsPDF = (await import('jspdf')).default
  await import('jspdf-autotable')

  const doc = new jsPDF('p', 'mm', 'a4') as any
  const pageWidth = doc.internal.pageSize.getWidth()
  const now = new Date()
  const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  // Colors
  const primary = [79, 70, 229] // indigo
  const dark = [24, 24, 27]
  const gray = [113, 113, 122]
  const success = [16, 185, 129]
  const danger = [239, 68, 68]

  // === HEADER ===
  doc.setFillColor(...primary)
  doc.rect(0, 0, pageWidth, 42, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('Laporan Inventory', 14, 18)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Periode: ${rangeLabel}`, 14, 26)
  doc.text(`Digenerate: ${dateStr}, ${timeStr}`, 14, 33)

  doc.setFontSize(9)
  doc.text('Nexa', pageWidth - 14, 18, { align: 'right' })
  doc.text('inventory-rose-delta.vercel.app', pageWidth - 14, 25, { align: 'right' })

  let y = 52

  // === RINGKASAN STATS ===
  const totalItems = products.reduce((s, p) => s + p.stock, 0)
  const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0)
  const totalMasuk = transactions.filter(t => t.type === 'in').reduce((s, t) => s + t.quantity, 0)
  const totalKeluar = transactions.filter(t => t.type === 'out').reduce((s, t) => s + t.quantity, 0)
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length
  const outStock = products.filter(p => p.stock === 0).length

  doc.setTextColor(...dark)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Ringkasan', 14, y)
  y += 8

  // Stats boxes
  const stats = [
    { label: 'Total Produk', value: `${products.length}` },
    { label: 'Total Unit', value: `${totalItems.toLocaleString()}` },
    { label: 'Nilai Inventory', value: formatRpFn(totalValue) },
    { label: 'Kategori', value: `${categories.length}` },
    { label: 'Stok Masuk', value: `+${totalMasuk.toLocaleString()}` },
    { label: 'Stok Keluar', value: `-${totalKeluar.toLocaleString()}` },
    { label: 'Stok Rendah', value: `${lowStock}` },
    { label: 'Stok Habis', value: `${outStock}` },
  ]

  const boxW = (pageWidth - 28 - 21) / 4
  stats.forEach((stat, i) => {
    const col = i % 4
    const row = Math.floor(i / 4)
    const bx = 14 + col * (boxW + 7)
    const by = y + row * 20

    doc.setFillColor(248, 250, 252)
    doc.roundedRect(bx, by, boxW, 16, 2, 2, 'F')

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...gray)
    doc.text(stat.label.toUpperCase(), bx + 4, by + 5.5)

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...dark)
    doc.text(stat.value, bx + 4, by + 12.5)
  })

  y += 48

  // === TABEL PRODUK ===
  doc.setTextColor(...dark)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Daftar Produk', 14, y)
  y += 4

  const productRows = products.map(p => [
    p.name,
    p.sku,
    p.category,
    p.stock.toString(),
    formatRpFn(p.price),
    formatRpFn(p.price * p.stock),
    p.stock === 0 ? 'Habis' : p.stock <= p.minStock ? 'Rendah' : 'OK'
  ])

  doc.autoTable({
    startY: y,
    head: [['Nama Produk', 'SKU', 'Kategori', 'Stok', 'Harga', 'Nilai', 'Status']],
    body: productRows,
    theme: 'grid',
    headStyles: {
      fillColor: primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: dark,
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 40 },
      3: { halign: 'center' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'center', cellWidth: 16 },
    },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 6) {
        const val = data.cell.raw
        if (val === 'Habis') { data.cell.styles.textColor = danger; data.cell.styles.fontStyle = 'bold' }
        else if (val === 'Rendah') { data.cell.styles.textColor = [245, 158, 11]; data.cell.styles.fontStyle = 'bold' }
        else { data.cell.styles.textColor = success }
      }
    },
    margin: { left: 14, right: 14 },
  })

  y = doc.lastAutoTable.finalY + 12

  // === TABEL TRANSAKSI ===
  if (y > 240) { doc.addPage(); y = 20 }

  doc.setTextColor(...dark)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(`Transaksi (${rangeLabel})`, 14, y)
  y += 4

  const txRows = transactions.slice(0, 50).map(t => [
    new Date(t.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    t.productName,
    t.type === 'in' ? 'Masuk' : 'Keluar',
    t.quantity.toString(),
    t.note || '-'
  ])

  doc.autoTable({
    startY: y,
    head: [['Tanggal', 'Produk', 'Tipe', 'Qty', 'Catatan']],
    body: txRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: dark,
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 28 },
      2: { halign: 'center', cellWidth: 18 },
      3: { halign: 'center', cellWidth: 14 },
    },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 2) {
        data.cell.styles.textColor = data.cell.raw === 'Masuk' ? success : danger
        data.cell.styles.fontStyle = 'bold'
      }
    },
    margin: { left: 14, right: 14 },
  })

  if (transactions.length > 50) {
    const fY = doc.lastAutoTable.finalY + 4
    doc.setFontSize(7)
    doc.setTextColor(...gray)
    doc.text(`Menampilkan 50 dari ${transactions.length} transaksi`, 14, fY)
  }

  // === FOOTER (all pages) ===
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    const pH = doc.internal.pageSize.getHeight()
    doc.setDrawColor(228, 228, 231)
    doc.line(14, pH - 14, pageWidth - 14, pH - 14)
    doc.setFontSize(7)
    doc.setTextColor(...gray)
    doc.text('Nexa — Laporan digenerate otomatis', 14, pH - 8)
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - 14, pH - 8, { align: 'right' })
  }

  doc.save(`laporan-inventory-${now.toISOString().split('T')[0]}.pdf`)
}

const RechartsBarChart = dynamic(
  () => import('recharts').then((mod) => {
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } = mod
    const Chart = ({ data }: { data: { week: string; masuk: number; keluar: number }[] }) => (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 0 }} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.03)" vertical={false} />
          <XAxis dataKey="week" tick={{ fill: '#52525b', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} dy={8} />
          <YAxis tick={{ fill: '#3f3f46', fontSize: 11 }} axisLine={false} tickLine={false} dx={-4} />
          <Bar dataKey="masuk" name="Masuk" radius={[8, 8, 0, 0]} fill="url(#gradientMasuk)" isAnimationActive={false} />
          <Bar dataKey="keluar" name="Keluar" radius={[8, 8, 0, 0]} fill="url(#gradientKeluar)" isAnimationActive={false} />
          <defs>
            <linearGradient id="gradientMasuk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="gradientKeluar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    )
    return Chart
  }),
  { ssr: false, loading: () => <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">Memuat grafik...</div> }
)


export default function ReportsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [mounted, setMounted] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)

  useEffect(() => {
    async function loadData() {
      const p = await fetchProducts()
      const c = await fetchCategories()
      const tx = await fetchTransactions()
      setProducts(p)
      setCategories(c)
      setTransactions(tx)
      setMounted(true)
    }
    loadData()
  }, [])

  const totalItems = useMemo(() => products.reduce((s, p) => s + p.stock, 0), [products])
  const totalValue = useMemo(() => products.reduce((s, p) => s + p.price * p.stock, 0), [products])
  const avgPrice = useMemo(() => products.length ? products.reduce((s, p) => s + p.price, 0) / products.length : 0, [products])

  const deadStock = useMemo(() => {
    const now = Date.now()
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
    const outProductIds = new Set(transactions.filter(t => t.type === 'out').map(t => t.productId))
    return products.filter(p => {
      if (outProductIds.has(p.id)) return false
      const createdTime = new Date(p.createdAt).getTime()
      return (now - createdTime) >= thirtyDaysMs
    })
  }, [products, transactions])

  const stockTurnover = useMemo(() => {
    const totalOutQty = transactions.filter(t => t.type === 'out').reduce((s, t) => s + t.quantity, 0)
    return totalItems > 0 ? (totalOutQty / totalItems).toFixed(2) : '0'
  }, [transactions, totalItems])

  const topCategory = useMemo(() => categories.map(c => ({
    ...c,
    count: products.filter(p => p.category === c.name).length,
    value: products.filter(p => p.category === c.name).reduce((s, p) => s + p.price * p.stock, 0)
  })).sort((a, b) => b.value - a.value), [categories, products])


  const { from: rangeFrom, to: rangeTo, label: rangeLabel } = useMemo(() => getDateRangeMs(dateRange, customFrom, customTo), [dateRange, customFrom, customTo])

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const ts = new Date(t.createdAt).getTime()
      return ts >= rangeFrom && ts <= rangeTo
    })
  }, [transactions, rangeFrom, rangeTo])

  const totalMasukRange = useMemo(() => filteredTransactions.filter(t => t.type === 'in').reduce((s, t) => s + t.quantity, 0), [filteredTransactions])
  const totalKeluarRange = useMemo(() => filteredTransactions.filter(t => t.type === 'out').reduce((s, t) => s + t.quantity, 0), [filteredTransactions])
  const netSelisih = totalMasukRange - totalKeluarRange

  const weeklyData = useMemo(() => {
    const rangeDays = Math.max(1, Math.ceil((rangeTo - rangeFrom) / (24 * 60 * 60 * 1000)))
    const numWeeks = Math.min(Math.max(Math.ceil(rangeDays / 7), 2), 12)
    const weeks: { week: string; masuk: number; keluar: number }[] = []
    const weekDuration = (rangeTo - rangeFrom) / numWeeks
    for (let i = 0; i < numWeeks; i++) {
      const weekStart = rangeFrom + i * weekDuration
      const weekEnd = rangeFrom + (i + 1) * weekDuration
      const weekTx = transactions.filter(t => {
        const ts = new Date(t.createdAt).getTime()
        return ts >= weekStart && ts < weekEnd
      })
      const label = numWeeks <= 4 ? `Minggu ${i + 1}` : new Date(weekStart).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      weeks.push({
        week: label,
        masuk: weekTx.filter(t => t.type === 'in').reduce((s, t) => s + t.quantity, 0),
        keluar: weekTx.filter(t => t.type === 'out').reduce((s, t) => s + t.quantity, 0),
      })
    }
    return weeks
  }, [transactions, rangeFrom, rangeTo])

  const topActive = useMemo(() => {
    const outCounts: Record<string, { name: string; category: string; count: number }> = {}
    filteredTransactions.filter(t => t.type === 'out').forEach(t => {
      if (!outCounts[t.productId]) outCounts[t.productId] = { name: t.productName, category: '', count: 0 }
      outCounts[t.productId].count += t.quantity
      const prod = products.find(p => p.id === t.productId)
      if (prod) outCounts[t.productId].category = prod.category
    })
    return Object.values(outCounts).sort((a, b) => b.count - a.count).slice(0, 5)
  }, [filteredTransactions, products])

  const topStagnant = useMemo(() => {
    const now = Date.now()
    const eligibleProducts = products.filter(p => (now - new Date(p.createdAt).getTime()) >= 7 * 24 * 60 * 60 * 1000)
    const outCounts: Record<string, number> = {}
    filteredTransactions.filter(t => t.type === 'out').forEach(t => { outCounts[t.productId] = (outCounts[t.productId] || 0) + t.quantity })
    return eligibleProducts
      .map(p => ({ name: p.name, category: p.category, count: outCounts[p.id] || 0 }))
      .sort((a, b) => a.count - b.count)
      .slice(0, 5)
  }, [products, filteredTransactions])

  const lowStock = useMemo(() => products.filter(p => p.stock > 0 && p.stock <= p.minStock), [products])
  const outStock = useMemo(() => products.filter(p => p.stock === 0), [products])


  if (!mounted) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Memuat laporan...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-10">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Analisa Inventory</h1>
            <p className="text-gray-500 text-sm mt-0.5">Ringkasan performa & status inventory</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Date Range Picker */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-gray-50 text-gray-700 hover:text-white hover:border-gray-300 transition-all"
            >
              <Calendar className="w-4 h-4 text-[#072C2C]" />
              <span>{rangeLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>
            {showDatePicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-gray-200 bg-white shadow-2xl shadow-black/50 overflow-hidden">
                  <div className="p-2 space-y-0.5">
                    {([
                      { value: '7d', label: '7 Hari Terakhir' },
                      { value: '30d', label: '30 Hari Terakhir' },
                      { value: '3m', label: '3 Bulan Terakhir' },
                      { value: '6m', label: '6 Bulan Terakhir' },
                      { value: '1y', label: '1 Tahun Terakhir' },
                      { value: 'all', label: 'Semua Waktu' },
                    ] as { value: DateRange; label: string }[]).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setDateRange(opt.value); setShowDatePicker(false) }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          dateRange === opt.value ? 'bg-[#072C2C]/15 text-[#072C2C]' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 p-3 space-y-2">
                    <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Custom Range</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={customFrom}
                        onChange={e => setCustomFrom(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg text-xs bg-gray-50 border border-gray-200 text-gray-700 outline-none focus:border-indigo-500/50"
                      />
                      <input
                        type="date"
                        value={customTo}
                        onChange={e => setCustomTo(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg text-xs bg-gray-50 border border-gray-200 text-gray-700 outline-none focus:border-indigo-500/50"
                      />
                    </div>
                    <button
                      onClick={() => { if (customFrom) { setDateRange('custom'); setShowDatePicker(false) } }}
                      disabled={!customFrom}
                      className="w-full py-2 rounded-lg text-xs font-semibold bg-[#072C2C]/20 text-[#072C2C] hover:bg-[#072C2C]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          {/* Export CSV */}
          <button
            onClick={() => exportToCSV(products, filteredTransactions, categories, rangeLabel)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-gray-50 text-gray-500 hover:text-[#16A34A] hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          {/* Export PDF */}
          <button
            onClick={() => exportToPDF(products, filteredTransactions, categories, rangeLabel, formatRp)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-gray-50 text-gray-500 hover:text-[#DC2626] hover:border-red-500/30 hover:bg-red-500/5 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>


      {/* ===== 6 STAT CARDS ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
        <GlassStatCard label="Total Unit" value={totalItems.toLocaleString()} icon={<Package className="w-4 h-4" />} accent="text-blue-400" accentBg="bg-blue-500/10" />
        <GlassStatCard label="Total Nilai Stok" value={formatRp(totalValue)} icon={<DollarSign className="w-4 h-4" />} accent="text-[#16A34A]" accentBg="bg-emerald-50" />
        <GlassStatCard label="Rata-rata Harga" value={formatRp(avgPrice)} icon={<PieChart className="w-4 h-4" />} accent="text-violet-400" accentBg="bg-violet-500/10" />
        <GlassStatCard label="Dead Stock" value={`${deadStock.length} produk`} icon={<Skull className="w-4 h-4" />} accent="text-[#DC2626]" accentBg="bg-red-50" />
        <GlassStatCard label="Perputaran Stok" value={Number(stockTurnover) > 0 ? `${stockTurnover}x` : '—'} icon={<RotateCcw className="w-4 h-4" />} accent="text-[#D97706]" accentBg="bg-amber-50" subtitle={Number(stockTurnover) === 0 ? 'Belum ada penjualan' : undefined} />
        <GlassStatCard label="Total Kategori" value={categories.length.toString()} icon={<Tag className="w-4 h-4" />} accent="text-cyan-400" accentBg="bg-cyan-500/10" />
      </div>

      {/* ===== NILAI PER KATEGORI ===== */}
      <GlassPanel>
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <PieChart className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Nilai Per Kategori</h2>
              <p className="text-xs text-gray-500">Distribusi nilai inventory berdasarkan kategori</p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {topCategory.map(cat => {
            const pct = totalValue > 0 ? (cat.value / totalValue) * 100 : 0
            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: cat.color || '#a855f7' }} />
                    <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                    <span className="text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">{cat.count} produk</span>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{formatRp(cat.value)}</span>
                    <span className="text-[11px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">{pct.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-gray-50 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: cat.color || '#a855f7' }} />
                </div>
              </div>
            )
          })}
          {topCategory.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-gray-700">Belum ada kategori produk</p>
              <p className="text-xs text-gray-500 mt-1">Tambahkan kategori dan produk untuk melihat distribusi nilai</p>
            </div>
          )}
        </div>
      </GlassPanel>


      {/* ===== RINGKASAN TRANSAKSI ===== */}
      <GlassPanel>
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#072C2C]/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-[#072C2C]" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Ringkasan Transaksi</h2>
                <p className="text-xs text-gray-500">Performa {rangeLabel.toLowerCase()}</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-gray-500">Masuk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-[11px] text-gray-500">Keluar</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl p-4 bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownCircle className="w-3.5 h-3.5 text-[#16A34A]" />
                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Barang Masuk</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">+{totalMasukRange.toLocaleString()}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">unit · {rangeLabel.toLowerCase()}</p>
            </div>
            <div className="rounded-xl p-4 bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpCircle className="w-3.5 h-3.5 text-[#DC2626]" />
                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Barang Keluar</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">-{totalKeluarRange.toLocaleString()}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">unit · {rangeLabel.toLowerCase()}</p>
            </div>
            <div className="rounded-xl p-4 bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-gray-500" />
                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Selisih Net</p>
              </div>
              <p className={`text-2xl font-bold ${netSelisih >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                {netSelisih >= 0 ? '+' : ''}{netSelisih.toLocaleString()}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">{netSelisih >= 0 ? 'stok bertambah' : 'stok berkurang'}</p>
            </div>
          </div>
          <div className="rounded-xl p-4 bg-gray-50 border border-gray-100">
            <RechartsBarChart data={weeklyData} />
          </div>
        </div>
      </GlassPanel>


      {/* ===== PRODUK AKTIF vs STAGNAN ===== */}
      <GlassPanel>
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#D97706]" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Produk Aktif vs Stagnan</h2>
              <p className="text-xs text-gray-500">Berdasarkan jumlah transaksi keluar</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06]">
          {/* Top 5 Terlaris */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-3.5 h-3.5 text-[#16A34A]" />
              <h3 className="text-sm font-medium text-gray-700">Top 5 Terlaris</h3>
            </div>
            <div className="space-y-2">
              {topActive.length > 0 ? topActive.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="w-6 h-6 rounded-md bg-gray-50 text-gray-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium truncate">{item.name}</p>
                    <span className="text-[10px] text-gray-500">{item.category || '-'}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{item.count}</span>
                </div>
              )) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-700">Belum ada transaksi keluar</p>
                  <p className="text-xs text-gray-500 mt-1">Mulai input penjualan pertama</p>
                </div>
              )}
            </div>
          </div>
          {/* Top 5 Stagnan */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-3.5 h-3.5 text-[#D97706]" />
              <h3 className="text-sm font-medium text-gray-700">Top 5 Stagnan</h3>
            </div>
            <div className="space-y-2">
              {topStagnant.length > 0 ? topStagnant.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="w-6 h-6 rounded-md bg-gray-50 text-gray-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium truncate">{item.name}</p>
                    <span className="text-[10px] text-gray-500">{item.category}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{item.count}</span>
                </div>
              )) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-700">Semua produk masih aktif</p>
                  <p className="text-xs text-gray-500 mt-1">Tidak ada produk yang diam tanpa transaksi</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassPanel>


      {/* ===== DEAD STOCK ===== */}
      <DeadStockTable deadStock={deadStock} transactions={transactions} formatRp={formatRp} />

      {/* ===== ALERT STOK ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock */}
        <GlassPanel>
          <div className="p-5 border-b border-gray-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-[#D97706]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Stok Rendah</h3>
              <p className="text-xs text-gray-500">{lowStock.length} produk perlu restock</p>
            </div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {lowStock.slice(0, 5).map(p => {
              const ratio = p.minStock > 0 ? p.stock / p.minStock : 1
              const barColor = ratio < 0.5 ? 'bg-red-500' : ratio < 0.8 ? 'bg-amber-500' : 'bg-emerald-500'
              return (
                <div key={p.id} className="px-6 py-4 hover:bg-gray-50 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-[#D97706] text-[10px] font-bold">
                        {p.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-gray-900 font-medium">{p.name}</p>
                        <p className="text-[11px] text-gray-500">{p.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{p.stock}</p>
                      <p className="text-[10px] text-gray-400">min: {p.minStock}</p>
                    </div>
                  </div>
                  <div className="mt-2.5 h-1.5 rounded-full bg-gray-50 border border-gray-100 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${Math.min(ratio * 100, 100)}%` }} />
                  </div>
                </div>
              )
            })}
            {lowStock.length === 0 && (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-[#16A34A] font-medium">Semua stok aman</p>
                <p className="text-xs text-gray-500 mt-1">Tidak ada produk mendekati batas minimum</p>
              </div>
            )}
          </div>
        </GlassPanel>

        {/* Out of Stock */}
        <GlassPanel>
          <div className="p-5 border-b border-gray-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-[#DC2626]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Stok Habis</h3>
              <p className="text-xs text-gray-500">{outStock.length} produk habis</p>
            </div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {outStock.slice(0, 5).map(p => (
              <div key={p.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center text-[#DC2626] text-[10px] font-bold">
                    {p.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 font-medium">{p.name}</p>
                    <p className="text-[11px] text-gray-500">{p.category}</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-red-50 text-[#DC2626]">Habis</span>
              </div>
            ))}
            {outStock.length === 0 && (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-[#16A34A] font-medium">Semua produk tersedia</p>
                <p className="text-xs text-gray-500 mt-1">Tidak ada produk dengan stok kosong</p>
              </div>
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}


/* ─── GlassPanel Component ─── */
function GlassPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white hover:border-gray-200 transition-colors duration-200">
      {children}
    </div>
  )
}

/* ─── GlassStatCard Component ─── */
function GlassStatCard({ label, value, icon, accent, accentBg, subtitle }: {
  label: string; value: string; icon: React.ReactNode; accent: string; accentBg: string; subtitle?: string
}) {
  return (
    <div className="rounded-2xl p-4 border border-gray-200 bg-white hover:border-gray-200 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg ${accentBg} flex items-center justify-center shrink-0 ${accent}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
          <p className="text-[11px] text-gray-500 font-medium">{label}</p>
          {subtitle && <p className="text-[9px] text-gray-400">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}


/* ─── DeadStockTable Component ─── */
function DeadStockTable({ deadStock, transactions, formatRp }: { deadStock: Product[]; transactions: Transaction[]; formatRp: (n: number) => string }) {
  const [sortCol, setSortCol] = useState<'days' | 'value' | 'stock' | 'price'>('days')
  const [sortAsc, setSortAsc] = useState(false)

  const now = Date.now()
  const deadStockWithDays = deadStock.map(p => {
    const lastIn = transactions
      .filter(t => t.productId === p.id && t.type === 'in')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    const addedDate = lastIn ? new Date(lastIn.createdAt).getTime() : new Date(p.updatedAt || Date.now()).getTime()
    const days = Math.max(0, Math.floor((now - addedDate) / (1000 * 60 * 60 * 24)))
    const value = p.price * p.stock
    return { ...p, days, value }
  })

  const handleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortAsc(!sortAsc)
    else { setSortCol(col); setSortAsc(false) }
  }

  const sorted = [...deadStockWithDays].sort((a, b) => {
    let diff = 0
    if (sortCol === 'days') diff = a.days - b.days
    else if (sortCol === 'value') diff = a.value - b.value
    else if (sortCol === 'stock') diff = a.stock - b.stock
    else if (sortCol === 'price') diff = a.price - b.price
    return sortAsc ? diff : -diff
  })

  const totalValue = deadStockWithDays.reduce((s, p) => s + p.value, 0)
  const avgDays = deadStockWithDays.length > 0 ? Math.round(deadStockWithDays.reduce((s, p) => s + p.days, 0) / deadStockWithDays.length) : 0

  const getDayColor = (days: number) => {
    if (days > 90) return 'text-[#DC2626] font-extrabold'
    if (days > 30) return 'text-[#D97706] font-bold'
    return 'text-yellow-400'
  }

  const getStatusBadge = (days: number) => {
    if (days > 90) return <span className="px-2.5 py-1 rounded-xl text-[9px] font-bold bg-red-50 border border-red-500/20 text-[#DC2626]">Kritis</span>
    if (days > 30) return <span className="px-2.5 py-1 rounded-xl text-[9px] font-bold bg-amber-50 border border-amber-500/20 text-[#D97706]">Stagnan</span>
    return <span className="px-2.5 py-1 rounded-xl text-[9px] font-bold bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">Perhatian</span>
  }

  const SortIcon = ({ col }: { col: typeof sortCol }) => {
    if (sortCol !== col) return <span className="text-gray-400 ml-1">↕</span>
    return <span className="text-purple-400 ml-1">{sortAsc ? '↑' : '↓'}</span>
  }


  return (
    <GlassPanel>
      <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
            <Skull className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Dead Stock</h2>
            <p className="text-xs text-gray-500">{deadStock.length} produk tanpa transaksi keluar</p>
          </div>
        </div>
        {totalValue > 0 && (
          <p className="text-sm font-semibold text-[#DC2626]">
            Nilai tertahan: {formatRp(totalValue)}
          </p>
        )}
      </div>

      {deadStock.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="border-b border-gray-200 w-[48px] px-4 py-3.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">No</th>
                <th className="border-b border-gray-200 px-4 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">Produk</th>
                <th className="border-b border-gray-200 w-[100px] px-4 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">SKU</th>
                <th className="border-b border-gray-200 w-[70px] px-4 py-3.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 transition" onClick={() => handleSort('stock')}>Stok<SortIcon col="stock" /></th>
                <th className="border-b border-gray-200 w-[120px] px-4 py-3.5 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 transition" onClick={() => handleSort('price')}>Harga<SortIcon col="price" /></th>
                <th className="border-b border-gray-200 w-[130px] px-4 py-3.5 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 transition" onClick={() => handleSort('value')}>Nilai Tertahan<SortIcon col="value" /></th>
                <th className="border-b border-gray-200 w-[110px] px-4 py-3.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 transition" onClick={() => handleSort('days')}>Hari<SortIcon col="days" /></th>
                <th className="border-b border-gray-200 w-[100px] px-4 py-3.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, idx) => (
                <tr key={p.id} className={`hover:bg-red-500/[0.03] transition-all duration-200 ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                  <td className="border-b border-gray-100 px-4 py-3.5 text-center text-xs text-gray-500">{idx + 1}</td>
                  <td className="border-b border-gray-100 px-4 py-3.5">
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-500 mt-0.5 inline-block">{p.category}</span>
                  </td>
                  <td className="border-b border-gray-100 px-4 py-3.5 font-mono text-xs text-gray-500">{p.sku}</td>
                  <td className="border-b border-gray-100 px-4 py-3.5 text-center font-mono text-sm text-gray-700">{p.stock}</td>
                  <td className="border-b border-gray-100 px-4 py-3.5 text-right font-mono text-xs text-gray-700">{formatRp(p.price)}</td>
                  <td className="border-b border-gray-100 px-4 py-3.5 text-right font-mono text-sm font-bold text-[#DC2626]">{formatRp(p.value)}</td>
                  <td className="border-b border-gray-100 px-4 py-3.5 text-center">
                    <p className={`text-lg ${getDayColor(p.days)}`}>{p.days}</p>
                    <p className="text-[9px] text-gray-400">hari</p>
                  </td>
                  <td className="border-b border-gray-100 px-4 py-3.5 text-center">{getStatusBadge(p.days)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td colSpan={5} className="px-4 py-3.5 text-xs font-medium text-gray-500">{sorted.length} produk dead stock</td>
                <td className="px-4 py-3.5 text-right font-mono text-sm font-extrabold text-[#DC2626]">{formatRp(totalValue)}</td>
                <td className="px-4 py-3.5 text-center text-xs text-gray-500">~{avgDays} hari</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center">
          <p className="text-sm text-[#16A34A] font-medium">Tidak ada dead stock</p>
          <p className="text-xs text-gray-500 mt-1">Semua produk memiliki transaksi keluar — inventory sehat</p>
        </div>
      )}
    </GlassPanel>
  )
}
