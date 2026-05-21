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
    <div className="min-h-screen" style={{ background: '#0f0f0f', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Content */}
      <div className="flex items-start justify-center min-h-screen py-10 px-4 sm:px-6">
        <div className="w-full max-w-5xl">

          {/* Back */}
          <button onClick={() => router.push('/transactions')} className="group flex items-center gap-2 text-sm font-semibold mb-6 transition-colors" style={{ color: '#e4e4e7' }}>
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            Kembali
          </button>

          {/* Two Column */}
          <div className="flex flex-col lg:flex-row gap-6">

            {/* LEFT — Form Card */}
            <div className="flex-1 min-w-0">
              <div className="rounded-xl p-6 sm:p-8" style={{ background: '#1a1a1a' }}>
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#FDC800' }}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#1C293C"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-black" style={{ color: '#fafafa' }}>Transaksi Baru</h1>
                    <p className="text-sm" style={{ color: '#71717a' }}>Catat barang masuk atau keluar</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Type */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: '#a1a1aa' }}>
                      <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
                      Tipe Transaksi
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setType('in')} className="p-4 rounded-xl text-left transition-all flex items-center gap-3" style={{ background: type === 'in' ? '#16A34A' : '#0f0f0f', color: type === 'in' ? '#fff' : '#e4e4e7' }}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: type === 'in' ? 'rgba(255,255,255,0.2)' : 'rgba(22,163,74,0.15)' }}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ color: type === 'in' ? '#fff' : '#16A34A' }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" /></svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold">Masuk</p>
                          <p className="text-xs mt-0.5" style={{ opacity: 0.7 }}>Stok bertambah</p>
                        </div>
                      </button>
                      <button type="button" onClick={() => setType('out')} className="p-4 rounded-xl text-left transition-all flex items-center gap-3" style={{ background: type === 'out' ? '#DC2626' : '#0f0f0f', color: type === 'out' ? '#fff' : '#e4e4e7' }}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: type === 'out' ? 'rgba(255,255,255,0.2)' : 'rgba(220,38,38,0.15)' }}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ color: type === 'out' ? '#fff' : '#DC2626' }}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold">Keluar</p>
                          <p className="text-xs mt-0.5" style={{ opacity: 0.7 }}>Stok berkurang</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Product */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: '#a1a1aa' }}>
                      <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                      Pilih Produk
                    </label>
                    <div className="relative" ref={productDropdownRef}>
                      <input type="text" value={productSearch} onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); setSelectedProduct('') }} onFocus={() => setShowProductDropdown(true)} className="w-full rounded-xl text-sm px-4 py-3 font-medium focus:outline-none" style={{ background: '#0f0f0f', color: '#fafafa' }} placeholder="Cari nama produk atau SKU..." autoComplete="off" />
                      {showProductDropdown && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-xl overflow-hidden max-h-56 overflow-y-auto" style={{ background: '#1a1a1a' }}>
                          {filteredProducts.length === 0 ? (
                            <div className="px-4 py-4 text-center text-xs" style={{ color: '#71717a' }}>Produk tidak ditemukan</div>
                          ) : filteredProducts.map(p => (
                            <button key={p.id} type="button" onClick={() => handleSelectProduct(p.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#FDC800]/10" style={{ borderBottom: '1px solid #27272a' }}>
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0" style={{ background: '#432DD7', color: '#fff' }}>{p.name.substring(0, 2).toUpperCase()}</div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: '#fafafa' }}>{p.name}</p>
                                <p className="text-[11px]" style={{ color: '#71717a' }}>{p.sku} · Stok: {p.stock}</p>
                              </div>
                              <span className="text-[11px] font-medium shrink-0" style={{ color: '#71717a' }}>{formatRp(p.price)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected Product */}
                  {selected && (
                    <div className="rounded-xl p-4" style={{ background: '#432DD7', color: '#fff' }}>
                      <p className="text-sm font-bold">{selected.name}</p>
                      <p className="text-xs mt-0.5 opacity-70">{selected.sku} · {selected.category}</p>
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="rounded-lg px-2 py-1.5 text-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                          <p className="text-[10px] opacity-70">Stok</p>
                          <p className="text-sm font-bold">{selected.stock}</p>
                        </div>
                        <div className="rounded-lg px-2 py-1.5 text-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                          <p className="text-[10px] opacity-70">Harga</p>
                          <p className="text-sm font-bold">{formatRp(selected.price)}</p>
                        </div>
                        <div className="rounded-lg px-2 py-1.5 text-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                          <p className="text-[10px] opacity-70">Min</p>
                          <p className="text-sm font-bold">{selected.minStock}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quantity & Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: '#a1a1aa' }}>
                        <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" /></svg>
                        Jumlah
                      </label>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shrink-0" style={{ background: '#0f0f0f', color: '#fafafa' }}>-</button>
                        <input type="number" min={1} value={quantity} onChange={e => setQuantity(Math.max(1, +e.target.value))} className="flex-1 min-w-0 rounded-lg text-center text-lg font-bold py-2 focus:outline-none" style={{ background: '#0f0f0f', color: '#fafafa' }} />
                        <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shrink-0" style={{ background: '#0f0f0f', color: '#fafafa' }}>+</button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: '#a1a1aa' }}>
                        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                        Tanggal
                      </label>
                      <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg text-sm px-4 py-3 font-medium focus:outline-none" style={{ background: '#0f0f0f', color: '#fafafa', colorScheme: 'dark' }} />
                    </div>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: '#a1a1aa' }}>
                      <svg className="w-4 h-4 text-pink-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                      Catatan <span className="normal-case font-normal" style={{ color: '#71717a' }}>(opsional)</span>
                    </label>
                    <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 200))} maxLength={200} rows={3} className="w-full rounded-lg text-sm px-4 py-3 resize-none font-medium focus:outline-none" style={{ background: '#0f0f0f', color: '#fafafa' }} placeholder="Tambahkan catatan..." />
                    <p className="text-right text-[10px] mt-1" style={{ color: '#71717a' }}>{note.length}/200</p>
                  </div>

                  {/* Submit */}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => router.push('/transactions')} className="px-5 py-3 rounded-lg text-sm font-bold transition-all" style={{ background: '#0f0f0f', color: '#e4e4e7' }}>Batal</button>
                    <button type="submit" disabled={loading} className="flex-1 py-3.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: '#FDC800', color: '#1C293C' }}>
                      {loading ? 'Menyimpan...' : (<><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v1.5m0 0v9A2.25 2.25 0 0118.75 18.75H5.25A2.25 2.25 0 013 16.5v-9m18 0H3m6 9h6m-3-3v6" /></svg>Simpan Transaksi</>)}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* RIGHT — Summary */}
            <div className="lg:w-[300px] shrink-0">
              <div className="lg:sticky lg:top-8 space-y-4">
                <div className="rounded-xl overflow-hidden" style={{ background: '#1a1a1a' }}>
                  <div className="px-5 py-3.5 flex items-center gap-2 font-bold text-sm" style={{ background: '#FDC800', color: '#1C293C' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
                    Ringkasan
                  </div>
                  {selected ? (
                    <div className="px-5 py-4 space-y-3">
                      <div className="flex items-center gap-3 pb-3" style={{ borderBottom: '1px solid #27272a' }}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-black" style={{ background: '#432DD7', color: '#fff' }}>{selected.name.substring(0, 2).toUpperCase()}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: '#fafafa' }}>{selected.name}</p>
                          <p className="text-[10px]" style={{ color: '#71717a' }}>{selected.category}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-xs" style={{ color: '#71717a' }}>Tipe</span><span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: type === 'in' ? '#16A34A' : '#DC2626', color: '#fff' }}>{type === 'in' ? 'Masuk' : 'Keluar'}</span></div>
                        <div className="flex justify-between"><span className="text-xs" style={{ color: '#71717a' }}>Jumlah</span><span className="text-sm font-black" style={{ color: type === 'in' ? '#16A34A' : '#DC2626' }}>{type === 'in' ? '+' : '-'}{quantity}</span></div>
                        <div className="flex justify-between"><span className="text-xs" style={{ color: '#71717a' }}>Tanggal</span><span className="text-xs font-medium" style={{ color: '#e4e4e7' }}>{new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                      </div>
                      <div className="rounded-lg p-3 mt-2" style={{ background: '#0f0f0f' }}>
                        <div className="flex justify-between mb-1"><span className="text-[11px]" style={{ color: '#71717a' }}>Stok saat ini</span><span className="text-sm font-bold" style={{ color: '#e4e4e7' }}>{selected.stock}</span></div>
                        <div className="flex justify-between"><span className="text-[11px]" style={{ color: '#71717a' }}>Stok setelah</span><span className="text-lg font-black" style={{ color: (selected.stock + (type === 'in' ? quantity : -quantity)) < selected.minStock ? '#D97706' : '#fafafa' }}>{selected.stock + (type === 'in' ? quantity : -quantity)}</span></div>
                        {(selected.stock + (type === 'in' ? quantity : -quantity)) < selected.minStock && (
                          <div className="flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded-md" style={{ background: 'rgba(217, 119, 6, 0.15)' }}>
                            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#D97706"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                            <span className="text-[10px] font-semibold" style={{ color: '#D97706' }}>Di bawah minimum ({selected.minStock})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="px-5 py-8 text-center">
                      <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#0f0f0f' }}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#71717a"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                      </div>
                      <p className="text-xs font-medium" style={{ color: '#71717a' }}>Pilih produk untuk melihat ringkasan</p>
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
