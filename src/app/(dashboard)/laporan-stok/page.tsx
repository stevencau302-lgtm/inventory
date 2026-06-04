'use client'
import { useEffect, useState, useMemo } from 'react'
import { Product, Transaction, fetchProducts, fetchTransactions, formatRp, getStatus, getSetting } from '@/lib/store'
import { TableSkeleton } from '@/components/PageSkeleton'
import Link from 'next/link'

type StatusFilter = 'all' | 'aman' | 'menipis' | 'habis'

interface StockReport {
  product: Product
  stockAwal: number
  masuk: number
  keluar: number
  stockAkhir: number
  status: 'aman' | 'menipis' | 'habis'
}

export default function LaporanStok() {
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [lastOpname, setLastOpname] = useState<{ date: string; totalChecked: number; matchCount: number; mismatchCount: number; savedAt: string } | null>(null)

  useEffect(() => {
    async function load() {
      const [p, tx] = await Promise.all([fetchProducts(), fetchTransactions()])
      setProducts(p)
      setTransactions(tx)

      // Load last opname info
      try {
        const raw = await getSetting('last_opname')
        if (raw) setLastOpname(JSON.parse(raw))
      } catch {}

      setMounted(true)
    }
    load()
  }, [])

  const reports: StockReport[] = useMemo(() => {
    return products.map(p => {
      const masuk = transactions
        .filter(t => t.productId === p.id && t.type === 'in')
        .reduce((s, t) => s + t.quantity, 0)
      const keluar = transactions
        .filter(t => t.productId === p.id && t.type === 'out')
        .reduce((s, t) => s + t.quantity, 0)
      const stockAwal = p.stock - masuk + keluar
      const stockAkhir = p.stock

      let status: 'aman' | 'menipis' | 'habis' = 'aman'
      if (stockAkhir === 0) status = 'habis'
      else if (stockAkhir <= p.minStock) status = 'menipis'

      return { product: p, stockAwal, masuk, keluar, stockAkhir, status }
    })
  }, [products, transactions])

  const filtered = useMemo(() => {
    return reports.filter(r => {
      const matchSearch = search === '' ||
        r.product.name.toLowerCase().includes(search.toLowerCase()) ||
        r.product.sku.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || r.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [reports, search, statusFilter])

  // Summary calculations
  const totalProduk = products.length
  const totalMasuk = transactions.filter(t => t.type === 'in').reduce((s, t) => s + t.quantity, 0)
  const totalKeluar = transactions.filter(t => t.type === 'out').reduce((s, t) => s + t.quantity, 0)
  const stokHabis = products.filter(p => p.stock === 0).length
  const stokMenipis = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length
  const nilaiAset = products.reduce((s, p) => s + p.stock * p.price, 0)

  function exportCSV() {
    const header = 'Kode,Nama Barang,Unit,Stok Awal,Barang Masuk,Barang Keluar,Stok Akhir,Status\n'
    const rows = filtered.map(r =>
      `${r.product.sku},"${r.product.name}",pcs,${r.stockAwal},${r.masuk},${r.keluar},${r.stockAkhir},${r.status === 'aman' ? 'Aman' : r.status === 'menipis' ? 'Menipis' : 'Habis'}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `laporan-stok-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportPDF() {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const rows = filtered.map(r => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;font-family:monospace">${r.product.sku}</td>
        <td style="padding:8px;border:1px solid #ddd">${r.product.name}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">pcs</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">${r.stockAwal}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;color:#16A34A">${r.masuk}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;color:#DC2626">${r.keluar}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold;color:${r.status === 'habis' ? '#DC2626' : r.status === 'menipis' ? '#CA8A04' : '#16A34A'}">${r.stockAkhir}</td>
      </tr>
    `).join('')
    printWindow.document.write(`
      <html><head><title>Laporan Stok - ${new Date().toLocaleDateString('id-ID')}</title></head>
      <body style="font-family:system-ui,sans-serif;padding:40px">
        <h1 style="font-size:20px;margin-bottom:4px">Laporan Stok</h1>
        <p style="color:#666;margin-bottom:20px">Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="background:#f3f4f6">
            <th style="padding:8px;border:1px solid #ddd;text-align:left">Kode</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left">Nama Barang</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:center">Unit</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:right">Stok Awal</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:right">Masuk</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:right">Keluar</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:right">Stok Akhir</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body></html>
    `)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 300)
  }

  if (!mounted) return <TableSkeleton />

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-[#16A34A]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Laporan Stok</h1>
            <p className="text-gray-500 text-sm mt-0.5">{totalProduk} produk &middot; Monitoring pergerakan stok</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-500/30 text-[#16A34A] text-sm font-medium hover:bg-emerald-50 transition">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            CSV
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-[#DC2626] text-sm font-medium hover:bg-red-50 transition">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H6.75a2.25 2.25 0 00-2.25 2.25v13.5a2.25 2.25 0 002.25 2.25h6" /></svg>
            PDF
          </button>
        </div>
      </div>

      {/* Stat Cards — matching Analisa page design */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Stok Menipis */}
        <div className="rounded-2xl p-4 border border-gray-200 bg-white hover:border-gray-200 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 text-[#D97706]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-gray-900 truncate">{stokMenipis} produk</p>
              <p className="text-[11px] text-gray-500 font-medium">Stok Menipis</p>
            </div>
          </div>
        </div>

        {/* Stok Habis */}
        <div className="rounded-2xl p-4 border border-gray-200 bg-white hover:border-gray-200 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0 text-[#DC2626]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-gray-900 truncate">{stokHabis} produk</p>
              <p className="text-[11px] text-gray-500 font-medium">Stok Habis</p>
            </div>
          </div>
        </div>

        {/* Nilai Aset */}
        <div className="rounded-2xl p-4 border border-gray-200 bg-white hover:border-gray-200 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 text-[#16A34A]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-gray-900 truncate">{formatRp(nilaiAset)}</p>
              <p className="text-[11px] text-gray-500 font-medium">Nilai Aset</p>
            </div>
          </div>
        </div>
      </div>

      {/* Last Opname Info */}
      {lastOpname && (
        <div className="rounded-2xl p-4 border border-[#FF5F03]/20 bg-[#FF5F03]/[0.03]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#FF5F03]/15 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-[#FF5F03]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Opname Terakhir: {lastOpname.date}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {lastOpname.totalChecked} diperiksa · {lastOpname.matchCount} sesuai · {lastOpname.mismatchCount} selisih
                  {lastOpname.savedAt && ` · ${new Date(lastOpname.savedAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                </p>
              </div>
            </div>
            <Link href="/stock-opname" className="px-3 py-1.5 rounded-lg bg-[#FF5F03]/10 text-[#FF5F03] text-xs font-semibold hover:bg-[#FF5F03]/20 transition">
              Opname Baru
            </Link>
          </div>
        </div>
      )}

      {/* Controls: Search, Filter, Export */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <input
            type="text"
            placeholder="Cari SKU atau nama produk..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-white/[0.2] transition"
          />
        </div>

        {/* Filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-white/[0.2] transition cursor-pointer"
        >
          <option value="all">Semua Status</option>
          <option value="aman">Aman</option>
          <option value="menipis">Menipis</option>
          <option value="habis">Habis</option>
        </select>
      </div>

      {/* Desktop Table - Spreadsheet Style */}
      <div className="hidden md:block overflow-hidden border border-gray-200">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-100">
                <th className="border border-gray-200 w-[48px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">No</th>
                <th className="border border-gray-200 w-[110px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">Kode</th>
                <th className="border border-gray-200 px-3 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">Nama Barang</th>
                <th className="border border-gray-200 w-[70px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">Unit</th>
                <th className="border border-gray-200 w-[90px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">Stok Awal</th>
                <th className="border border-gray-200 w-[90px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">Masuk</th>
                <th className="border border-gray-200 w-[90px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">Keluar</th>
                <th className="border border-gray-200 w-[90px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">Stok Akhir</th>
                <th className="border border-gray-200 w-[100px] px-2 py-2.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="border border-gray-200 text-center py-12 text-gray-500">Tidak ada data ditemukan</td></tr>
              ) : (
                filtered.map((r, idx) => (
                  <tr key={r.product.id} className={`hover:bg-blue-50 transition ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
                    <td className="border border-gray-200 px-2 py-2 text-center text-xs text-gray-500">{idx + 1}</td>
                    <td className="border border-gray-200 px-2 py-2 text-center text-sm text-gray-700 font-mono">{r.product.sku}</td>
                    <td className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-900">{r.product.name}</td>
                    <td className="border border-gray-200 px-2 py-2 text-center text-xs text-gray-500">pcs</td>
                    <td className="border border-gray-200 px-2 py-2 text-center text-sm text-gray-700">{r.stockAwal}</td>
                    <td className="border border-gray-200 px-2 py-2 text-center text-sm font-medium text-[#16A34A]">{r.masuk > 0 ? `+${r.masuk}` : '0'}</td>
                    <td className="border border-gray-200 px-2 py-2 text-center text-sm font-medium text-[#DC2626]">{r.keluar > 0 ? `-${r.keluar}` : '0'}</td>
                    <td className={`border border-gray-200 px-2 py-2 text-center text-sm font-bold ${
                      r.status === 'habis' ? 'text-[#DC2626]' : r.status === 'menipis' ? 'text-[#D97706]' : 'text-[#16A34A]'
                    }`}>{r.stockAkhir}</td>
                    <td className="border border-gray-200 px-2 py-2 text-center"><StatusBadge status={r.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2.5">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
            <p className="text-sm text-gray-500">Tidak ada data ditemukan</p>
          </div>
        ) : (
          filtered.map(r => (
            <div key={r.product.id} className={`rounded-xl overflow-hidden border transition-all ${
              r.status === 'habis' ? 'border-red-500/20 bg-red-500/[0.02]' :
              r.status === 'menipis' ? 'border-amber-500/20 bg-amber-500/[0.02]' :
              'border-gray-200 bg-white'
            }`}>
              {/* Top row: product info + status */}
              <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold ${
                    r.status === 'habis' ? 'bg-red-50 text-[#DC2626]' :
                    r.status === 'menipis' ? 'bg-amber-50 text-[#D97706]' :
                    'bg-emerald-50 text-[#16A34A]'
                  }`}>
                    {r.product.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 truncate">{r.product.name}</p>
                    <p className="text-[10px] text-gray-500 font-mono">{r.product.sku}</p>
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </div>

              {/* Bottom row: stock flow visualization */}
              <div className="px-4 pb-3">
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400">AWAL</p>
                    <p className="text-sm font-semibold text-gray-500">{r.stockAwal}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-[#16A34A]">+{r.masuk}</span>
                    <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                    <span className="text-[11px] font-bold text-[#DC2626]">-{r.keluar}</span>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400">AKHIR</p>
                    <p className={`text-sm font-bold ${
                      r.status === 'habis' ? 'text-[#DC2626]' : r.status === 'menipis' ? 'text-[#D97706]' : 'text-[#16A34A]'
                    }`}>{r.stockAkhir}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: 'aman' | 'menipis' | 'habis' }) {
  const styles = {
    aman: 'bg-emerald-50 text-[#16A34A] border-emerald-500/30',
    menipis: 'bg-amber-50 text-[#D97706] border-amber-500/30',
    habis: 'bg-red-50 text-[#DC2626] border-red-500/30',
  }
  const labels = { aman: 'Aman', menipis: 'Menipis', habis: 'Habis' }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
