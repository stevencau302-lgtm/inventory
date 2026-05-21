'use client'

import { useEffect, useState, useRef } from 'react'
import { Product, Transaction, getProducts, getTransactions, saveProducts, saveTransactions, formatRp, uid, loadSampleData } from '@/lib/store'
import { useToast } from '@/components/Toast'

type Tab = 'form' | 'history'
type TransactionType = 'in' | 'out'

export default function TransactionsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [tab, setTab] = useState<Tab>('form')
  const [type, setType] = useState<TransactionType>('in')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const [mounted, setMounted] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    let p = getProducts()
    if (p.length === 0) { const data = loadSampleData(); p = data.products }
    setProducts(p)
    setTransactions(getTransactions())
    setMounted(true)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
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
    setShowDropdown(false)
  }

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
  }

  const selectedProductData = products.find(p => p.id === selectedProduct)

  return (
    <div className="max-w-2xl mx-auto space-y-5 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-neo-black">Transaksi</h1>
          <p className="text-sm font-medium text-cozy-muted mt-0.5">{transactions.length} riwayat tercatat</p>
        </div>
        <div className="px-3 py-1.5 bg-neo-yellow border-2 border-neo-black rounded-md shadow-neo-sm font-bold text-xs">
          {transactions.length} LOG
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('form')}
          className={`flex-1 py-3 text-sm font-bold rounded-lg border-2 border-neo-black transition-all duration-100 ${
            tab === 'form'
              ? 'bg-neo-orange text-white shadow-neo-sm'
              : 'bg-white text-neo-black hover:bg-gray-50'
          }`}
        >
          Buat Baru
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex-1 py-3 text-sm font-bold rounded-lg border-2 border-neo-black transition-all duration-100 ${
            tab === 'history'
              ? 'bg-neo-indigo text-white shadow-neo-sm'
              : 'bg-white text-neo-black hover:bg-gray-50'
          }`}
        >
          Riwayat
        </button>
      </div>

      {/* Form Tab */}
      {tab === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('in')}
              className={`p-4 rounded-lg border-3 text-left transition-all duration-100 ${
                type === 'in'
                  ? 'bg-emerald-100 border-neo-black shadow-neo-sm'
                  : 'bg-white border-2 border-gray-200 hover:border-neo-black'
              }`}
              style={{ borderWidth: type === 'in' ? '3px' : undefined }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 border-neo-black ${type === 'in' ? 'bg-neo-emerald text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" /></svg>
                </div>
                <div>
                  <p className={`text-sm font-black ${type === 'in' ? 'text-emerald-800' : 'text-gray-500'}`}>MASUK</p>
                  <p className="text-xs font-medium text-gray-500">Stok bertambah +</p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setType('out')}
              className={`p-4 rounded-lg border-3 text-left transition-all duration-100 ${
                type === 'out'
                  ? 'bg-red-100 border-neo-black shadow-neo-sm'
                  : 'bg-white border-2 border-gray-200 hover:border-neo-black'
              }`}
              style={{ borderWidth: type === 'out' ? '3px' : undefined }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 border-neo-black ${type === 'out' ? 'bg-neo-red text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" /></svg>
                </div>
                <div>
                  <p className={`text-sm font-black ${type === 'out' ? 'text-red-800' : 'text-gray-500'}`}>KELUAR</p>
                  <p className="text-xs font-medium text-gray-500">Stok berkurang -</p>
                </div>
              </div>
            </button>
          </div>

          {/* Product search & select */}
          <div className="space-y-2 relative" ref={dropdownRef}>
            <label className="text-xs font-black text-neo-black uppercase tracking-wider">Produk</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              <input
                type="text"
                value={productSearch}
                onChange={e => { setProductSearch(e.target.value); setShowDropdown(true); setSelectedProduct('') }}
                onFocus={() => setShowDropdown(true)}
                className="form-input pl-10"
                placeholder="Cari nama produk..."
                autoComplete="off"
              />
              {productSearch && (
                <button type="button" onClick={() => { setProductSearch(''); setSelectedProduct(''); setShowDropdown(true) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-neo-black">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border-3 border-neo-black rounded-lg shadow-neo-sm max-h-52 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm font-bold text-gray-400">Produk tidak ditemukan</div>
                ) : (
                  filteredProducts.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProduct(p.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neo-yellow/30 transition-colors border-b-2 border-gray-100 last:border-b-0 ${selectedProduct === p.id ? 'bg-neo-yellow/30' : ''}`}
                    >
                      <div className="w-9 h-9 rounded-md bg-neo-indigo border-2 border-neo-black flex items-center justify-center text-[10px] font-black text-white shrink-0">{p.name.substring(0,2).toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-neo-black truncate">{p.name}</p>
                        <p className="text-xs text-gray-500 font-medium">{p.category} · Stok: {p.stock}</p>
                      </div>
                      <span className="text-xs font-bold text-gray-600 shrink-0">{formatRp(p.price)}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected info */}
          {selectedProductData && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border-3 border-neo-black shadow-neo-sm">
              <div className="w-11 h-11 rounded-md bg-neo-indigo border-2 border-neo-black flex items-center justify-center text-xs font-black text-white shrink-0">{selectedProductData.name.substring(0,2).toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-neo-black truncate">{selectedProductData.name}</p>
                <p className="text-xs text-gray-600 font-medium">{selectedProductData.category} · {formatRp(selectedProductData.price)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-black text-neo-black">{selectedProductData.stock}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase">stok</p>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <label className="text-xs font-black text-neo-black uppercase tracking-wider">Jumlah</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-lg bg-white border-3 border-neo-black flex items-center justify-center font-black text-neo-black shadow-neo-sm hover:shadow-neo-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 shrink-0"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
              </button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={e => setQuantity(Math.max(1, +e.target.value))}
                className="form-input text-center text-xl font-black flex-1 min-w-0"
              />
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 rounded-lg bg-white border-3 border-neo-black flex items-center justify-center font-black text-neo-black shadow-neo-sm hover:shadow-neo-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 shrink-0"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              </button>
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <label className="text-xs font-black text-neo-black uppercase tracking-wider">Catatan (opsional)</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} className="form-input" placeholder="Catatan singkat..." />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={`w-full py-4 rounded-lg text-white font-black text-sm transition-all duration-100 flex items-center justify-center gap-2 border-3 border-neo-black ${
              type === 'in'
                ? 'bg-neo-emerald shadow-neo-sm hover:shadow-neo-hover hover:translate-x-[2px] hover:translate-y-[2px]'
                : 'bg-neo-red shadow-neo-sm hover:shadow-neo-hover hover:translate-x-[2px] hover:translate-y-[2px]'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            <span>CATAT TRANSAKSI</span>
          </button>
        </form>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="text-center py-14 neo-card p-8">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              <p className="text-sm font-bold text-gray-400">Belum ada riwayat transaksi</p>
            </div>
          ) : (
            transactions.map(tx => (
              <div key={tx.id} className="neo-card p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 border-2 border-neo-black ${tx.type === 'in' ? 'bg-emerald-200' : 'bg-red-200'}`}>
                  {tx.type === 'in' ? (
                    <svg className="w-5 h-5 text-emerald-700" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" /></svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-700" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" /></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-neo-black truncate">{tx.productName}</p>
                  <p className="text-xs text-gray-500 font-medium">
                    {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {tx.note && ` · ${tx.note}`}
                  </p>
                </div>
                <span className={`text-sm font-black px-2.5 py-1 rounded-md border-2 border-neo-black shrink-0 ${tx.type === 'in' ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'}`}>
                  {tx.type === 'in' ? '+' : '-'}{tx.quantity}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
