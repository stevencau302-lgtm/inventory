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
  doc.text('Nexa Inventory', pageWidth - 14, 18, { align: 'right' })
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
    doc.text('Nexa Inventory — Laporan digenerate otomatis', 14, pH - 8)
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


// Parse AI markdown into structured sections
// Parse AI markdown into structured sections with better formatting
function parseAiSections(md: string): { title: string; items: string[] }[] {
  const sections: { title: string; items: string[] }[] = []
  const lines = md.split('\n')
  let currentSection: { title: string; items: string[] } | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    
    // Detect section headers
    const headerMatch = trimmed.match(/^#{1,3}\s+(.+)/) || trimmed.match(/^\d+\.\s+\*\*(.+?)\*\*\s*$/)
    if (headerMatch) {
      if (currentSection && currentSection.items.length > 0) sections.push(currentSection)
      currentSection = { title: headerMatch[1].replace(/\*\*/g, ''), items: [] }
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.match(/^\d+\.\s/)) {
      const content = trimmed.replace(/^[-•]\s+/, '').replace(/^\d+\.\s+/, '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900">$1</strong>')
      if (currentSection) currentSection.items.push(content)
      else {
        currentSection = { title: 'Insight', items: [content] }
      }
    } else if (currentSection) {
      const content = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900">$1</strong>')
      currentSection.items.push(content)
    } else {
      currentSection = { title: 'Ringkasan', items: [trimmed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900">$1</strong>')] }
    }
  }
  if (currentSection && currentSection.items.length > 0) sections.push(currentSection)
  return sections
}

export default function ReportsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [mounted, setMounted] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [aiInsight, setAiInsight] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

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

  const handleAiInsight = async () => {
    setAiLoading(true)
    setAiError('')
    setAiInsight('')
    try {
      const res = await fetch('/api/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products,
          transactions: filteredTransactions,
          categories,
          dateRange: rangeLabel,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAiError(data.error || 'Gagal mendapatkan insight')
      } else {
        setAiInsight(data.insight)
      }
    } catch (err: any) {
      setAiError('Gagal terhubung ke AI. Coba lagi.')
    } finally {
      setAiLoading(false)
    }
  }


  if (!mounted) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Memuat laporan...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analisa Inventory</h1>
          <p className="text-gray-500 text-sm mt-0.5">Ringkasan performa & status inventory</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date Range */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:border-gray-300 shadow-sm transition-all"
            >
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{rangeLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
            {showDatePicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
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
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${dateRange === opt.value ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 p-3 space-y-2">
                    <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Custom</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="w-full px-2.5 py-2 rounded-lg text-xs bg-gray-50 border border-gray-200 text-gray-700 outline-none focus:border-indigo-400" />
                      <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="w-full px-2.5 py-2 rounded-lg text-xs bg-gray-50 border border-gray-200 text-gray-700 outline-none focus:border-indigo-400" />
                    </div>
                    <button onClick={() => { if (customFrom) { setDateRange('custom'); setShowDatePicker(false) } }} disabled={!customFrom} className="w-full py-2 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-40 transition-all">Terapkan</button>
                  </div>
                </div>
              </>
            )}
          </div>
          <button onClick={() => exportToCSV(products, filteredTransactions, categories, rangeLabel)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 shadow-sm transition-all">
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button onClick={() => exportToPDF(products, filteredTransactions, categories, rangeLabel, formatRp)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 shadow-sm transition-all">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <div className="flex flex-wrap gap-2.5">
        <a href="/products/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Tambah Produk
        </a>
        <a href="/transactions/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-100 transition-all">
          <ArrowDownCircle className="w-4 h-4" />
          Stok Masuk
        </a>
        <a href="/transactions/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 transition-all">
          <ArrowUpCircle className="w-4 h-4" />
          Stok Keluar
        </a>
        <button onClick={handleAiInsight} disabled={aiLoading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:scale-[1.02] disabled:opacity-50 transition-all">
          <Sparkles className="w-4 h-4" />
          Generate Insight
        </button>
      </div>

      {/* ===== STAT CARDS (bento grid) ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Big card - Total Nilai */}
        <div className="col-span-2 lg:col-span-2 lg:row-span-2 relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-xl shadow-purple-500/15">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/70">Total Nilai Inventory</p>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white/80" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-extrabold mb-2">{formatRp(totalValue)}</p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 text-xs font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>dibanding {rangeLabel.toLowerCase()}</span>
            </div>
          </div>
        </div>
        {/* Total Unit */}
        <div className="rounded-2xl p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Total Unit</p>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Package className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalItems.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 mt-1">unit</p>
        </div>
        {/* Total Kategori */}
        <div className="rounded-2xl p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Total Kategori</p>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Tag className="w-4 h-4 text-indigo-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
          <p className="text-[11px] text-gray-400 mt-1">kategori</p>
        </div>
        {/* Dead Stock */}
        <div className="rounded-2xl p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Dead Stock</p>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Skull className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{deadStock.length}</p>
          <p className="text-[11px] text-gray-400 mt-1">produk</p>
        </div>
        {/* Rata-rata Harga */}
        <div className="rounded-2xl p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Rata-rata Harga</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <PieChart className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatRp(avgPrice)}</p>
          <p className="text-[11px] text-gray-400 mt-1">per unit</p>
        </div>
      </div>

      {/* ===== AI INSIGHT ===== */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-md shadow-purple-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">AI Insight</h2>
              <p className="text-[11px] text-gray-500">Rekomendasi cerdas untuk inventory kamu</p>
            </div>
          </div>
          <button onClick={handleAiInsight} disabled={aiLoading} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all">
            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-purple-500" />}
            Generate AI Insight
          </button>
        </div>
        <div className="p-5">
          {aiLoading && (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">AI sedang menganalisa...</p>
            </div>
          )}
          {aiError && (
            <div className="rounded-xl p-4 bg-red-50 border border-red-100 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{aiError}</p>
            </div>
          )}
          {!aiInsight && !aiLoading && !aiError && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-violet-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Belum ada insight tersedia</h3>
                  <p className="text-xs text-gray-500 mb-3">Yuk mulai transaksi untuk mendapatkan analisa AI yang membantu.</p>
                  <p className="text-xs font-medium text-gray-600 mb-1.5">Tips memulai:</p>
                  <ul className="space-y-1">
                    <li className="text-xs text-gray-500 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-gray-400" />Tambahkan produk pertama kamu</li>
                    <li className="text-xs text-gray-500 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-gray-400" />Catat stok masuk</li>
                    <li className="text-xs text-gray-500 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-gray-400" />Lakukan transaksi keluar</li>
                    <li className="text-xs text-gray-500 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-gray-400" />AI akan memberikan insight setelah minimal 5 transaksi</li>
                  </ul>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-xs font-medium text-gray-600 mb-3">Insight akan membantu kamu:</p>
                <div className="space-y-2">
                  {['Mendeteksi slow moving item', 'Memprediksi kebutuhan stok', 'Mengoptimalkan nilai inventory', 'Mencegah kehabisan stok'].map((t, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="text-xs text-gray-600">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {aiInsight && (
            <div className="space-y-3">
              {parseAiSections(aiInsight).map((section, idx) => {
                const configs = [
                  { iconBg: 'bg-blue-100', iconColor: 'text-blue-600', borderColor: 'border-blue-100', headerBg: 'bg-blue-50', icon: <Activity className="w-4 h-4" /> },
                  { iconBg: 'bg-amber-100', iconColor: 'text-amber-600', borderColor: 'border-amber-100', headerBg: 'bg-amber-50', icon: <AlertTriangle className="w-4 h-4" /> },
                  { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', borderColor: 'border-emerald-100', headerBg: 'bg-emerald-50', icon: <TrendingUp className="w-4 h-4" /> },
                ]
                const cfg = configs[idx % 3]
                return (
                  <div key={idx} className={`rounded-xl border ${cfg.borderColor} overflow-hidden`}>
                    <div className={`px-4 py-2.5 ${cfg.headerBg} flex items-center gap-2`}>
                      <div className={`w-6 h-6 rounded-md ${cfg.iconBg} ${cfg.iconColor} flex items-center justify-center`}>{cfg.icon}</div>
                      <h3 className="text-xs font-bold text-gray-800">{section.title}</h3>
                    </div>
                    <div className="px-4 py-3 space-y-2 bg-white">
                      {section.items.map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${cfg.iconBg} ${cfg.iconColor}`}>{i + 1}</span>
                          <p className="text-xs text-gray-600 leading-relaxed [&_strong]:text-gray-900 [&_strong]:font-semibold" dangerouslySetInnerHTML={{ __html: item }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== NILAI KATEGORI + RINGKASAN TRANSAKSI (side by side) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Nilai Per Kategori */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <PieChart className="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Nilai Per Kategori</h2>
              <p className="text-[11px] text-gray-500">Distribusi nilai inventory</p>
            </div>
          </div>
          <div className="p-5">
            {/* Donut visualization */}
            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {topCategory.length > 0 ? (() => {
                    let offset = 0
                    return topCategory.map((cat, i) => {
                      const pct = totalValue > 0 ? (cat.value / totalValue) * 100 : 0
                      const dashArray = `${pct * 2.51} ${251 - pct * 2.51}`
                      const el = <circle key={i} cx="50" cy="50" r="40" fill="none" stroke={cat.color || '#a855f7'} strokeWidth="12" strokeDasharray={dashArray} strokeDashoffset={-offset * 2.51} strokeLinecap="round" />
                      offset += pct
                      return el
                    })
                  })() : <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12" />}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-lg font-bold text-gray-900">100%</p>
                  <p className="text-[9px] text-gray-400">Total Nilai</p>
                  <p className="text-[10px] font-semibold text-gray-600">{formatRp(totalValue)}</p>
                </div>
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {topCategory.slice(0, 7).map(cat => {
                  const pct = totalValue > 0 ? (cat.value / totalValue) * 100 : 0
                  return (
                    <div key={cat.id} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color || '#a855f7' }} />
                      <span className="text-gray-700 truncate flex-1">{cat.name}</span>
                      <span className="text-gray-500 font-medium">{formatRp(cat.value)}</span>
                      <span className="text-gray-400 w-8 text-right">{pct.toFixed(0)}%</span>
                    </div>
                  )
                })}
                {topCategory.length === 0 && <p className="text-xs text-gray-400">Belum ada kategori</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Ringkasan Transaksi */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Activity className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Ringkasan Transaksi</h2>
                <p className="text-[11px] text-gray-500">Performa {rangeLabel.toLowerCase()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-[10px] text-gray-400">Masuk</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400" /><span className="text-[10px] text-gray-400">Keluar</span></div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {/* Mini stat row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-100 text-center">
                <p className="text-[10px] text-emerald-600 font-semibold mb-0.5">Barang Masuk</p>
                <p className="text-xl font-bold text-emerald-700">+{totalMasukRange.toLocaleString()}</p>
                <p className="text-[9px] text-emerald-500">unit</p>
              </div>
              <div className="rounded-xl p-3 bg-red-50 border border-red-100 text-center">
                <p className="text-[10px] text-red-600 font-semibold mb-0.5">Barang Keluar</p>
                <p className="text-xl font-bold text-red-700">-{totalKeluarRange.toLocaleString()}</p>
                <p className="text-[9px] text-red-500">unit</p>
              </div>
              <div className={`rounded-xl p-3 text-center ${netSelisih >= 0 ? 'bg-blue-50 border border-blue-100' : 'bg-orange-50 border border-orange-100'}`}>
                <p className={`text-[10px] font-semibold mb-0.5 ${netSelisih >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Selisih Net</p>
                <p className={`text-xl font-bold ${netSelisih >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{netSelisih >= 0 ? '+' : ''}{netSelisih.toLocaleString()}</p>
                <p className={`text-[9px] ${netSelisih >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>{netSelisih >= 0 ? 'stok bertambah' : 'stok berkurang'}</p>
              </div>
            </div>
            {/* Chart */}
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1.5"><BarChart3 className="w-3 h-3" />Tren Mingguan</p>
                <p className="text-[10px] text-gray-400">{rangeLabel}</p>
              </div>
              <RechartsBarChart data={weeklyData} />
            </div>
          </div>
        </div>
      </div>

      {/* ===== PRODUK AKTIF vs STAGNAN + DEAD STOCK ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Produk Aktif vs Stagnan */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Produk Aktif vs Stagnan</h2>
              <p className="text-[11px] text-gray-500">Berdasarkan jumlah transaksi keluar</p>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            <div className="p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <p className="text-[11px] font-semibold text-gray-600">Top 5 Terlaris</p>
              </div>
              {topActive.length > 0 ? topActive.map((item, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5">
                  <span className="w-5 h-5 rounded bg-gray-100 text-[9px] font-bold flex items-center justify-center text-gray-500">{i + 1}</span>
                  <span className="text-xs text-gray-700 truncate flex-1">{item.name}</span>
                  <span className="text-xs font-semibold text-gray-900">{item.count}</span>
                </div>
              )) : <p className="text-xs text-gray-400 py-4">Belum ada transaksi keluar</p>}
            </div>
            <div className="p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <TrendingDown className="w-3 h-3 text-amber-500" />
                <p className="text-[11px] font-semibold text-gray-600">Top 5 Stagnan</p>
              </div>
              {topStagnant.length > 0 ? topStagnant.map((item, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5">
                  <span className="w-5 h-5 rounded bg-gray-100 text-[9px] font-bold flex items-center justify-center text-gray-500">{i + 1}</span>
                  <span className="text-xs text-gray-700 truncate flex-1">{item.name}</span>
                  <span className="text-xs font-semibold text-gray-900">{item.count}</span>
                </div>
              )) : <p className="text-xs text-gray-400 py-4">Semua produk masih aktif</p>}
            </div>
          </div>
        </div>

        {/* Dead Stock */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <Skull className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Dead Stock</h2>
              <p className="text-[11px] text-gray-500">Produk tanpa transaksi keluar</p>
            </div>
          </div>
          <div className="p-5">
            {deadStock.length > 0 ? (
              <div className="space-y-2">
                {deadStock.slice(0, 5).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50">
                    <span className="w-6 h-6 rounded bg-red-50 text-[10px] font-bold flex items-center justify-center text-red-500">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-400">{p.category}</p>
                    </div>
                    <span className="text-xs font-semibold text-gray-600">{p.stock} unit</span>
                  </div>
                ))}
                {deadStock.length > 5 && <p className="text-[11px] text-gray-400 text-center pt-2">+{deadStock.length - 5} produk lainnya</p>}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-10 h-10 text-emerald-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm font-medium text-emerald-600">Tidak ada dead stock</p>
                <p className="text-xs text-gray-400 mt-1">Semua produk memiliki transaksi keluar 🎉</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== STOK RENDAH + STOK HABIS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stok Rendah */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Stok Rendah</h2>
              <p className="text-[11px] text-gray-500">Produk perlu restock</p>
            </div>
          </div>
          <div className="p-5">
            {lowStock.length > 0 ? (
              <div className="space-y-3">
                {lowStock.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-[10px] font-bold text-amber-600">{p.name.substring(0, 2).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.min((p.stock / p.minStock) * 100, 100)}%` }} />
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium">{p.stock}/{p.minStock}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-10 h-10 text-emerald-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm font-medium text-emerald-600">Semua stok aman</p>
                <p className="text-xs text-gray-400 mt-1">Tidak ada produk mendekati batas minimum</p>
              </div>
            )}
          </div>
        </div>

        {/* Stok Habis */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Stok Habis</h2>
              <p className="text-[11px] text-gray-500">Produk habis</p>
            </div>
          </div>
          <div className="p-5">
            {outStock.length > 0 ? (
              <div className="space-y-2">
                {outStock.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-[10px] font-bold text-red-600">{p.name.substring(0, 2).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-400">{p.category}</p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-50 text-red-600">Habis</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-10 h-10 text-emerald-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm font-medium text-emerald-600">Semua produk tersedia</p>
                <p className="text-xs text-gray-400 mt-1">Tidak ada produk dengan stok kosong</p>
              </div>
            )}
          </div>
        </div>
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
