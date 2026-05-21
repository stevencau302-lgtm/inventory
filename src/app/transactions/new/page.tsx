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
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#050508' }}>
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] rounded-full opacity-30" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 50%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full opacity-25" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 50%)', filter: 'blur(80px)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 50%)', filter: 'blur(60px)' }} />
      </div>

      {/* Noise texture overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.7\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")' }} />

      {/* Content */}
      <div className="relative flex items-start justify-center min-h-screen py-8 px-4 sm:px-6">
        <div className="w-full max-w-5xl">

          {/* Back button */}
          <button onClick={() => router.push('/transactions')} className="group flex items-center gap-2 text-zinc-500 hover:text-white text-sm mb-6 transition-colors">
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            Kembali
          </button>

          {/* Two Column Layout */}
          <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT - Form */}
          <div className="flex-1 min-w-0">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 rounded-3xl p-[1px]" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.5) 0%, rgba(16,185,129,0.3) 50%, rgba(168,85,247,0.5) 100%)' }}>
              <div className="w-full h-full rounded-3xl bg-[#0c0c14]" />
            </div>
            <div className="relative" style={{ background: 'rgba(12,12,20,0.8)', backdropFilter: 'blur(40px)' }}>
              <div className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 8px 32px rgba(16,185,129,0.3)' }}>
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">Transaksi Baru</h1>
                    <p className="text-zinc-500 text-xs">Catat barang masuk atau keluar</p>
                  </div>
                </div>
              </div>
              <div className="mx-6 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1) 50%, transparent)' }} />

              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

                {/* Transaction Type */}
                <div>
                  <label className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-3 block">Tipe Transaksi</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setType('in')}
                      className={`relative group p-4 rounded-2xl text-left transition-all duration-300 ${type === 'in' ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
                      style={{
                        background: type === 'in' ? 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)' : 'rgba(255,255,255,0.03)',
                        border: type === 'in' ? '1.5px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.06)',
                        boxShadow: type === 'in' ? '0 8px 32px rgba(16,185,129,0.15), inset 0 1px 0 rgba(16,185,129,0.2)' : 'none',
                      }}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${type === 'in' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-zinc-800'}`}>
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" /></svg>
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${type === 'in' ? 'text-emerald-300' : 'text-zinc-400'}`}>Masuk</p>
                          <p className="text-zinc-600 text-[11px]">Stok bertambah</p>
                        </div>
                      </div>
                    </button>

                    <button type="button" onClick={() => setType('out')}
                      className={`relative group p-4 rounded-2xl text-left transition-all duration-300 ${type === 'out' ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
                      style={{
                        background: type === 'out' ? 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)' : 'rgba(255,255,255,0.03)',
                        border: type === 'out' ? '1.5px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.06)',
                        boxShadow: type === 'out' ? '0 8px 32px rgba(239,68,68,0.15), inset 0 1px 0 rgba(239,68,68,0.2)' : 'none',
                      }}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${type === 'out' ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'bg-zinc-800'}`}>
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" /></svg>
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${type === 'out' ? 'text-red-300' : 'text-zinc-400'}`}>Keluar</p>
                          <p className="text-zinc-600 text-[11px]">Stok berkurang</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Product Select */}
                <div>
                  <label className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2 block">Pilih Produk</label>
                  <div className="relative" ref={productDropdownRef}>
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                      <input
                        type="text"
                        value={productSearch}
                        onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); setSelectedProduct('') }}
                        onFocus={() => setShowProductDropdown(true)}
                        className="w-full rounded-xl text-white text-sm pl-11 pr-4 py-3.5 placeholder:text-zinc-600 focus:outline-none transition-all duration-200"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                        }}
                        onFocusCapture={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.2), 0 0 0 3px rgba(99,102,241,0.1)' }}
                        onBlurCapture={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.2)' }}
                        placeholder="Cari nama produk atau SKU..."
                        autoComplete="off"
                      />
                    </div>
                    {showProductDropdown && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-2 rounded-xl overflow-hidden shadow-2xl" style={{ background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
                        <div className="max-h-56 overflow-y-auto">
                          {filteredProducts.length === 0 ? (
                            <div className="px-4 py-6 text-center text-xs text-zinc-600">Produk tidak ditemukan</div>
                          ) : (
                            filteredProducts.map(p => (
                              <button key={p.id} type="button" onClick={() => handleSelectProduct(p.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.04] ${selectedProduct === p.id ? 'bg-white/[0.06]' : ''}`}>
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))', color: '#a78bfa' }}>{p.name.substring(0, 2).toUpperCase()}</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">{p.name}</p>
                                  <p className="text-[11px] text-zinc-600">{p.sku} · Stok: {p.stock}</p>
                                </div>
                                <span className="text-[11px] text-zinc-600 shrink-0">{formatRp(p.price)}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Product Card */}
                {selected && (
                  <div className="rounded-xl p-4 transition-all duration-300" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.05) 100%)', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3))' }}>
                        <span className="text-xs font-bold text-indigo-300">{selected.name.substring(0, 2).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{selected.name}</p>
                        <p className="text-[11px] text-zinc-500">{selected.sku} · {selected.category}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg p-2.5 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                        <p className="text-[10px] text-zinc-500 mb-0.5">Stok</p>
                        <p className="text-sm font-bold text-white">{selected.stock}</p>
                      </div>
                      <div className="rounded-lg p-2.5 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                        <p className="text-[10px] text-zinc-500 mb-0.5">Harga</p>
                        <p className="text-sm font-bold text-white">{formatRp(selected.price)}</p>
                      </div>
                      <div className="rounded-lg p-2.5 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                        <p className="text-[10px] text-zinc-500 mb-0.5">Min</p>
                        <p className="text-sm font-bold text-white">{selected.minStock}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quantity & Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2 block">Jumlah</label>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-colors shrink-0"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={e => setQuantity(Math.max(1, +e.target.value))}
                        className="flex-1 min-w-0 rounded-xl text-white text-center text-lg font-bold py-2.5 focus:outline-none transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      />
                      <button type="button" onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-colors shrink-0"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2 block">Tanggal</label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full rounded-xl text-white text-sm px-4 py-3 focus:outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2 block">Catatan <span className="text-zinc-600 normal-case">(opsional)</span></label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value.slice(0, 200))}
                    maxLength={200}
                    rows={3}
                    className="w-full rounded-xl text-white text-sm px-4 py-3 resize-none placeholder:text-zinc-700 focus:outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    placeholder="Tambahkan catatan..."
                  />
                  <p className="text-right text-[10px] text-zinc-700 mt-1">{note.length}/200</p>
                </div>

                {/* Submit mobile */}
                <div className="pt-1 flex gap-3 lg:hidden">
                  <button type="button" onClick={() => router.push('/transactions')} className="px-5 py-3 rounded-xl text-zinc-400 text-sm font-medium hover:text-white transition-all" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>Batal</button>
                  <button type="submit" disabled={loading} className="flex-1 py-3.5 rounded-xl text-white text-sm font-semibold transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: type === 'in' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', boxShadow: type === 'in' ? '0 8px 32px rgba(16,185,129,0.3)' : '0 8px 32px rgba(239,68,68,0.3)' }}>
                    {loading ? (<><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Menyimpan...</>) : (<><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>Simpan Transaksi</>)}
                  </button>
                </div>
              </form>
            </div>
          </div>
          </div>
          {/* RIGHT - Summary Sticky */}
          <div className="lg:w-[300px] shrink-0">
            <div className="lg:sticky lg:top-8 space-y-4">
              <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(12,12,20,0.9)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
                <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
                  <span className="text-sm font-semibold text-white">Ringkasan</span>
                </div>
                {selected ? (
                  <div className="px-5 py-4 space-y-3">
                    <div className="flex items-center gap-3 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3))' }}>
                        <span className="text-[10px] font-bold text-indigo-300">{selected.name.substring(0, 2).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{selected.name}</p>
                        <p className="text-[10px] text-zinc-500">{selected.category}</p>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex justify-between"><span className="text-xs text-zinc-500">Tipe</span><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${type === 'in' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{type === 'in' ? 'Masuk' : 'Keluar'}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-zinc-500">Jumlah</span><span className={`text-sm font-bold ${type === 'in' ? 'text-emerald-400' : 'text-red-400'}`}>{type === 'in' ? '+' : '-'}{quantity}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-zinc-500">Tanggal</span><span className="text-xs text-zinc-300">{new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                    </div>
                    <div className="mt-3 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex justify-between mb-2"><span className="text-[11px] text-zinc-500">Stok saat ini</span><span className="text-sm text-zinc-300">{selected.stock}</span></div>
                      <div className="flex justify-between"><span className="text-[11px] text-zinc-500">Stok setelah</span><span className={`text-lg font-bold ${(selected.stock + (type === 'in' ? quantity : -quantity)) < selected.minStock ? 'text-amber-400' : 'text-white'}`}>{selected.stock + (type === 'in' ? quantity : -quantity)}</span></div>
                      {(selected.stock + (type === 'in' ? quantity : -quantity)) < selected.minStock && (
                        <div className="flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                          <svg className="w-3 h-3 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                          <span className="text-[10px] text-amber-400">Di bawah minimum ({selected.minStock})</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                    </div>
                    <p className="text-xs text-zinc-600">Pilih produk untuk melihat ringkasan</p>
                  </div>
                )}
              </div>
              {/* Desktop submit */}
              <div className="hidden lg:flex flex-col gap-2">
                <button type="button" onClick={() => { const f = document.querySelector('form'); f?.requestSubmit() }} disabled={loading} className="w-full py-3.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: type === 'in' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', boxShadow: type === 'in' ? '0 8px 32px rgba(16,185,129,0.3)' : '0 8px 32px rgba(239,68,68,0.3)' }}>
                  {loading ? (<><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Menyimpan...</>) : (<><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>Simpan Transaksi</>)}
                </button>
                <button type="button" onClick={() => router.push('/transactions')} className="w-full py-3 rounded-xl text-zinc-400 text-sm font-medium hover:text-white transition-all text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>Batal</button>
              </div>
            </div>
          </div>
          </div>

        </div>
      </div>
    </div>
  )
}
