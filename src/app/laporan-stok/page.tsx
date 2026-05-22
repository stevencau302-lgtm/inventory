'use client'
import { useEffect, useState, useMemo } from 'react'
import { Product, Transaction, fetchProducts, fetchTransactions, formatRp, getStatus } from '@/lib/store'
import { TableSkeleton } from '@/components/PageSkeleton'

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

  useEffect(() => {
    async function load() {
      const [p, tx] = await Promise.all([fetchProducts(), fetchTransactions()])
      setProducts(p)
      setTransactions(tx)
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
      <div>
        <h1 className="text-xl font-semibold text-white">Monitoring Inventory</h1>
        <p className="text-zinc-500 text-sm mt-1">Pantau pergerakan stok secara real-time</p>
      </div>

      {/* Hero Banner with 4 main cards */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f1a] px-5 py-6 border border-white/[0.06]">
        <div className="absolute top-[-30%] right-[-5%] w-[300px] h-[300px] rounded-full bg-indigo-500/[0.06] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[5%] w-[200px] h-[200px] rounded-full bg-blue-500/[0.04] pointer-events-none" />
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Produk */}
          <div className="rounded-xl p-3.5 bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                <svg className="w-[18px] h-[18px] text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Total Produk</p>
            </div>
            <p className="text-2xl font-bold text-white">{totalProduk}</p>
            <p className="text-[11px] text-zinc-500 mt-1">Produk terdaftar</p>
          </div>

          {/* Total Masuk */}
          <div className="rounded-xl p-4 bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <svg className="w-[18px] h-[18px] text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Total Masuk</p>
            </div>
            <p className="text-2xl font-bold text-white">{totalMasuk}</p>
            <p className="text-[11px] text-zinc-500 mt-1">Unit barang masuk</p>
          </div>

          {/* Total Keluar */}
          <div className="rounded-xl p-4 bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center">
                <svg className="w-[18px] h-[18px] text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" /></svg>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Total Keluar</p>
            </div>
            <p className="text-2xl font-bold text-white">{totalKeluar}</p>
            <p className="text-[11px] text-zinc-500 mt-1">Unit barang keluar</p>
          </div>

          {/* Stok Habis (in hero) */}
          <div className="rounded-xl p-4 bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center">
                <svg className="w-[18px] h-[18px] text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Stok Habis</p>
            </div>
            <p className="text-2xl font-bold text-white">{stokHabis}</p>
            <p className="text-[11px] text-zinc-500 mt-1">Produk stok kosong</p>
          </div>
        </div>
      </div>

      {/* Bottom 3 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Stok Menipis */}
        <div className="rounded-xl p-4 bg-[#1a1710] border border-amber-500/[0.15]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">Alert</span>
          </div>
          <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Stok Menipis</p>
          <p className="text-3xl font-bold text-white mt-1">{stokMenipis}</p>
          <p className="text-[11px] text-zinc-500 mt-1">Produk perlu restock</p>
        </div>

        {/* Stok Habis (detail) */}
        <div className="rounded-xl p-4 bg-[#1a1212] border border-red-500/[0.15]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/15 text-[#DC2626] border border-red-500/30">Critical</span>
          </div>
          <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Stok Habis</p>
          <p className="text-3xl font-bold text-white mt-1">{stokHabis}</p>
          <p className="text-[11px] text-zinc-500 mt-1">Produk tidak tersedia</p>
        </div>

        {/* Nilai Aset */}
        <div className="rounded-xl p-4 bg-[#14121a] border border-[#432DD7]/[0.2]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#432DD7]/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#432DD7]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#432DD7]/15 text-[#7c6de8] border border-[#432DD7]/30">Value</span>
          </div>
          <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Nilai Aset</p>
          <p className="text-2xl font-bold text-white mt-1">{formatRp(nilaiAset)}</p>
          <p className="text-[11px] text-zinc-500 mt-1">Total nilai inventory</p>
        </div>
      </div>

      {/* Controls: Search, Filter, Export */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <input
            type="text"
            placeholder="Cari SKU atau nama produk..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#1a1a1a] border border-white/[0.08] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/[0.2] transition"
          />
        </div>

        {/* Filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-2.5 rounded-lg bg-[#1a1a1a] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-white/[0.2] transition cursor-pointer"
        >
          <option value="all">Semua Status</option>
          <option value="aman">Aman</option>
          <option value="menipis">Menipis</option>
          <option value="habis">Habis</option>
        </select>

        {/* Export Buttons */}
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-sm font-medium hover:bg-white/[0.08] hover:border-white/[0.12] transition">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            CSV
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-sm font-medium hover:bg-white/[0.08] hover:border-white/[0.12] transition">
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H6.75a2.25 2.25 0 00-2.25 2.25v13.5a2.25 2.25 0 002.25 2.25h6m3.75-6l2.25 2.25m0 0l2.25 2.25M18 16.5l2.25-2.25M18 16.5l-2.25 2.25" /></svg>
            PDF
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-xl overflow-hidden border border-white/[0.06] bg-[#1a1a1a]">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#111111] border-b border-white/[0.06]">
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Kode</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Nama Barang</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Unit</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Stok Awal</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Barang Masuk</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Barang Keluar</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Stok Akhir</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-zinc-500">Tidak ada data ditemukan</td></tr>
              ) : (
                filtered.map(r => (
                  <tr key={r.product.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-4 py-3 font-mono text-[12px] text-zinc-400">{r.product.sku}</td>
                    <td className="px-4 py-3 text-[13px] font-medium text-white">{r.product.name}</td>
                    <td className="px-4 py-3 text-center text-[12px] text-zinc-500">pcs</td>
                    <td className="px-4 py-3 text-right text-[13px] text-zinc-300">{r.stockAwal}</td>
                    <td className="px-4 py-3 text-right text-[13px] text-emerald-400 font-medium">{r.masuk > 0 ? `+${r.masuk}` : '0'}</td>
                    <td className="px-4 py-3 text-right text-[13px] text-red-400 font-medium">{r.keluar > 0 ? `-${r.keluar}` : '0'}</td>
                    <td className={`px-4 py-3 text-right text-[13px] font-bold ${
                      r.status === 'habis' ? 'text-red-400' : r.status === 'menipis' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>{r.stockAkhir}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-500 text-sm">Tidak ada data ditemukan</p>
          </div>
        ) : (
          filtered.map(r => (
            <div key={r.product.id} className="rounded-xl p-4 bg-[#1a1a1a] border border-white/[0.06]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[13px] font-semibold text-white">{r.product.name}</p>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{r.product.sku}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                  <p className="text-[10px] text-zinc-500 uppercase">Awal</p>
                  <p className="text-[13px] font-semibold text-zinc-300 mt-0.5">{r.stockAwal}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-emerald-500/[0.06]">
                  <p className="text-[10px] text-emerald-400 uppercase">Masuk</p>
                  <p className="text-[13px] font-semibold text-emerald-400 mt-0.5">+{r.masuk}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-red-500/[0.06]">
                  <p className="text-[10px] text-red-400 uppercase">Keluar</p>
                  <p className="text-[13px] font-semibold text-red-400 mt-0.5">-{r.keluar}</p>
                </div>
                <div className={`text-center p-2 rounded-lg ${
                  r.status === 'habis' ? 'bg-red-500/[0.08]' : r.status === 'menipis' ? 'bg-amber-500/[0.08]' : 'bg-emerald-500/[0.08]'
                }`}>
                  <p className="text-[10px] text-zinc-400 uppercase">Akhir</p>
                  <p className={`text-[13px] font-bold mt-0.5 ${
                    r.status === 'habis' ? 'text-red-400' : r.status === 'menipis' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>{r.stockAkhir}</p>
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
    aman: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    menipis: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    habis: 'bg-red-500/15 text-red-400 border-red-500/30',
  }
  const labels = { aman: 'Aman', menipis: 'Menipis', habis: 'Habis' }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
