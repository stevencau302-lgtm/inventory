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
    <div className="relative overflow-hidden min-h-screen bg-zinc-950"
      style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '32px 32px'
      }}
    >
      {/* Glow blob 1 - indigo/purple top-left */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
          top: '-100px',
          left: '-100px',
        }}
      />
      {/* Glow blob 2 - emerald bottom-right */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)',
          bottom: '-80px',
          right: '-80px',
        }}
      />
    <div className="relative space-y-3 sm:space-y-4 max-w-2xl mx-auto px-1 sm:px-0 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-base sm:text-lg font-bold text-cozy-text dark:text-[#fafafa]">Transaksi</h1>
        <span className="text-[10px] sm:text-[11px] text-cozy-muted dark:text-[#71717a]">{transactions.length} riwayat</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-cozy-gray dark:bg-[#18181b] rounded-lg border border-cozy-border dark:border-[#27272a]">
        <button onClick={() => setTab('form')} className={`flex-1 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold rounded-md transition ${tab === 'form' ? 'bg-white dark:bg-[#27272a] text-cozy-text dark:text-[#fafafa] shadow-sm' : 'text-cozy-muted dark:text-[#71717a]'}`}>
          Buat Baru
        </button>
        <button onClick={() => setTab('history')} className={`flex-1 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold rounded-md transition ${tab === 'history' ? 'bg-white dark:bg-[#27272a] text-cozy-text dark:text-[#fafafa] shadow-sm' : 'text-cozy-muted dark:text-[#71717a]'}`}>
          Riwayat
        </button>
      </div>


      {/* Form Tab */}
      {tab === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Type selector */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button type="button" onClick={() => setType('in')}
              className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all active:scale-[0.97] ${type === 'in' ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30' : 'border-cozy-border dark:border-[#27272a]'}`}>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${type === 'in' ? 'bg-emerald-500' : 'bg-cozy-gray dark:bg-[#27272a]'}`}>
                  <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${type === 'in' ? 'text-white' : 'text-cozy-muted'}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" /></svg>
                </div>
                <div className="min-w-0">
                  <p className={`text-[11px] sm:text-xs font-semibold ${type === 'in' ? 'text-emerald-700 dark:text-emerald-400' : 'text-cozy-subtle dark:text-[#a1a1aa]'}`}>Masuk</p>
                  <p className="text-[9px] sm:text-[10px] text-cozy-muted dark:text-[#71717a]">Stok +</p>
                </div>
              </div>
            </button>
            <button type="button" onClick={() => setType('out')}
              className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all active:scale-[0.97] ${type === 'out' ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-950/30' : 'border-cozy-border dark:border-[#27272a]'}`}>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${type === 'out' ? 'bg-red-500' : 'bg-cozy-gray dark:bg-[#27272a]'}`}>
                  <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${type === 'out' ? 'text-white' : 'text-cozy-muted'}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" /></svg>
                </div>
                <div className="min-w-0">
                  <p className={`text-[11px] sm:text-xs font-semibold ${type === 'out' ? 'text-red-700 dark:text-red-400' : 'text-cozy-subtle dark:text-[#a1a1aa]'}`}>Keluar</p>
                  <p className="text-[9px] sm:text-[10px] text-cozy-muted dark:text-[#71717a]">Stok -</p>
                </div>
              </div>
            </button>
          </div>


          {/* Product search & select */}
          <div className="space-y-1 relative" ref={dropdownRef}>
            <label className="text-[10px] font-semibold text-cozy-muted dark:text-[#71717a] uppercase tracking-wider">Produk</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cozy-muted dark:text-[#71717a] pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              <input
                type="text"
                value={productSearch}
                onChange={e => { setProductSearch(e.target.value); setShowDropdown(true); setSelectedProduct('') }}
                onFocus={() => setShowDropdown(true)}
                className="form-input text-sm pl-9 w-full"
                placeholder="Cari nama produk..."
                autoComplete="off"
              />
              {productSearch && (
                <button type="button" onClick={() => { setProductSearch(''); setSelectedProduct(''); setShowDropdown(true) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-cozy-muted hover:text-cozy-text dark:text-[#71717a] dark:hover:text-[#fafafa]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-[#1c1c1e] border border-cozy-border dark:border-[#27272a] rounded-xl shadow-lg max-h-48 sm:max-h-56 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-cozy-muted dark:text-[#71717a]">Produk tidak ditemukan</div>
                ) : (
                  filteredProducts.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProduct(p.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-cozy-gray dark:hover:bg-[#27272a] transition-colors first:rounded-t-xl last:rounded-b-xl ${selectedProduct === p.id ? 'bg-cozy-gray dark:bg-[#27272a]' : ''}`}
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cozy-navy flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-cozy-gold shrink-0">{p.name.substring(0,2).toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] sm:text-[13px] font-medium text-cozy-text dark:text-[#fafafa] truncate">{p.name}</p>
                        <p className="text-[9px] sm:text-[10px] text-cozy-muted dark:text-[#71717a]">{p.category} · Stok: {p.stock}</p>
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-cozy-muted dark:text-[#71717a] shrink-0">{formatRp(p.price)}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>


          {/* Selected info */}
          {selectedProductData && (
            <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-cozy-gray dark:bg-[#18181b] border border-cozy-border dark:border-[#27272a]">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-cozy-navy flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-cozy-gold shrink-0">{selectedProductData.name.substring(0,2).toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] sm:text-[13px] font-medium text-cozy-text dark:text-[#fafafa] truncate">{selectedProductData.name}</p>
                <p className="text-[9px] sm:text-[10px] text-cozy-muted dark:text-[#71717a]">{selectedProductData.category} · {formatRp(selectedProductData.price)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs sm:text-sm font-bold text-cozy-text dark:text-[#fafafa]">{selectedProductData.stock}</p>
                <p className="text-[8px] sm:text-[9px] text-cozy-muted dark:text-[#71717a]">stok</p>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-cozy-muted dark:text-[#71717a] uppercase tracking-wider">Jumlah</label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-cozy-gray dark:bg-[#18181b] border border-cozy-border dark:border-[#27272a] flex items-center justify-center text-cozy-text dark:text-[#fafafa] active:scale-90 transition shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
              </button>
              <input type="number" min={1} value={quantity} onChange={e => setQuantity(Math.max(1, +e.target.value))} className="form-input text-center text-base sm:text-lg font-bold flex-1 min-w-0" />
              <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-cozy-gray dark:bg-[#18181b] border border-cozy-border dark:border-[#27272a] flex items-center justify-center text-cozy-text dark:text-[#fafafa] active:scale-90 transition shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              </button>
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-cozy-muted dark:text-[#71717a] uppercase tracking-wider">Catatan (opsional)</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} className="form-input text-sm w-full" placeholder="Catatan singkat..." />
          </div>


          {/* Submit */}
          <button type="submit" className={`w-full py-3 sm:py-3.5 rounded-xl text-white font-semibold text-xs sm:text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-2 shadow-md ${type === 'in' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'}`}>
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            <span>Catat Transaksi</span>
          </button>
        </form>
      )}


      {/* History Tab */}
      {tab === 'history' && (
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <div className="text-center py-10 sm:py-12">
              <svg className="w-9 h-9 sm:w-10 sm:h-10 mx-auto text-cozy-muted dark:text-[#3f3f46] mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              <p className="text-[11px] sm:text-xs text-cozy-muted dark:text-[#71717a]">Belum ada riwayat transaksi</p>
            </div>
          ) : (
            transactions.map(tx => (
              <div key={tx.id} className="cozy-card p-2.5 sm:p-3 flex items-center gap-2.5 sm:gap-3">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${tx.type === 'in' ? 'bg-emerald-100 dark:bg-emerald-950/40' : 'bg-red-100 dark:bg-red-950/40'}`}>
                  {tx.type === 'in' ? (
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" /></svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" /></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] sm:text-[13px] font-medium text-cozy-text dark:text-[#fafafa] truncate">{tx.productName}</p>
                  <p className="text-[9px] sm:text-[10px] text-cozy-muted dark:text-[#71717a]">
                    {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {tx.note && ` · ${tx.note}`}
                  </p>
                </div>
                <span className={`text-[11px] sm:text-xs font-bold shrink-0 ${tx.type === 'in' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {tx.type === 'in' ? '+' : '-'}{tx.quantity}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
    </div>
  )
}
