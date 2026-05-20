'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Product, Transaction, getProducts, getTransactions, saveProducts, saveTransactions, uid, loadSampleData } from '@/lib/store'
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
    <div className="min-h-screen bg-[#09090B]">
      {/* Header */}
      <div className="border-b border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <button
            onClick={() => router.push('/transactions')}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition mb-3"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Kembali
          </button>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <span>Transaksi</span>
            <span>/</span>
            <span className="text-zinc-300">Transaksi Baru</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Transaksi Baru</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Input data barang masuk atau keluar</p>
        </div>
      </div>


      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-32 md:pb-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column - Form */}
            <div className="md:col-span-7 space-y-6">
              {/* Section: Tipe Transaksi */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-4.5L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                  </svg>
                  <p className="text-sm font-semibold text-zinc-300">Tipe Transaksi</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('in')}
                    className={`p-4 rounded-xl text-left transition-all duration-200 ${
                      type === 'in'
                        ? 'bg-emerald-500/20 border-2 border-emerald-500'
                        : 'bg-zinc-900 border border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        type === 'in' ? 'bg-emerald-500/20' : 'bg-zinc-800'
                      }`}>
                        <svg className={`w-5 h-5 ${type === 'in' ? 'text-emerald-400' : 'text-zinc-500'}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                        </svg>
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${type === 'in' ? 'text-emerald-400' : 'text-zinc-300'}`}>Barang Masuk</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Stok bertambah</p>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('out')}
                    className={`p-4 rounded-xl text-left transition-all duration-200 ${
                      type === 'out'
                        ? 'bg-red-500/20 border-2 border-red-500'
                        : 'bg-zinc-900 border border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        type === 'out' ? 'bg-red-500/20' : 'bg-zinc-800'
                      }`}>
                        <svg className={`w-5 h-5 ${type === 'out' ? 'text-red-400' : 'text-zinc-500'}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                        </svg>
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${type === 'out' ? 'text-red-400' : 'text-zinc-300'}`}>Barang Keluar</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Stok berkurang</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>


              {/* Section: Detail Produk */}
              <div className="space-y-4">
                <div className="bg-indigo-950/40 rounded-lg px-4 py-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                  <p className="text-sm font-semibold text-indigo-300">Detail Produk</p>
                </div>

                {/* Product Search */}
                <div className="relative" ref={productDropdownRef}>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <input
                      type="text"
                      value={productSearch}
                      onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); setSelectedProduct('') }}
                      onFocus={() => setShowProductDropdown(true)}
                      className="form-input text-sm w-full pl-9"
                      placeholder="Cari nama produk atau SKU..."
                      autoComplete="off"
                    />
                    {productSearch && (
                      <button
                        type="button"
                        onClick={() => { setProductSearch(''); setSelectedProduct(''); setShowProductDropdown(true) }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {showProductDropdown && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#1c1c1e] border border-white/10 rounded-xl shadow-2xl max-h-56 overflow-y-auto">
                      {filteredProducts.length === 0 ? (
                        <div className="px-3 py-4 text-center text-xs text-zinc-500">Produk tidak ditemukan</div>
                      ) : (
                        filteredProducts.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectProduct(p.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-zinc-800 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                              selectedProduct === p.id ? 'bg-zinc-800' : ''
                            }`}
                          >
                            <div className="w-8 h-8 rounded-lg bg-indigo-900/50 flex items-center justify-center text-[10px] font-bold text-indigo-300 shrink-0">
                              {p.name.substring(0, 2).toUpperCase()}
                            </div>
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


                {/* Selected Product Info Card */}
                {selected && (
                  <div className="bg-zinc-800 rounded-lg p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-900/50 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                      {selected.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{selected.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-zinc-500">{selected.sku}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-indigo-500/15 text-indigo-400">{selected.category}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-zinc-400">Stok saat ini</p>
                      <p className="text-sm font-bold text-white">{selected.stock}</p>
                    </div>
                  </div>
                )}

                {/* Quantity Stepper */}
                <div>
                  <label className="text-xs text-zinc-400 mb-2 block">Jumlah</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-white hover:bg-zinc-700 transition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                      </svg>
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={e => setQuantity(Math.max(1, +e.target.value))}
                      className="form-input text-center text-lg font-semibold w-24"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-white hover:bg-zinc-700 transition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Date Picker */}
                <div>
                  <label className="text-xs text-zinc-400 mb-2 block">Tanggal</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="form-input text-sm w-full"
                  />
                </div>
              </div>


              {/* Section: Keterangan */}
              <div className="space-y-3">
                <div className="bg-amber-950/40 border border-amber-500/20 rounded-lg px-4 py-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <p className="text-sm font-semibold text-amber-300">Keterangan</p>
                </div>
                <div className="relative">
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value.slice(0, 200))}
                    maxLength={200}
                    className="form-input text-sm w-full resize-none"
                    rows={3}
                    placeholder="Tambahkan catatan atau keterangan..."
                  />
                  <span className="absolute bottom-2 right-3 text-[10px] text-zinc-500">
                    {note.length}/200
                  </span>
                </div>
              </div>
            </div>


            {/* Right Column - Summary */}
            <div className="hidden md:block md:col-span-5">
              <div className="sticky top-6">
                <div className="bg-zinc-900 border border-white/[0.07] rounded-2xl p-6">
                  {/* Summary Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-white">Ringkasan</h3>
                  </div>

                  <div className="h-px bg-white/[0.07] mb-4" />

                  {/* Summary Rows */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">Tipe</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        type === 'in'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-red-500/15 text-red-400'
                      }`}>
                        {type === 'in' ? 'Barang Masuk' : 'Barang Keluar'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">Produk</span>
                      <span className="text-sm text-white font-medium truncate ml-4 max-w-[180px] text-right">
                        {selected ? selected.name : '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">Stok Saat Ini</span>
                      <span className="text-sm text-white">{selected ? currentStock : '-'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">Perubahan</span>
                      <span className={`text-sm font-semibold ${
                        type === 'in' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {selected ? (type === 'in' ? `+${quantity}` : `-${quantity}`) : '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">Stok Setelah</span>
                      <span className="text-lg font-bold text-white">
                        {selected ? stockAfter : '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">Tanggal</span>
                      <span className="text-sm text-white">
                        {new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="h-px bg-white/[0.07] my-4" />


                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h11l5 5v11a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v5h8V3" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21v-7h10v7" />
                        </svg>
                        Simpan Transaksi
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-zinc-600 text-center mt-3">
                    Data akan tersimpan secara lokal di perangkat Anda
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>


      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-[#09090B] border-t border-white/[0.06] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-40">
        <button
          type="button"
          onClick={handleSubmit as unknown as () => void}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Menyimpan...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h11l5 5v11a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v5h8V3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21v-7h10v7" />
              </svg>
              Simpan Transaksi
            </>
          )}
        </button>
      </div>
    </div>
  )
}
