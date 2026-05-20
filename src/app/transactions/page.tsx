'use client'

import { useEffect, useState, useRef } from 'react'
import { Product, Transaction, getProducts, getTransactions, saveProducts, saveTransactions, formatRp, uid, loadSampleData } from '@/lib/store'
import { useToast } from '@/components/Toast'

type TransactionType = 'in' | 'out'
type TabFilter = 'all' | 'in' | 'out'

export default function TransactionsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [type, setType] = useState<TransactionType>('in')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const [mounted, setMounted] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [tabFilter, setTabFilter] = useState<TabFilter>('all')
  const [search, setSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const productDropdownRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    let p = getProducts()
    if (p.length === 0) { const data = loadSampleData(); p = data.products }
    setProducts(p)
    setTransactions(getTransactions())
    setMounted(true)
  }, [])

  // Close product dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!mounted) return null

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  )

  const handleSelectProduct = (id: string) => {
    setSelectedProduct(id)
    const p = products.find(pr => pr.id === id)
    if (p) setProductSearch(p.name)
    setShowProductDropdown(false)
  }

  const totalIn = transactions.filter(t => t.type === 'in').reduce((s, t) => s + t.quantity, 0)
  const totalOut = transactions.filter(t => t.type === 'out').reduce((s, t) => s + t.quantity, 0)
  const inCount = transactions.filter(t => t.type === 'in').length
  const outCount = transactions.filter(t => t.type === 'out').length

  const filteredTx = transactions.filter(tx => {
    const matchTab = tabFilter === 'all' || tx.type === tabFilter
    const matchSearch = !search || tx.productName.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) { toast('Pilih produk!', 'error'); return }

    const product = products.find(p => p.id === selectedProduct)
    if (!product) return

    if (type === 'out' && product.stock < quantity) {
      toast(`Stok tidak cukup! Sisa: ${product.stock}`, 'error')
      return
    }

    const updated = products.map(p => {
      if (p.id === selectedProduct) {
        const newStock = type === 'in' ? p.stock + quantity : p.stock - quantity
        return { ...p, stock: newStock, updatedAt: new Date().toISOString() }
      }
      return p
    })

    const newTx: Transaction = {
      id: uid(),
      productId: product.id,
      productName: product.name,
      type,
      quantity,
      note,
      createdAt: new Date().toISOString()
    }

    const updatedTx = [newTx, ...transactions]
    setProducts(updated)
    setTransactions(updatedTx)
    saveProducts(updated)
    saveTransactions(updatedTx)

    toast(type === 'in' ? `+${quantity} ${product.name} masuk` : `-${quantity} ${product.name} keluar`, 'success')
    setSelectedProduct('')
    setProductSearch('')
    setQuantity(1)
    setNote('')
    setModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-950/60 to-zinc-900 p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Transaksi Barang</h1>
              <p className="text-zinc-400 text-sm mt-0.5">Catat setiap barang masuk dan keluar dengan cepat</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setModalOpen(true)} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Single Entry
            </button>
            <button className="px-4 py-2 rounded-lg border border-white/20 text-zinc-300 text-sm font-medium hover:bg-white/5 transition">Bulk Entry</button>
            <button className="px-4 py-2 rounded-lg border border-white/20 text-zinc-300 text-sm font-medium hover:bg-white/5 transition">Email Laporan</button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl p-5 bg-zinc-900/60 border border-white/[0.07] border-l-2 border-l-emerald-400">
          <div className="flex items-center gap-2 mb-1.5">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
            <p className="text-xs text-zinc-400">Barang Masuk</p>
          </div>
          <p className="text-lg font-semibold text-white">{totalIn} unit</p>
        </div>
        <div className="rounded-xl p-5 bg-zinc-900/60 border border-white/[0.07] border-l-2 border-l-red-400">
          <div className="flex items-center gap-2 mb-1.5">
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" /></svg>
            <p className="text-xs text-zinc-400">Barang Keluar</p>
          </div>
          <p className="text-lg font-semibold text-white">{totalOut} unit</p>
        </div>
        <div className="rounded-xl p-5 bg-zinc-900/60 border border-white/[0.07] border-l-2 border-l-indigo-400">
          <div className="flex items-center gap-2 mb-1.5">
            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
            <p className="text-xs text-zinc-400">Total Produk</p>
          </div>
          <p className="text-lg font-semibold text-white">{products.length}</p>
        </div>
        <div className="rounded-xl p-5 bg-zinc-900/60 border border-white/[0.07] border-l-2 border-l-zinc-400">
          <div className="flex items-center gap-2 mb-1.5">
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
            <p className="text-xs text-zinc-400">Total Transaksi</p>
          </div>
          <p className="text-lg font-semibold text-white">{transactions.length}</p>
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

      {/* Tab Pills */}
      <div className="flex gap-2">
        <button onClick={() => setTabFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tabFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
          Semua <span className="ml-1.5 text-[10px] opacity-70">({transactions.length})</span>
        </button>
        <button onClick={() => setTabFilter('in')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tabFilter === 'in' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
          Barang Masuk <span className="ml-1.5 text-[10px] opacity-70">({inCount})</span>
        </button>
        <button onClick={() => setTabFilter('out')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tabFilter === 'out' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
          Barang Keluar <span className="ml-1.5 text-[10px] opacity-70">({outCount})</span>
        </button>
      </div>

      {/* Transaction History Table - Spreadsheet Style */}
      <div className="overflow-hidden border border-white/10">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-zinc-800">
                <th className="border border-white/10 w-[48px] px-2 py-2.5 text-center text-[11px] font-bold text-zinc-400 uppercase tracking-wide">No</th>
                <th className="border border-white/10 px-3 py-2.5 text-left text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Produk</th>
                <th className="border border-white/10 w-[100px] px-2 py-2.5 text-center text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Tipe</th>
                <th className="border border-white/10 w-[80px] px-2 py-2.5 text-center text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Jumlah</th>
                <th className="border border-white/10 w-[180px] px-3 py-2.5 text-left text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Tanggal</th>
                <th className="border border-white/10 px-3 py-2.5 text-left text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {filteredTx.slice(0, 20).map((tx, idx) => (
                <tr key={tx.id} className={`hover:bg-indigo-900/20 transition ${idx % 2 === 1 ? 'bg-zinc-900/40' : 'bg-zinc-950'}`}>
                  <td className="border border-white/10 px-2 py-2 text-center text-xs text-zinc-500">{idx + 1}</td>
                  <td className="border border-white/10 px-3 py-2 text-sm font-medium text-white">{tx.productName}</td>
                  <td className="border border-white/10 px-2 py-2 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${tx.type === 'in' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                      {tx.type === 'in' ? 'Masuk' : 'Keluar'}
                    </span>
                  </td>
                  <td className="border border-white/10 px-2 py-2 text-center font-mono text-sm font-semibold text-zinc-200">{tx.type === 'in' ? '+' : '-'}{tx.quantity}</td>
                  <td className="border border-white/10 px-3 py-2 text-xs text-zinc-500">{new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="border border-white/10 px-3 py-2 text-xs text-zinc-500">{tx.note || '-'}</td>
                </tr>
              ))}
              {filteredTx.length === 0 && (
                <tr><td colSpan={6} className="border border-white/10 text-center py-12 text-zinc-500">Belum ada transaksi</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-zinc-800 border-t-2 border-white/20">
                <td colSpan={3} className="border border-white/10 px-3 py-2.5 text-xs font-medium text-zinc-300">Total: {filteredTx.length} transaksi</td>
                <td className="border border-white/10 px-2 py-2.5 text-center font-mono text-xs font-medium text-zinc-300">{filteredTx.reduce((s, t) => s + (t.type === 'in' ? t.quantity : -t.quantity), 0)}</td>
                <td colSpan={2} className="border border-white/10 px-3 py-2.5 text-xs text-zinc-500">Net movement</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Full Page Form - Single Entry */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#09090B]">
          <div className="min-h-full w-full max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between rounded-xl sm:rounded-2xl mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Transaksi Baru</h2>
                  <p className="text-emerald-200/70 text-xs">Input data barang masuk / keluar</p>
                </div>
              </div>
              <button onClick={() => { setModalOpen(false); setProductSearch(''); setSelectedProduct('') }} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 rounded-xl sm:rounded-2xl border border-white/[0.08] bg-[#161616] p-4 sm:p-6">
              {/* Tipe Transaksi */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-4.5L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>
                  <p className="text-xs font-semibold text-zinc-300">Tipe Transaksi *</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setType('in')}
                    className={`p-4 rounded-xl border text-left transition-all ${type === 'in' ? 'bg-emerald-500/20 border-emerald-500' : 'bg-zinc-800 border-white/10 hover:border-white/20'}`}>
                    <div className="flex items-center gap-2.5">
                      <svg className={`w-5 h-5 ${type === 'in' ? 'text-emerald-400' : 'text-zinc-500'}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" /></svg>
                      <div>
                        <p className={`text-sm font-semibold ${type === 'in' ? 'text-emerald-400' : 'text-zinc-300'}`}>Barang Masuk</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Stok barang akan bertambah</p>
                      </div>
                    </div>
                  </button>
                  <button type="button" onClick={() => setType('out')}
                    className={`p-4 rounded-xl border text-left transition-all ${type === 'out' ? 'bg-red-500/20 border-red-500' : 'bg-zinc-800 border-white/10 hover:border-white/20'}`}>
                    <div className="flex items-center gap-2.5">
                      <svg className={`w-5 h-5 ${type === 'out' ? 'text-red-400' : 'text-zinc-500'}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" /></svg>
                      <div>
                        <p className={`text-sm font-semibold ${type === 'out' ? 'text-red-400' : 'text-zinc-300'}`}>Barang Keluar</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Stok barang akan berkurang</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Detail Produk */}
              <div className="bg-indigo-950/40 rounded-xl px-4 py-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                  <p className="text-xs font-semibold text-indigo-300">Detail Produk *</p>
                </div>
                <div className="relative" ref={productDropdownRef}>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                    <input
                      type="text"
                      value={productSearch}
                      onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); setSelectedProduct('') }}
                      onFocus={() => setShowProductDropdown(true)}
                      className="form-input text-sm w-full pl-9"
                      placeholder="Cari nama produk..."
                      autoComplete="off"
                      style={{ color: '#fafafa', background: '#18181b' }}
                    />
                    {productSearch && (
                      <button type="button" onClick={() => { setProductSearch(''); setSelectedProduct(''); setShowProductDropdown(true) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>
                  {showProductDropdown && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#1c1c1e] border border-white/10 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredProducts.length === 0 ? (
                        <div className="px-3 py-4 text-center text-xs text-zinc-500">Produk tidak ditemukan</div>
                      ) : (
                        filteredProducts.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectProduct(p.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-zinc-800 transition-colors first:rounded-t-xl last:rounded-b-xl ${selectedProduct === p.id ? 'bg-zinc-800' : ''}`}
                          >
                            <div className="w-7 h-7 rounded-lg bg-indigo-900/50 flex items-center justify-center text-[9px] font-bold text-indigo-300 shrink-0">{p.name.substring(0,2).toUpperCase()}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-medium text-white truncate">{p.name}</p>
                              <p className="text-[10px] text-zinc-500">{p.category} · Stok: {p.stock}</p>
                            </div>
                            <span className="text-[10px] text-zinc-500 shrink-0">{formatRp(p.price)}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block">Jumlah *</label>
                    <input type="number" min={1} value={quantity} onChange={e => setQuantity(Math.max(1, +e.target.value))} className="form-input text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block">Tanggal</label>
                    <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="form-input text-sm" />
                  </div>
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                  <p className="text-xs font-semibold text-amber-300">Keterangan</p>
                </div>
                <textarea value={note} onChange={e => setNote(e.target.value)} className="form-input text-sm w-full" rows={2} placeholder="Catatan Transaksi (Opsional)" />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                <p className="text-[10px] text-zinc-600">Field bertanda * wajib diisi</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setModalOpen(false); setProductSearch(''); setSelectedProduct('') }} className="px-4 py-2 rounded-lg border border-white/20 text-zinc-300 text-sm font-medium hover:bg-white/5 transition">Batal</button>
                  <button type="submit" className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3h11l5 5v11a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M7 3v5h8V3" /><path strokeLinecap="round" strokeLinejoin="round" d="M7 21v-7h10v7" /></svg>
                    Catat Transaksi
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
