'use client'

import { useEffect, useState } from 'react'
import { Product, Transaction, getProducts, getTransactions, formatRp, loadSampleData, fetchProducts, fetchTransactions } from '@/lib/store'
import Link from 'next/link'

type TabFilter = 'all' | 'in' | 'out'

export default function TransactionsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [mounted, setMounted] = useState(false)
  const [tabFilter, setTabFilter] = useState<TabFilter>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function loadData() {
      let p = await fetchProducts()
      if (p.length === 0 && !localStorage.getItem('inv_seeded')) {
        const data = loadSampleData()
        p = data.products
        localStorage.setItem('inv_seeded', '1')
      }
      setProducts(p)
      const tx = await fetchTransactions()
      setTransactions(tx)
      setMounted(true)
    }
    loadData()
  }, [])

  if (!mounted) return null

  const totalIn = transactions.filter(t => t.type === 'in').reduce((s, t) => s + t.quantity, 0)
  const totalOut = transactions.filter(t => t.type === 'out').reduce((s, t) => s + t.quantity, 0)
  const inCount = transactions.filter(t => t.type === 'in').length
  const outCount = transactions.filter(t => t.type === 'out').length

  const filteredTx = transactions.filter(tx => {
    const matchTab = tabFilter === 'all' || tx.type === tabFilter
    const matchSearch = !search || tx.productName.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  return (
    <div className="space-y-6">
      {/* Hero Banner - vibrant orange/yellow gradient */}
      <div className="rounded-2xl border border-white/10 p-6 lg:p-8"
        style={{ background: 'linear-gradient(135deg, #1a0f00 0%, #1c1005 40%, #0f1a0a 100%)' }}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Transaksi Barang</h1>
              <p className="text-zinc-400 text-sm mt-0.5">Catat setiap barang masuk dan keluar dengan cepat</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/transactions/new" className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-emerald-500/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Single Entry
            </Link>
            <button className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-600/20">Bulk Entry</button>
            <button className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold transition shadow-lg shadow-amber-500/20">Email Laporan</button>
          </div>
        </div>
      </div>

      {/* Stat Cards - more vibrant accent colors */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl p-5 border border-white/[0.07]" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, #161616 100%)' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
            </div>
            <p className="text-xs text-zinc-400 font-medium">Barang Masuk</p>
          </div>
          <p className="text-xl font-bold text-emerald-400">{totalIn} <span className="text-sm font-medium text-zinc-500">unit</span></p>
        </div>
        <div className="rounded-xl p-5 border border-white/[0.07]" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, #161616 100%)' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" /></svg>
            </div>
            <p className="text-xs text-zinc-400 font-medium">Barang Keluar</p>
          </div>
          <p className="text-xl font-bold text-red-400">{totalOut} <span className="text-sm font-medium text-zinc-500">unit</span></p>
        </div>
        <div className="rounded-xl p-5 border border-white/[0.07]" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.08) 0%, #161616 100%)' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-orange-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
            </div>
            <p className="text-xs text-zinc-400 font-medium">Total Produk</p>
          </div>
          <p className="text-xl font-bold text-orange-400">{products.length}</p>
        </div>
        <div className="rounded-xl p-5 border border-white/[0.07]" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, #161616 100%)' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
            </div>
            <p className="text-xs text-zinc-400 font-medium">Total Transaksi</p>
          </div>
          <p className="text-xl font-bold text-violet-400">{transactions.length}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <input type="text" placeholder="Cari produk / SKU..." value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-10" />
        </div>
        <select className="form-input" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="">Semua Tipe</option>
          <option value="in">Barang Masuk</option>
          <option value="out">Barang Keluar</option>
        </select>
      </div>

      {/* Tab Pills - more vibrant & saturated */}
      <div className="flex gap-2">
        <button onClick={() => setTabFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tabFilter === 'all' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700'}`}>
          Semua <span className="ml-1.5 text-[10px] opacity-80">({transactions.length})</span>
        </button>
        <button onClick={() => setTabFilter('in')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tabFilter === 'in' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700'}`}>
          Masuk <span className="ml-1.5 text-[10px] opacity-80">({inCount})</span>
        </button>
        <button onClick={() => setTabFilter('out')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tabFilter === 'out' ? 'bg-red-500 text-white shadow-lg shadow-red-500/25' : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700'}`}>
          Keluar <span className="ml-1.5 text-[10px] opacity-80">({outCount})</span>
        </button>
      </div>

      {/* Transaction History Table - vibrant colors */}
      <div className="rounded-xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr style={{ background: '#1a1a1f' }}>
                <th className="border-b border-white/10 w-[48px] px-2 py-3 text-center text-[11px] font-bold text-orange-400/80 uppercase tracking-wide">No</th>
                <th className="border-b border-white/10 px-3 py-3 text-left text-[11px] font-bold text-orange-400/80 uppercase tracking-wide">Produk</th>
                <th className="border-b border-white/10 w-[100px] px-2 py-3 text-center text-[11px] font-bold text-orange-400/80 uppercase tracking-wide">Tipe</th>
                <th className="border-b border-white/10 w-[80px] px-2 py-3 text-center text-[11px] font-bold text-orange-400/80 uppercase tracking-wide">Jumlah</th>
                <th className="border-b border-white/10 w-[180px] px-3 py-3 text-left text-[11px] font-bold text-orange-400/80 uppercase tracking-wide">Tanggal</th>
                <th className="border-b border-white/10 px-3 py-3 text-left text-[11px] font-bold text-orange-400/80 uppercase tracking-wide">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {filteredTx.slice(0, 20).map((tx, idx) => (
                <tr key={tx.id} className={`hover:bg-orange-500/5 transition ${idx % 2 === 1 ? 'bg-white/[0.02]' : ''}`}>
                  <td className="border-b border-white/[0.04] px-2 py-2.5 text-center text-xs text-zinc-500 font-medium">{idx + 1}</td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 text-sm font-medium text-white">{tx.productName}</td>
                  <td className="border-b border-white/[0.04] px-2 py-2.5 text-center">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold whitespace-nowrap ${tx.type === 'in' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                      {tx.type === 'in' ? 'MASUK' : 'KELUAR'}
                    </span>
                  </td>
                  <td className={`border-b border-white/[0.04] px-2 py-2.5 text-center font-mono text-sm font-bold ${tx.type === 'in' ? 'text-emerald-400' : 'text-red-400'}`}>{tx.type === 'in' ? '+' : '-'}{tx.quantity}</td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 text-xs text-zinc-500">{new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 text-xs text-zinc-500">{tx.note || '-'}</td>
                </tr>
              ))}
              {filteredTx.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-zinc-500">Belum ada transaksi</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: '#1a1a1f' }}>
                <td colSpan={3} className="border-t border-white/10 px-3 py-3 text-xs font-semibold text-zinc-300">Total: {filteredTx.length} transaksi</td>
                <td className={`border-t border-white/10 px-2 py-3 text-center font-mono text-sm font-bold ${filteredTx.reduce((s, t) => s + (t.type === 'in' ? t.quantity : -t.quantity), 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{filteredTx.reduce((s, t) => s + (t.type === 'in' ? t.quantity : -t.quantity), 0)}</td>
                <td colSpan={2} className="border-t border-white/10 px-3 py-3 text-xs text-zinc-500">Net movement</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
