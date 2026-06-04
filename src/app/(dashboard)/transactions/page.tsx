'use client'

import { useEffect, useState } from 'react'
import { Product, Transaction, formatRp, fetchProducts, fetchTransactions, deleteTransaction, saveTransaction, saveProduct } from '@/lib/store'
import { useToast } from '@/components/Toast'
import DeleteModal from '@/components/DeleteModal'
import Link from 'next/link'
import { CardListSkeleton } from '@/components/PageSkeleton'

type TabFilter = 'all' | 'in' | 'out'
type PeriodFilter = 'today' | '7days' | 'this-month' | 'last-month' | 'custom'

function getDateRange(period: PeriodFilter, customFrom: string, customTo: string): { from: Date; to: Date } {
  const now = new Date()
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

  switch (period) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) }
    case '7days':
      const sevenAgo = new Date(now)
      sevenAgo.setDate(sevenAgo.getDate() - 6)
      return { from: startOfDay(sevenAgo), to: endOfDay(now) }
    case 'this-month':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfDay(now) }
    case 'last-month':
      const firstLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      return { from: firstLastMonth, to: endOfDay(lastDayLastMonth) }
    case 'custom':
      return {
        from: customFrom ? startOfDay(new Date(customFrom)) : startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: customTo ? endOfDay(new Date(customTo)) : endOfDay(now),
      }
    default:
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfDay(now) }
  }
}

export default function TransactionsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [mounted, setMounted] = useState(false)
  const [tabFilter, setTabFilter] = useState<TabFilter>('all')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('this-month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQuantity, setEditQuantity] = useState<number>(0)
  const [editNote, setEditNote] = useState<string>('')
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' })
  const [txPage, setTxPage] = useState(1)
  const txPerPage = 15
  const { toast } = useToast()

  useEffect(() => {
    async function loadData() {
      const p = await fetchProducts()
      setProducts(p)
      const tx = await fetchTransactions()
      setTransactions(tx)
      setMounted(true)
    }
    loadData()
  }, [])
  if (!mounted) return <CardListSkeleton />

  const { from: periodFrom, to: periodTo } = getDateRange(periodFilter, customFrom, customTo)

  const periodTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.createdAt)
    return txDate >= periodFrom && txDate <= periodTo
  })

  const totalIn = periodTransactions.filter(t => t.type === 'in').reduce((s, t) => s + t.quantity, 0)
  const totalOut = periodTransactions.filter(t => t.type === 'out').reduce((s, t) => s + t.quantity, 0)
  const inCount = periodTransactions.filter(t => t.type === 'in').length
  const outCount = periodTransactions.filter(t => t.type === 'out').length

  const filteredTx = periodTransactions.filter(tx => {
    const matchTab = tabFilter === 'all' || tx.type === tabFilter
    const matchSearch = !search || tx.productName.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const totalTxPages = Math.max(1, Math.ceil(filteredTx.length / txPerPage))
  const paginatedTx = filteredTx.slice((txPage - 1) * txPerPage, txPage * txPerPage)

  const handleDelete = (id: string, productName: string) => {
    setDeleteModal({ open: true, id, name: productName })
  }

  const confirmDelete = async () => {
    // Find the transaction to rollback stock
    const tx = transactions.find(t => t.id === deleteModal.id)
    if (tx) {
      const product = products.find(p => p.id === tx.productId)
      if (product) {
        // Rollback: if it was 'out', add stock back; if 'in', subtract stock back
        const rollbackStock = tx.type === 'out'
          ? product.stock + tx.quantity
          : Math.max(0, product.stock - tx.quantity)
        const updatedProduct = { ...product, stock: rollbackStock, updatedAt: new Date().toISOString() }
        await saveProduct(updatedProduct)
        setProducts(prev => prev.map(p => p.id === product.id ? updatedProduct : p))
      }
    }
    await deleteTransaction(deleteModal.id)
    setTransactions(prev => prev.filter(t => t.id !== deleteModal.id))
    toast('Transaksi dihapus & stok dikembalikan!', 'success')
    setDeleteModal({ open: false, id: '', name: '' })
  }

  const handleEditStart = (tx: Transaction) => {
    setEditingId(tx.id)
    setEditQuantity(tx.quantity)
    setEditNote(tx.note)
  }

  const handleEditSave = async (tx: Transaction) => {
    const updatedTx: Transaction = { ...tx, quantity: editQuantity, note: editNote }
    await saveTransaction(updatedTx)
    setTransactions(prev => prev.map(t => t.id === tx.id ? updatedTx : t))
    setEditingId(null)
    toast('Transaksi berhasil diperbarui!', 'success')
  }

  const handleEditCancel = () => {
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="rounded-2xl bg-white border border-gray-200 p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FF5F03]/10 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-[#FF5F03]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Transaksi Barang</h1>
              <p className="text-gray-500 text-sm mt-0.5">Catat setiap barang masuk dan keluar dengan cepat</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/transactions/new" className="px-4 py-2 rounded-lg bg-[#FF5F03] hover:bg-[#FF5F03]/90 text-[#1a1a1a] text-sm font-bold transition flex items-center gap-2 shadow-lg shadow-[#FF5F03]/20 active:scale-95">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Catat Transaksi
            </Link>
            <Link href="/transactions/return" className="px-4 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[#D97706] text-sm font-bold transition flex items-center gap-2 active:scale-95">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
              Return Masuk
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl p-4 bg-white border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-[#16A34A]/15 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-[#16A34A]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">Barang Masuk</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalIn} <span className="text-xs font-medium text-gray-500">unit</span></p>
        </div>
        <div className="rounded-xl p-4 bg-white border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-[#DC2626]/15 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-[#DC2626]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" /></svg>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">Barang Keluar</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalOut} <span className="text-xs font-medium text-gray-500">unit</span></p>
        </div>
        <div className="rounded-xl p-4 bg-white border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-[#FF5F03]/15 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-[#FF5F03]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">Total Produk</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{products.length}</p>
        </div>
        <div className="rounded-xl p-4 bg-white border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-[#818cf8]/15 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-[#818cf8]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">Total Transaksi</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{periodTransactions.length}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <input type="text" placeholder="Cari produk / SKU..." value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-10" />
        </div>
        <select value={tabFilter} onChange={e => setTabFilter(e.target.value as TabFilter)} className="form-input" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
          <option value="all">Semua Tipe</option>
          <option value="in">Barang Masuk</option>
          <option value="out">Barang Keluar</option>
        </select>
        {/* Period Filter */}
        <div className="relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
          <select
            value={periodFilter}
            onChange={e => setPeriodFilter(e.target.value as PeriodFilter)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#FF5F03]/50 transition cursor-pointer appearance-none"
            style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}
          >
            <option value="today">Hari Ini</option>
            <option value="7days">7 Hari Terakhir</option>
            <option value="this-month">Bulan Ini</option>
            <option value="last-month">Bulan Lalu</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      {/* Custom Date Range */}
      {periodFilter === 'custom' && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-1 block">Dari Tanggal</label>
            <input
              type="date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#FF5F03]/50 transition"
              style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}
            />
          </div>
          <div className="flex-1">
            <label className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-1 block">Sampai Tanggal</label>
            <input
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#FF5F03]/50 transition"
              style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}
            />
          </div>
        </div>
      )}

      {/* Tab Pills */}
      <div className="flex gap-2">
        <button onClick={() => setTabFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tabFilter === 'all' ? 'bg-[#FF5F03] text-[#1a1a1a]' : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-900'}`}>
          Semua <span className="ml-1 text-[10px] opacity-70">({transactions.length})</span>
        </button>
        <button onClick={() => setTabFilter('in')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tabFilter === 'in' ? 'bg-[#16A34A] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-900'}`}>
          Masuk <span className="ml-1 text-[10px] opacity-70">({inCount})</span>
        </button>
        <button onClick={() => setTabFilter('out')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tabFilter === 'out' ? 'bg-[#DC2626] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-900'}`}>
          Keluar <span className="ml-1 text-[10px] opacity-70">({outCount})</span>
        </button>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-2.5">
        {paginatedTx.map((tx) => (
          <div key={tx.id} className="relative rounded-xl bg-white border border-gray-200 px-3.5 py-3 transition-all">
            {/* Action buttons — top right */}
            {editingId !== tx.id && (
              <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                <button onClick={() => handleEditStart(tx)} className="w-[36px] h-[36px] rounded-lg bg-gray-100 flex items-center justify-center active:scale-90 transition-all">
                  <svg className="w-4 h-4 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                </button>
                <button onClick={() => handleDelete(tx.id, tx.productName)} className="w-[36px] h-[36px] rounded-lg bg-gray-100 flex items-center justify-center active:scale-90 transition-all">
                  <svg className="w-4 h-4 text-[#DC2626]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 pr-20">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-900 truncate">{tx.productName}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {tx.note && ` · ${tx.note}`}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${tx.type === 'in' ? 'bg-[#16A34A]/10 text-[#16A34A]' : 'bg-[#DC2626]/10 text-[#DC2626]'}`}>
                {tx.type === 'in' ? 'MASUK' : 'KELUAR'}
              </span>
              <p className={`text-base font-bold ${tx.type === 'in' ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                {tx.type === 'in' ? '+' : '-'}{tx.quantity} <span className="text-[11px] font-medium text-gray-500">unit</span>
              </p>
            </div>

            {/* Edit mode inline */}
            {editingId === tx.id && (
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                <input type="number" value={editQuantity} onChange={e => setEditQuantity(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/50" min={1} placeholder="Jumlah" />
                <input type="text" value={editNote} onChange={e => setEditNote(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/50" placeholder="Catatan..." />
                <div className="flex gap-2">
                  <button onClick={() => handleEditSave(tx)} className="flex-1 py-2 rounded-lg bg-[#16A34A] text-white text-xs font-bold active:scale-95 transition-all">Simpan</button>
                  <button onClick={handleEditCancel} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold active:scale-95 transition-all">Batal</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filteredTx.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FF5F03]/10 border border-[#FF5F03]/20 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#FF5F03]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Belum ada transaksi</h3>
            <p className="text-sm text-gray-500 text-center max-w-xs mb-5">Catat barang masuk atau keluar untuk memulai tracking inventory.</p>
            <Link href="/transactions/new" className="px-5 py-2.5 rounded-lg bg-[#FF5F03] text-[#000000] text-sm font-bold shadow-lg shadow-[#FF5F03]/20 hover:shadow-[#FF5F03]/30 hover:bg-[#FF5F03]/90 transition-all active:scale-95">
              Catat Transaksi Pertama
            </Link>
          </div>
        )}

      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-xl overflow-hidden bg-white border border-gray-200">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50">
                <th className="border-b border-gray-200 w-[48px] px-2 py-3 text-center text-[11px] font-bold text-gray-900 uppercase tracking-wide">No</th>
                <th className="border-b border-gray-200 px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wide">Produk</th>
                <th className="border-b border-gray-200 w-[100px] px-2 py-3 text-center text-[11px] font-bold text-gray-900 uppercase tracking-wide">Tipe</th>
                <th className="border-b border-gray-200 w-[80px] px-2 py-3 text-center text-[11px] font-bold text-gray-900 uppercase tracking-wide">Jumlah</th>
                <th className="border-b border-gray-200 w-[180px] px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wide">Tanggal</th>
                <th className="border-b border-gray-200 px-3 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wide">Catatan</th>
                <th className="border-b border-gray-200 w-[90px] px-2 py-3 text-center text-[11px] font-bold text-gray-900 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTx.map((tx, idx) => (
                <tr key={tx.id} className={`hover:bg-gray-50 transition ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                  <td className="border-b border-gray-100 px-2 py-2.5 text-center text-xs text-gray-500 font-medium">{idx + 1}</td>
                  <td className="border-b border-gray-100 px-3 py-2.5 text-sm font-medium text-gray-900">{tx.productName}</td>
                  <td className="border-b border-gray-100 px-2 py-2.5 text-center">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold whitespace-nowrap ${tx.type === 'in' ? 'bg-[#16A34A]/15 text-[#16A34A]' : 'bg-[#DC2626]/15 text-[#DC2626]'}`}>
                      {tx.type === 'in' ? 'MASUK' : 'KELUAR'}
                    </span>
                  </td>
                  <td className={`border-b border-gray-100 px-2 py-2.5 text-center font-mono text-sm font-bold ${tx.type === 'in' ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                    {editingId === tx.id ? (
                      <input
                        type="number"
                        value={editQuantity}
                        onChange={e => setEditQuantity(Number(e.target.value))}
                        className="w-16 px-1 py-0.5 rounded bg-gray-100 border border-gray-300 text-center text-sm text-gray-900"
                        min={1}
                      />
                    ) : (
                      <>{tx.type === 'in' ? '+' : '-'}{tx.quantity}</>
                    )}
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2.5 text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="border-b border-gray-100 px-3 py-2.5 text-xs text-gray-500">
                    {editingId === tx.id ? (
                      <input
                        type="text"
                        value={editNote}
                        onChange={e => setEditNote(e.target.value)}
                        className="w-full px-2 py-0.5 rounded bg-gray-100 border border-gray-300 text-sm text-gray-900"
                        placeholder="Catatan..."
                      />
                    ) : (
                      tx.note || '-'
                    )}
                  </td>
                  <td className="border-b border-gray-100 px-2 py-2.5 text-center">
                    <div className="flex justify-center gap-1">
                      {editingId === tx.id ? (
                        <>
                          <button onClick={() => handleEditSave(tx)} className="w-7 h-7 rounded bg-emerald-50 text-[#16A34A] hover:bg-emerald-500 hover:text-white flex items-center justify-center transition">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          </button>
                          <button onClick={handleEditCancel} className="w-7 h-7 rounded bg-zinc-500/10 text-gray-500 hover:bg-zinc-500 hover:text-white flex items-center justify-center transition">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEditStart(tx)} className="w-7 h-7 rounded bg-[#072C2C]/10 text-[#072C2C] hover:bg-[#072C2C] hover:text-white flex items-center justify-center transition">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                          </button>
                          <button onClick={() => handleDelete(tx.id, tx.productName)} className="w-7 h-7 rounded bg-red-50 text-[#DC2626] hover:bg-[#DC2626] hover:text-white flex items-center justify-center transition">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTx.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-0">
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                      <div className="w-16 h-16 rounded-2xl bg-[#FF5F03]/10 border border-[#FF5F03]/20 flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-[#FF5F03]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-1">Belum ada transaksi</h3>
                      <p className="text-sm text-gray-500 text-center max-w-xs mb-5">Catat barang masuk atau keluar untuk memulai tracking inventory.</p>
                      <Link href="/transactions/new" className="px-5 py-2.5 rounded-lg bg-[#FF5F03] text-[#000000] text-sm font-bold shadow-lg shadow-[#FF5F03]/20 hover:shadow-[#FF5F03]/30 hover:bg-[#FF5F03]/90 transition-all active:scale-95">
                        Catat Transaksi Pertama
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredTx.length > txPerPage && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-gray-500">
            Menampilkan {((txPage - 1) * txPerPage) + 1}–{Math.min(txPage * txPerPage, filteredTx.length)} dari {filteredTx.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTxPage(p => Math.max(1, p - 1))}
              disabled={txPage === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:bg-[#FF5F03] hover:text-black hover:border-[#FF5F03] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 disabled:hover:border-gray-200 transition-all"
            >
              Prev
            </button>
            <span className="text-xs text-gray-500 min-w-[60px] text-center">{txPage} / {totalTxPages}</span>
            <button
              onClick={() => setTxPage(p => Math.min(totalTxPages, p + 1))}
              disabled={txPage === totalTxPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:bg-[#FF5F03] hover:text-black hover:border-[#FF5F03] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 disabled:hover:border-gray-200 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <DeleteModal
        isOpen={deleteModal.open}
        title="Hapus Transaksi?"
        productName={deleteModal.name}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ open: false, id: '', name: '' })}
      />
    </div>
  )
}
