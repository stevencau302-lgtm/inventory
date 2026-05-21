'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Product, Transaction, getProducts, getTransactions, saveProducts, saveTransactions, formatRp, uid, loadSampleData } from '@/lib/store'
import { useToast } from '@/components/Toast'

type TransactionType = 'in' | 'out'

export default function NewTransactionPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [type, setType] = useState<TransactionType>('in')
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)

  const productDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let p = getProducts()
    if (p.length === 0) {
      const data = loadSampleData()
      p = data.products
    }
    setProducts(p)
    setTransactions(getTransactions())
    setMounted(true)
  }, [])

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
    p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  )

  const selected = products.find(p => p.id === selectedProduct)

  const handleSelectProduct = (id: string) => {
    setSelectedProduct(id)
    const p = products.find(pr => pr.id === id)
    if (p) setProductSearch(p.name)
    setShowProductDropdown(false)
  }

  const currentStock = selected ? selected.stock : 0
  const stockChange = type === 'in' ? quantity : -quantity
  const stockAfter = selected ? currentStock + stockChange : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) {
      toast('Pilih produk terlebih dahulu!', 'error')
      return
    }

    const product = products.find(p => p.id === selectedProduct)
    if (!product) return

    if (type === 'out' && product.stock < quantity) {
      toast(`Stok tidak cukup! Sisa: ${product.stock}`, 'error')
      return
    }

    setLoading(true)

    setTimeout(() => {
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
        createdAt: new Date().toISOString(),
      }

      const updatedTx = [newTx, ...transactions]
      saveProducts(updated)
      saveTransactions(updatedTx)

      toast(
        type === 'in'
          ? `+${quantity} ${product.name} berhasil dicatat masuk`
          : `-${quantity} ${product.name} berhasil dicatat keluar`,
        'success'
      )
      router.push('/transactions')
    }, 500)
  }

  return (
    <div className="relative overflow-hidden min-h-screen flex items-start justify-center py-6 px-4 sm:px-6"
      style={{ background: 'linear-gradient(160deg, #0a0a1a 0%, #0d1117 25%, #091210 50%, #0d0d1a 75%, #0a0a1a 100%)' }}
    >
      {/* Grid pattern */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />
      {/* Dot accent on grid intersections */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.12) 1.5px, transparent 1.5px)',
        backgroundSize: '48px 48px',
      }} />
      {/* Glow blob 1 — indigo top-left */}
      <div className="absolute pointer-events-none" style={{
        width: '700px', height: '700px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.06) 35%, transparent 60%)',
        top: '-250px', left: '-250px',
      }} />
      {/* Glow blob 2 — emerald bottom-right */}
      <div className="absolute pointer-events-none" style={{
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 35%, transparent 60%)',
        bottom: '-200px', right: '-200px',
      }} />
      {/* Glow blob 3 — violet center */}
      <div className="absolute pointer-events-none" style={{
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, rgba(139,92,246,0.03) 40%, transparent 60%)',
        top: '35%', left: '50%', transform: 'translate(-50%, -50%)',
      }} />
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{
        background: 'linear-gradient(90deg, transparent 10%, rgba(99,102,241,0.4) 35%, rgba(16,185,129,0.4) 65%, transparent 90%)',
      }} />
      <div className="relative w-full max-w-2xl">
        {/* Form Container */}
        <div className="bg-zinc-900 border border-white/[0.07] rounded-2xl overflow-hidden shadow-2xl">

          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-200" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Transaksi Baru</h1>
                <p className="text-emerald-100 text-xs mt-0.5">Input data barang masuk / keluar</p>
              </div>
            </div>
            <button onClick={() => router.push('/transactions')} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">

            {/* Section: Tipe Transaksi */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-4.5L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>
                <span className="text-white font-medium text-sm">Tipe Transaksi</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setType('in')}
                  className={`p-4 rounded-xl text-left transition-all duration-200 ${type === 'in' ? 'bg-emerald-500/20 border-2 border-emerald-500' : 'bg-zinc-800/60 border border-white/10 hover:border-white/20'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type === 'in' ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" /></svg>
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${type === 'in' ? 'text-emerald-400' : 'text-zinc-300'}`}>Barang Masuk</p>
                      <p className="text-zinc-400 text-xs mt-0.5">Stok barang akan bertambah</p>
                    </div>
                  </div>
                </button>
                <button type="button" onClick={() => setType('out')}
                  className={`p-4 rounded-xl text-left transition-all duration-200 ${type === 'out' ? 'bg-red-500/20 border-2 border-red-500' : 'bg-zinc-800/60 border border-white/10 hover:border-white/20'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type === 'out' ? 'bg-red-500' : 'bg-zinc-700'}`}>
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" /></svg>
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${type === 'out' ? 'text-red-400' : 'text-zinc-300'}`}>Barang Keluar</p>
                      <p className="text-zinc-400 text-xs mt-0.5">Stok barang akan berkurang</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Section: Detail Produk */}
            <div>
              <div className="bg-indigo-950/50 border border-indigo-500/20 rounded-xl px-4 py-3 mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                  <div>
                    <p className="text-indigo-400 font-semibold text-sm">Detail Produk</p>
                    <p className="text-indigo-300/60 text-xs">Lengkapi informasi barang</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Product Search */}
                <div>
                  <label className="text-zinc-400 text-sm mb-1.5 block">Pilih Produk <span className="text-red-400">*</span></label>
                  <div className="relative" ref={productDropdownRef}>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                      <input
                        type="text"
                        value={productSearch}
                        onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); setSelectedProduct('') }}
                        onFocus={() => setShowProductDropdown(true)}
                        className="w-full bg-zinc-800/60 border border-white/10 rounded-lg text-white text-sm pl-9 pr-4 py-2.5 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 transition"
                        placeholder="Cari nama produk atau SKU..."
                        autoComplete="off"
                      />
                    </div>
                    {showProductDropdown && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-zinc-800 border border-white/10 rounded-xl shadow-2xl max-h-56 overflow-y-auto">
                        {filteredProducts.length === 0 ? (
                          <div className="px-3 py-4 text-center text-xs text-zinc-500">Produk tidak ditemukan</div>
                        ) : (
                          filteredProducts.map(p => (
                            <button key={p.id} type="button" onClick={() => handleSelectProduct(p.id)}
                              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-zinc-700/50 transition-colors first:rounded-t-xl last:rounded-b-xl ${selectedProduct === p.id ? 'bg-zinc-700/50' : ''}`}>
                              <div className="w-8 h-8 rounded-lg bg-indigo-900/50 flex items-center justify-center text-[10px] font-bold text-indigo-300 shrink-0">{p.name.substring(0, 2).toUpperCase()}</div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-white truncate">{p.name}</p>
                                <p className="text-[10px] text-zinc-500">{p.sku} · {p.category} · Stok: {p.stock}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Info Card */}
                {selected && (
                  <div className="bg-zinc-800 rounded-lg p-3 grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-zinc-400 text-xs mb-0.5">Stok Saat Ini</p>
                      <p className="text-white font-semibold">{selected.stock} <span className="text-zinc-400 text-xs font-normal">unit</span></p>
                    </div>
                    <div>
                      <p className="text-zinc-400 text-xs mb-0.5">Harga</p>
                      <p className="text-white font-semibold text-sm">{formatRp(selected.price)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 text-xs mb-0.5">Min. Stok</p>
                      <p className="text-white font-semibold">{selected.minStock} <span className="text-zinc-400 text-xs font-normal">unit</span></p>
                    </div>
                  </div>
                )}

                {/* Jumlah + Tanggal */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 text-sm mb-1.5 block">Jumlah <span className="text-red-400">*</span></label>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={e => setQuantity(Math.max(1, +e.target.value))}
                      className="w-full bg-zinc-800/60 border border-white/10 rounded-lg text-white text-sm px-3 py-2.5 focus:outline-none focus:border-indigo-500/50 transition"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-sm mb-1.5 block">Tanggal <span className="text-red-400">*</span></label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full bg-zinc-800/60 border border-white/10 rounded-lg text-white text-sm px-3 py-2.5 focus:outline-none focus:border-indigo-500/50 transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Keterangan */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                <span className="text-amber-400 font-semibold text-sm">Keterangan</span>
              </div>
              <div>
                <label className="text-zinc-300 text-sm mb-1.5 block">Catatan Transaksi (Opsional)</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value.slice(0, 200))}
                  maxLength={200}
                  rows={3}
                  className="w-full bg-zinc-800/60 border border-white/10 rounded-lg text-white text-sm px-3 py-2.5 resize-none placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 transition"
                  placeholder="Tambahkan catatan atau keterangan..."
                />
                <p className="text-right text-[10px] text-zinc-500 mt-1">{note.length}/200</p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/[0.07] pt-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                <span>Field bertanda * wajib diisi</span>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => router.push('/transactions')} className="px-4 py-2 rounded-lg border border-white/20 text-zinc-300 text-sm font-medium hover:bg-white/5 transition">Batal</button>
                <button type="submit" disabled={loading} className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition flex items-center gap-2">
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3h11l5 5v11a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M7 3v5h8V3" /><path strokeLinecap="round" strokeLinejoin="round" d="M7 21v-7h10v7" /></svg>
                      Catat Transaksi
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
