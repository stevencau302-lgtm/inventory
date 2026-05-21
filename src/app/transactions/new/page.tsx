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
  const [selectedProduct, setSelectedProduct] = useState('')
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
    if (p.length === 0) { const data = loadSampleData(); p = data.products }
    setProducts(p)
    setTransactions(getTransactions())
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(e.target as Node)) setShowProductDropdown(false)
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
    if (!selectedProduct) { toast('Pilih produk terlebih dahulu!', 'error'); return }
    const product = products.find(p => p.id === selectedProduct)
    if (!product) return
    if (type === 'out' && product.stock < quantity) { toast(`Stok tidak cukup! Sisa: ${product.stock}`, 'error'); return }
    setLoading(true)
    setTimeout(() => {
      const updated = products.map(p => {
        if (p.id === selectedProduct) {
          const newStock = type === 'in' ? p.stock + quantity : p.stock - quantity
          return { ...p, stock: newStock, updatedAt: new Date().toISOString() }
        }
        return p
      })
      const newTx: Transaction = { id: uid(), productId: product.id, productName: product.name, type, quantity, note, createdAt: new Date().toISOString() }
      const updatedTx = [newTx, ...transactions]
      saveProducts(updated)
      saveTransactions(updatedTx)
      toast(type === 'in' ? `+${quantity} ${product.name} berhasil dicatat masuk` : `-${quantity} ${product.name} berhasil dicatat keluar`, 'success')
      router.push('/transactions')
    }, 500)
  }

  return (
    <div className="min-h-screen" style={{ background: '#FBFBF9', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Content */}
      <div className="flex items-start justify-center min-h-screen py-10 px-4 sm:px-6">
        <div className="w-full max-w-5xl">

          {/* Back */}
          <button onClick={() => router.push('/transactions')} className="group flex items-center gap-2 text-sm font-semibold mb-6 transition-colors" style={{ color: '#1C293C' }}>
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            Kembali
          </button>

          {/* Two Column */}
          <div className="flex flex-col lg:flex-row gap-6">

            {/* LEFT — Form Card */}
            <div className="flex-1 min-w-0">
              <div className="rounded-lg p-6 sm:p-8" style={{ background: '#fff', border: '3px solid #1C293C', boxShadow: '6px 6px 0px #1C293C' }}>
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-md flex items-center justify-center" style={{ background: '#FDC800', border: '2px solid #1C293C' }}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#1C293C"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-black" style={{ color: '#1C293C' }}>Transaksi Baru</h1>
                    <p className="text-sm" style={{ color: '#6B7280' }}>Catat barang masuk atau keluar</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Type */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider mb-3 block" style={{ color: '#1C293C', fontFamily: 'JetBrains Mono, monospace' }}>Tipe Transaksi</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setType('in')} className="p-4 rounded-md text-left transition-all" style={{ background: type === 'in' ? '#16A34A' : '#fff', border: '2px solid #1C293C', boxShadow: type === 'in' ? '3px 3px 0px #1C293C' : '2px 2px 0px #1C293C', color: type === 'in' ? '#fff' : '#1C293C' }}>
                        <p className="text-sm font-bold">Masuk</p>
                        <p className="text-xs mt-0.5" style={{ opacity: 0.7 }}>Stok bertambah</p>
                      </button>
                      <button type="button" onClick={() => setType('out')} className="p-4 rounded-md text-left transition-all" style={{ background: type === 'out' ? '#DC2626' : '#fff', border: '2px solid #1C293C', boxShadow: type === 'out' ? '3px 3px 0px #1C293C' : '2px 2px 0px #1C293C', color: type === 'out' ? '#fff' : '#1C293C' }}>
                        <p className="text-sm font-bold">Keluar</p>
                        <p className="text-xs mt-0.5" style={{ opacity: 0.7 }}>Stok berkurang</p>
                      </button>
                    </div>
                  </div>

                  {/* Product */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: '#1C293C', fontFamily: 'JetBrains Mono, monospace' }}>Pilih Produk</label>
                    <div className="relative" ref={productDropdownRef}>
                      <input type="text" value={productSearch} onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); setSelectedProduct('') }} onFocus={() => setShowProductDropdown(true)} className="w-full rounded-md text-sm px-4 py-3 font-medium focus:outline-none" style={{ background: '#FBFBF9', border: '2px solid #1C293C', color: '#1C293C' }} placeholder="Cari nama produk atau SKU..." autoComplete="off" />
                      {showProductDropdown && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-md overflow-hidden max-h-56 overflow-y-auto" style={{ background: '#fff', border: '2px solid #1C293C', boxShadow: '4px 4px 0px #1C293C' }}>
                          {filteredProducts.length === 0 ? (
                            <div className="px-4 py-4 text-center text-xs" style={{ color: '#6B7280' }}>Produk tidak ditemukan</div>
                          ) : filteredProducts.map(p => (
                            <button key={p.id} type="button" onClick={() => handleSelectProduct(p.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#FDC800]/10" style={{ borderBottom: '1px solid #e5e5e0' }}>
                              <div className="w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-black shrink-0" style={{ background: '#432DD7', color: '#fff', border: '1.5px solid #1C293C' }}>{p.name.substring(0, 2).toUpperCase()}</div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: '#1C293C' }}>{p.name}</p>
                                <p className="text-[11px]" style={{ color: '#6B7280' }}>{p.sku} · Stok: {p.stock}</p>
                              </div>
                              <span className="text-[11px] font-medium shrink-0" style={{ color: '#6B7280' }}>{formatRp(p.price)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected Product */}
                  {selected && (
                    <div className="rounded-md p-4" style={{ background: '#432DD7', border: '2px solid #1C293C', boxShadow: '3px 3px 0px #1C293C', color: '#fff' }}>
                      <p className="text-sm font-bold">{selected.name}</p>
                      <p className="text-xs mt-0.5 opacity-70">{selected.sku} · {selected.category}</p>
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="rounded px-2 py-1.5 text-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                          <p className="text-[10px] opacity-70">Stok</p>
                          <p className="text-sm font-bold">{selected.stock}</p>
                        </div>
                        <div className="rounded px-2 py-1.5 text-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                          <p className="text-[10px] opacity-70">Harga</p>
                          <p className="text-sm font-bold">{formatRp(selected.price)}</p>
                        </div>
                        <div className="rounded px-2 py-1.5 text-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                          <p className="text-[10px] opacity-70">Min</p>
                          <p className="text-sm font-bold">{selected.minStock}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quantity & Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: '#1C293C', fontFamily: 'JetBrains Mono, monospace' }}>Jumlah</label>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-md flex items-center justify-center font-bold text-lg shrink-0" style={{ background: '#FBFBF9', border: '2px solid #1C293C', color: '#1C293C' }}>-</button>
                        <input type="number" min={1} value={quantity} onChange={e => setQuantity(Math.max(1, +e.target.value))} className="flex-1 min-w-0 rounded-md text-center text-lg font-bold py-2 focus:outline-none" style={{ background: '#FBFBF9', border: '2px solid #1C293C', color: '#1C293C' }} />
                        <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-md flex items-center justify-center font-bold text-lg shrink-0" style={{ background: '#FBFBF9', border: '2px solid #1C293C', color: '#1C293C' }}>+</button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: '#1C293C', fontFamily: 'JetBrains Mono, monospace' }}>Tanggal</label>
                      <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-md text-sm px-4 py-3 font-medium focus:outline-none" style={{ background: '#FBFBF9', border: '2px solid #1C293C', color: '#1C293C' }} />
                    </div>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: '#1C293C', fontFamily: 'JetBrains Mono, monospace' }}>Catatan <span className="normal-case font-normal" style={{ color: '#6B7280' }}>(opsional)</span></label>
                    <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 200))} maxLength={200} rows={3} className="w-full rounded-md text-sm px-4 py-3 resize-none font-medium focus:outline-none" style={{ background: '#FBFBF9', border: '2px solid #1C293C', color: '#1C293C' }} placeholder="Tambahkan catatan..." />
                    <p className="text-right text-[10px] mt-1" style={{ color: '#6B7280', fontFamily: 'JetBrains Mono, monospace' }}>{note.length}/200</p>
                  </div>

                  {/* Submit */}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => router.push('/transactions')} className="px-5 py-3 rounded-md text-sm font-bold transition-all" style={{ background: '#FBFBF9', border: '2px solid #1C293C', color: '#1C293C', boxShadow: '2px 2px 0px #1C293C' }}>Batal</button>
                    <button type="submit" disabled={loading} className="flex-1 py-3.5 rounded-md text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: '#FDC800', border: '2px solid #1C293C', color: '#1C293C', boxShadow: '4px 4px 0px #1C293C' }}>
                      {loading ? 'Menyimpan...' : (<><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>Simpan Transaksi</>)}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* RIGHT — Summary */}
            <div className="lg:w-[300px] shrink-0">
              <div className="lg:sticky lg:top-8 space-y-4">
                <div className="rounded-lg overflow-hidden" style={{ background: '#fff', border: '3px solid #1C293C', boxShadow: '4px 4px 0px #1C293C' }}>
                  <div className="px-5 py-3.5 flex items-center gap-2 font-bold text-sm" style={{ background: '#FDC800', borderBottom: '2px solid #1C293C', color: '#1C293C' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
                    Ringkasan
                  </div>
                  {selected ? (
                    <div className="px-5 py-4 space-y-3">
                      <div className="flex items-center gap-3 pb-3" style={{ borderBottom: '1px solid #e5e5e0' }}>
                        <div className="w-9 h-9 rounded-md flex items-center justify-center text-[10px] font-black" style={{ background: '#432DD7', color: '#fff', border: '1.5px solid #1C293C' }}>{selected.name.substring(0, 2).toUpperCase()}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: '#1C293C' }}>{selected.name}</p>
                          <p className="text-[10px]" style={{ color: '#6B7280' }}>{selected.category}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Tipe</span><span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: type === 'in' ? '#16A34A' : '#DC2626', color: '#fff' }}>{type === 'in' ? 'Masuk' : 'Keluar'}</span></div>
                        <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Jumlah</span><span className="text-sm font-black" style={{ color: type === 'in' ? '#16A34A' : '#DC2626' }}>{type === 'in' ? '+' : '-'}{quantity}</span></div>
                        <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Tanggal</span><span className="text-xs font-medium" style={{ color: '#1C293C' }}>{new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                      </div>
                      <div className="rounded-md p-3 mt-2" style={{ background: '#FBFBF9', border: '1.5px solid #1C293C' }}>
                        <div className="flex justify-between mb-1"><span className="text-[11px]" style={{ color: '#6B7280' }}>Stok saat ini</span><span className="text-sm font-bold" style={{ color: '#1C293C' }}>{selected.stock}</span></div>
                        <div className="flex justify-between"><span className="text-[11px]" style={{ color: '#6B7280' }}>Stok setelah</span><span className="text-lg font-black" style={{ color: (selected.stock + (type === 'in' ? quantity : -quantity)) < selected.minStock ? '#D97706' : '#1C293C' }}>{selected.stock + (type === 'in' ? quantity : -quantity)}</span></div>
                        {(selected.stock + (type === 'in' ? quantity : -quantity)) < selected.minStock && (
                          <div className="flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded" style={{ background: '#FEF3C7', border: '1.5px solid #D97706' }}>
                            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#D97706"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                            <span className="text-[10px] font-semibold" style={{ color: '#D97706' }}>Di bawah minimum ({selected.minStock})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="px-5 py-8 text-center">
                      <div className="w-12 h-12 rounded-md mx-auto mb-3 flex items-center justify-center" style={{ background: '#FBFBF9', border: '2px solid #e5e5e0' }}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#6B7280"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                      </div>
                      <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Pilih produk untuk melihat ringkasan</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
