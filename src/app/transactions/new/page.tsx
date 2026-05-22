'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Product, Transaction, formatRp, uid, fetchProducts, saveProduct, saveTransaction } from '@/lib/store'
import { useToast } from '@/components/Toast'
import {
  ArrowLeft, ArrowDownCircle, ArrowUpCircle, Search, Package,
  CalendarDays, FileText, Save, Loader2, AlertTriangle,
  X, Minus, Plus, Sparkles, ScanBarcode, Zap, ClipboardList, Layers
} from 'lucide-react'

type TransactionType = 'in' | 'out'
type Mode = null | 'single' | 'bulk'

export default function NewTransactionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [mode, setMode] = useState<Mode>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [type, setType] = useState<TransactionType>('in')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const productDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadData() {
      const p = await fetchProducts()
      setProducts(p)
      setMounted(true)
    }
    loadData()
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

  if (!mounted) return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="flex flex-col items-center gap-3 animate-pulse">
        <Loader2 className="w-8 h-8 text-[#FDC800] animate-spin" />
        <p className="text-zinc-500 text-sm">Memuat...</p>
      </div>
    </div>
  )

  // Mode Selection Screen
  if (mode === null) {
    return (
      <div className="max-w-2xl mx-auto pb-24 lg:pb-8">
        <button
          onClick={() => router.push('/transactions')}
          className="group flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-[#fafafa] mb-6 transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#FDC800]/10 flex items-center justify-center">
            <Package className="w-6 h-6 text-[#FDC800]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#fafafa]">Transaksi Baru</h1>
            <p className="text-sm text-zinc-500">Pilih mode input transaksi</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Transaksi Biasa */}
          <button
            onClick={() => setMode('single')}
            className="group relative p-6 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] text-left transition-all duration-200 hover:border-[#FDC800]/50 hover:shadow-lg hover:shadow-[#FDC800]/5 active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-[#FDC800]/10 flex items-center justify-center mb-4 group-hover:bg-[#FDC800]/20 transition-colors">
              <ClipboardList className="w-6 h-6 text-[#FDC800]" />
            </div>
            <h3 className="text-base font-bold text-[#fafafa] mb-1">Transaksi Biasa</h3>
            <p className="text-sm text-zinc-500">Catat 1 produk per transaksi</p>
          </button>

          {/* Bulk Entry */}
          <button
            onClick={() => setMode('bulk')}
            className="group relative p-6 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] text-left transition-all duration-200 hover:border-[#FDC800]/50 hover:shadow-lg hover:shadow-[#FDC800]/5 active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-[#FDC800]/10 flex items-center justify-center mb-4 group-hover:bg-[#FDC800]/20 transition-colors">
              <Layers className="w-6 h-6 text-[#FDC800]" />
            </div>
            <h3 className="text-base font-bold text-[#fafafa] mb-1">Bulk Entry</h3>
            <p className="text-sm text-zinc-500">Catat banyak produk sekaligus</p>
          </button>
        </div>
      </div>
    )
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) { toast('Pilih produk terlebih dahulu!', 'error'); return }

    const product = products.find(p => p.id === selectedProduct)
    if (!product) { toast('Produk tidak ditemukan', 'error'); return }

    if (type === 'out' && product.stock < quantity) {
      toast(`Stok tidak cukup! Sisa: ${product.stock}`, 'error')
      return
    }

    setLoading(true)
    await new Promise(r => setTimeout(r, 600))

    const updatedProduct = {
      ...product,
      stock: type === 'in' ? product.stock + quantity : product.stock - quantity,
      updatedAt: new Date().toISOString()
    }
    const newTx: Transaction = {
      id: uid(),
      productId: product.id,
      productName: product.name,
      type,
      quantity,
      note,
      createdAt: new Date(date).toISOString()
    }

    await saveProduct(updatedProduct)
    await saveTransaction(newTx)

    setSuccess(true)
    toast(
      type === 'in'
        ? `+${quantity} ${product.name} berhasil dicatat masuk`
        : `-${quantity} ${product.name} berhasil dicatat keluar`,
      'success'
    )

    setTimeout(() => router.push('/transactions'), 1200)
  }

  // Bulk Entry Mode
  if (mode === 'bulk') {
    return <BulkEntryForm products={products} router={router} toast={toast} />
  }

  // Success animation
  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4 animate-[fadeInUp_0.5s_ease-out]">
          <div className="w-20 h-20 rounded-full bg-[#16A34A]/10 flex items-center justify-center animate-[scaleIn_0.4s_ease-out]">
            <Sparkles className="w-10 h-10 text-[#16A34A]" />
          </div>
          <p className="text-xl font-bold text-[#fafafa]">Transaksi Tersimpan!</p>
          <p className="text-sm text-zinc-500">Mengalihkan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto pb-24 lg:pb-8">
      {/* Back Button */}
      <button
        onClick={() => router.push('/transactions')}
        className="group flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-[#fafafa] mb-6 transition-all active:scale-95"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Kembali
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-[#FDC800]/10 flex items-center justify-center">
          <Package className="w-6 h-6 text-[#FDC800]" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#fafafa]">Transaksi Baru</h1>
          <p className="text-sm text-zinc-500">Catat barang masuk atau keluar</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
      {/* LEFT - Form */}
      <div className="flex-1 min-w-0">
      <form id="txForm" onSubmit={handleSubmit} className="space-y-6">

        {/* === TIPE TRANSAKSI === */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 block">
            Tipe Transaksi
          </label>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('in')}
              className={`relative w-full p-4 sm:p-5 rounded-2xl text-left transition-all duration-300 active:scale-[0.97] overflow-hidden ${
                type === 'in'
                  ? 'bg-[#16A34A] text-white ring-2 ring-[#16A34A]/50 shadow-lg shadow-[#16A34A]/20'
                  : 'bg-[#1a1a1a] text-zinc-300 border border-white/[0.06] hover:border-[#16A34A]/30'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  type === 'in' ? 'bg-white/20' : 'bg-[#16A34A]/10'
                }`}>
                  <ArrowDownCircle className={`w-6 h-6 ${type === 'in' ? 'text-white' : 'text-[#16A34A]'}`} />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold">Barang Masuk</p>
                  <p className={`text-sm mt-0.5 ${type === 'in' ? 'text-white/70' : 'text-zinc-500'}`}>Stok bertambah +</p>
                </div>
                {type === 'in' && (
                  <div className="w-3 h-3 rounded-full bg-white animate-pulse shrink-0" />
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setType('out')}
              className={`relative w-full p-4 sm:p-5 rounded-2xl text-left transition-all duration-300 active:scale-[0.97] overflow-hidden ${
                type === 'out'
                  ? 'bg-[#DC2626] text-white ring-2 ring-[#DC2626]/50 shadow-lg shadow-[#DC2626]/20'
                  : 'bg-[#1a1a1a] text-zinc-300 border border-white/[0.06] hover:border-[#DC2626]/30'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  type === 'out' ? 'bg-white/20' : 'bg-[#DC2626]/10'
                }`}>
                  <ArrowUpCircle className={`w-6 h-6 ${type === 'out' ? 'text-white' : 'text-[#DC2626]'}`} />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold">Barang Keluar</p>
                  <p className={`text-sm mt-0.5 ${type === 'out' ? 'text-white/70' : 'text-zinc-500'}`}>Stok berkurang -</p>
                </div>
                {type === 'out' && (
                  <div className="w-3 h-3 rounded-full bg-white animate-pulse shrink-0" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* === DETAIL PRODUK === */}
        <div className="rounded-xl bg-[#1a1a1a] border border-white/[0.06] p-5 space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
            Detail Produk
          </label>

          {/* Search dropdown */}
          <div className="relative" ref={productDropdownRef}>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                value={productSearch}
                onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); setSelectedProduct('') }}
                onFocus={() => setShowProductDropdown(true)}
                className="w-full rounded-xl text-sm pl-11 pr-10 py-3.5 font-medium bg-[#0f0f0f] text-[#fafafa] border-none focus:outline-none focus:ring-2 focus:ring-[#FDC800]/50 transition-all placeholder:text-zinc-600"
                placeholder="Cari nama produk atau SKU..."
                autoComplete="off"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={() => { setProductSearch(''); setSelectedProduct(''); setShowProductDropdown(true) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dropdown */}
            {showProductDropdown && (
              <div className="absolute z-50 left-0 right-0 top-full mt-2 rounded-xl bg-[#0f0f0f] border border-white/[0.06] max-h-64 overflow-y-auto shadow-2xl shadow-black/50 animate-[slideDown_0.2s_ease-out]">
                {filteredProducts.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-zinc-500">Produk tidak ditemukan</div>
                ) : filteredProducts.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProduct(p.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-[#FDC800]/5 active:bg-[#FDC800]/10 border-b border-white/[0.04] last:border-b-0 ${selectedProduct === p.id ? 'bg-[#FDC800]/5' : ''}`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#FDC800]/10 flex items-center justify-center text-[10px] font-black text-[#FDC800] shrink-0">
                      {p.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#fafafa] truncate">{p.name}</p>
                      <p className="text-[11px] text-zinc-500">{p.sku} · Stok: {p.stock}</p>
                    </div>
                    <span className="text-[11px] font-medium text-zinc-500 shrink-0">{formatRp(p.price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          {selected && (
            <div className="grid grid-cols-3 gap-3 rounded-lg bg-[#0f0f0f] p-3">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Stok Saat Ini</p>
                <p className="text-sm font-bold text-[#fafafa] mt-0.5">{selected.stock}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Harga</p>
                <p className="text-sm font-bold text-[#fafafa] mt-0.5">{formatRp(selected.price)}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Min Stok</p>
                <p className="text-sm font-bold text-[#fafafa] mt-0.5">{selected.minStock}</p>
              </div>
            </div>
          )}

          {/* Jumlah & Tanggal — side by side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Jumlah */}
            <div>
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Jumlah</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-11 h-11 rounded-xl bg-[#0f0f0f] border border-white/[0.06] flex items-center justify-center text-[#fafafa] hover:bg-white/[0.04] active:scale-90 transition-all shrink-0"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, +e.target.value))}
                  className="flex-1 min-w-0 rounded-xl text-center text-lg font-bold py-2.5 bg-[#0f0f0f] text-[#fafafa] border-none focus:outline-none focus:ring-2 focus:ring-[#FDC800]/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-11 h-11 rounded-xl bg-[#0f0f0f] border border-white/[0.06] flex items-center justify-center text-[#fafafa] hover:bg-white/[0.04] active:scale-90 transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {selected && type === 'out' && quantity > selected.stock && (
                <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Stok tidak cukup
                </p>
              )}
            </div>

            {/* Tanggal */}
            <div>
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full rounded-xl text-sm px-4 py-3 font-medium bg-[#0f0f0f] text-[#fafafa] border-none focus:outline-none focus:ring-2 focus:ring-[#FDC800]/50 transition-all"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>
        </div>

        {/* === KETERANGAN === */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-[#FDC800]" />
            Keterangan
            <span className="normal-case font-normal text-zinc-600">(opsional)</span>
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value.slice(0, 200))}
            maxLength={200}
            rows={3}
            className="w-full rounded-xl text-sm px-4 py-3.5 resize-none font-medium bg-[#0f0f0f] text-[#fafafa] border-none focus:outline-none focus:ring-2 focus:ring-[#FDC800]/50 transition-all placeholder:text-zinc-600"
            placeholder="Tambahkan catatan transaksi..."
          />
          <p className="text-right text-[10px] mt-1.5 text-zinc-600">{note.length}/200</p>
        </div>

        {/* === SUBMIT BUTTONS (mobile) === */}
        <div className="flex justify-end gap-3 pt-2 lg:hidden">
          <button
            type="button"
            onClick={() => router.push('/transactions')}
            className="px-5 py-3 rounded-xl text-sm font-bold bg-[#1a1a1a] border border-white/[0.06] text-zinc-300 hover:bg-white/[0.04] transition-all active:scale-95"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading || !selectedProduct}
            className="px-6 py-3 rounded-xl text-sm font-bold bg-[#FDC800] text-[#000000] hover:bg-[#FDC800]/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:scale-[0.97] shadow-lg shadow-[#FDC800]/20"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Catat Transaksi
              </>
            )}
          </button>
        </div>
      </form>
      </div>

      {/* RIGHT - Ringkasan Sticky (desktop only) */}
      <div className="hidden lg:block lg:w-[300px] shrink-0">
        <div className="sticky top-8 space-y-4">
          <div className="rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/[0.06]">
            <div className="px-5 py-3.5 flex items-center gap-2 font-bold text-sm bg-[#FDC800] text-[#000000]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
              Ringkasan
            </div>
            <div className="px-5 py-4 space-y-3">
              {selected ? (
                <>
                  <div className="flex items-center gap-3 pb-3 border-b border-white/[0.06]">
                    <div className="w-9 h-9 rounded-lg bg-[#FDC800]/10 flex items-center justify-center text-[10px] font-black text-[#FDC800] shrink-0">
                      {selected.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#fafafa] truncate">{selected.name}</p>
                      <p className="text-[11px] text-zinc-500">{selected.sku}</p>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-xs text-zinc-500">Tipe</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${type === 'in' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{type === 'in' ? 'Masuk' : 'Keluar'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-zinc-500">Jumlah</span>
                      <span className="text-sm font-bold text-[#fafafa]">{quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-zinc-500">Stok Sekarang</span>
                      <span className="text-sm font-bold text-[#fafafa]">{selected.stock}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-zinc-500">Stok Setelah</span>
                      <span className={`text-sm font-bold ${(selected.stock + (type === 'in' ? quantity : -quantity)) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {selected.stock + (type === 'in' ? quantity : -quantity)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-zinc-500">Tanggal</span>
                      <span className="text-xs text-[#fafafa]">{new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center bg-[#0f0f0f]">
                    <Package className="w-5 h-5 text-zinc-600" />
                  </div>
                  <p className="text-xs font-medium text-zinc-500">Pilih produk untuk melihat ringkasan</p>
                </div>
              )}
            </div>
          </div>

          {/* Desktop submit buttons */}
          <button
            type="button"
            onClick={() => { const f = document.getElementById('txForm') as HTMLFormElement; f?.requestSubmit() }}
            disabled={loading || !selectedProduct}
            className="w-full py-3.5 rounded-xl text-sm font-bold bg-[#FDC800] text-[#000000] hover:bg-[#FDC800]/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.97] shadow-lg shadow-[#FDC800]/20"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Catat Transaksi
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push('/transactions')}
            className="w-full py-3 rounded-xl text-sm font-bold bg-[#0f0f0f] text-zinc-300 hover:bg-white/[0.04] transition-all text-center"
          >
            Batal
          </button>
        </div>
      </div>
      </div>

      {/* Custom keyframes */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}


// Bulk Entry Form Component
function BulkEntryForm({ products, router, toast }: { products: Product[]; router: any; toast: any }) {
  const [type, setType] = useState<TransactionType>('in')
  const [items, setItems] = useState<{ productId: string; productName: string; quantity: number }[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [productSearch, setProductSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  )

  const handleAddItem = () => {
    if (!selectedProduct) { toast('Pilih produk dulu!', 'error'); return }
    const product = products.find(p => p.id === selectedProduct)
    if (!product) return
    if (items.find(i => i.productId === selectedProduct)) { toast('Produk sudah ada di list', 'error'); return }
    if (type === 'out' && product.stock < quantity) { toast(`Stok tidak cukup! Sisa: ${product.stock}`, 'error'); return }
    setItems([...items, { productId: product.id, productName: product.name, quantity }])
    setSelectedProduct('')
    setProductSearch('')
    setQuantity(1)
  }

  const handleRemoveItem = (index: number) => setItems(items.filter((_, i) => i !== index))

  const handleSubmit = async () => {
    if (items.length === 0) { toast('Tambah minimal 1 produk!', 'error'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))

    for (const item of items) {
      const product = products.find(p => p.id === item.productId)
      if (!product) continue
      if (type === 'out' && product.stock < item.quantity) {
        toast(`Stok ${product.name} tidak cukup!`, 'error')
        setLoading(false)
        return
      }
      const updatedProduct = { ...product, stock: type === 'in' ? product.stock + item.quantity : product.stock - item.quantity, updatedAt: new Date().toISOString() }
      const newTx: Transaction = { id: uid(), productId: product.id, productName: product.name, type, quantity: item.quantity, note, createdAt: new Date(date).toISOString() }
      await saveProduct(updatedProduct)
      await saveTransaction(newTx)
    }

    setSuccess(true)
    const totalQty = items.reduce((s, i) => s + i.quantity, 0)
    toast(`${totalQty} item dari ${items.length} produk berhasil dicatat`, 'success')
    setTimeout(() => router.push('/transactions'), 1200)
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4 animate-[fadeInUp_0.5s_ease-out]">
          <div className="w-20 h-20 rounded-full bg-[#16A34A]/10 flex items-center justify-center"><Sparkles className="w-10 h-10 text-[#16A34A]" /></div>
          <p className="text-xl font-bold text-[#fafafa]">Transaksi Tersimpan!</p>
          <p className="text-sm text-zinc-500">Mengalihkan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto pb-24 lg:pb-8">
      <button onClick={() => router.push('/transactions')} className="group flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-[#fafafa] mb-6 transition-all active:scale-95">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Kembali
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-[#FDC800]/10 flex items-center justify-center">
          <Layers className="w-6 h-6 text-[#FDC800]" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#fafafa]">Bulk Entry</h1>
          <p className="text-sm text-zinc-500">Catat banyak produk sekaligus</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Tipe */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 block">Tipe Transaksi</label>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setType('in')} className={`p-4 rounded-xl text-left transition-all active:scale-[0.97] ${type === 'in' ? 'bg-[#16A34A] text-white ring-2 ring-[#16A34A]/50' : 'bg-[#1a1a1a] text-zinc-300 border border-[#2a2a2a]'}`}>
              <ArrowDownCircle className={`w-5 h-5 mb-2 ${type === 'in' ? 'text-white' : 'text-[#16A34A]'}`} />
              <p className="text-sm font-bold">Barang Masuk</p>
            </button>
            <button type="button" onClick={() => setType('out')} className={`p-4 rounded-xl text-left transition-all active:scale-[0.97] ${type === 'out' ? 'bg-[#DC2626] text-white ring-2 ring-[#DC2626]/50' : 'bg-[#1a1a1a] text-zinc-300 border border-[#2a2a2a]'}`}>
              <ArrowUpCircle className={`w-5 h-5 mb-2 ${type === 'out' ? 'text-white' : 'text-[#DC2626]'}`} />
              <p className="text-sm font-bold">Barang Keluar</p>
            </button>
          </div>
        </div>

        {/* Add product */}
        <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-4 space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">Tambah Produk</label>
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={productSearch}
                onChange={e => { setProductSearch(e.target.value); setShowDropdown(true); setSelectedProduct('') }}
                onFocus={() => setShowDropdown(true)}
                className="w-full rounded-lg text-sm pl-10 pr-4 py-3 bg-[#0f0f0f] text-[#fafafa] border-none focus:outline-none focus:ring-2 focus:ring-[#FDC800]/50 placeholder:text-zinc-600"
                placeholder="Cari produk..."
              />
            </div>
            {showDropdown && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] max-h-48 overflow-y-auto shadow-xl">
                {filteredProducts.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-zinc-500 text-center">Tidak ditemukan</p>
                ) : filteredProducts.slice(0, 8).map(p => (
                  <button key={p.id} type="button" onClick={() => { setSelectedProduct(p.id); setProductSearch(p.name); setShowDropdown(false) }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-[#FDC800]/5 border-b border-[#2a2a2a] last:border-b-0 ${selectedProduct === p.id ? 'bg-[#FDC800]/5' : ''}`}>
                    <div>
                      <p className="text-sm text-[#fafafa]">{p.name}</p>
                      <p className="text-[11px] text-zinc-500">{p.sku} · Stok: {p.stock}</p>
                    </div>
                    <span className="text-[11px] text-zinc-500">{formatRp(p.price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 flex-1">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] flex items-center justify-center text-[#fafafa] active:scale-90 transition-all shrink-0"><Minus className="w-3.5 h-3.5" /></button>
              <input type="number" min={1} value={quantity} onChange={e => setQuantity(Math.max(1, +e.target.value))} className="flex-1 rounded-lg text-center text-sm font-bold py-2 bg-[#0f0f0f] text-[#fafafa] border-none focus:outline-none focus:ring-2 focus:ring-[#FDC800]/50" />
              <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-9 h-9 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] flex items-center justify-center text-[#fafafa] active:scale-90 transition-all shrink-0"><Plus className="w-3.5 h-3.5" /></button>
            </div>
            <button type="button" onClick={handleAddItem} disabled={!selectedProduct} className="px-4 py-2 rounded-lg bg-[#FDC800] text-[#000000] text-sm font-bold disabled:opacity-40 active:scale-95 transition-all">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Items list */}
        {items.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">Produk ({items.length})</label>
            {items.map((item, index) => (
              <div key={`${item.productId}-${index}`} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
                <div className="w-8 h-8 rounded-lg bg-[#FDC800]/10 flex items-center justify-center text-[9px] font-black text-[#FDC800] shrink-0">{item.productName.substring(0, 2).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#fafafa] truncate">{item.productName}</p>
                  <p className="text-[11px] text-zinc-500">Qty: {item.quantity}</p>
                </div>
                <button type="button" onClick={() => handleRemoveItem(index)} className="w-8 h-8 rounded-lg bg-[#2a2a2a] flex items-center justify-center text-[#DC2626] active:scale-90 transition-all shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tanggal & Catatan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Tanggal</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg text-sm px-4 py-3 bg-[#0f0f0f] text-[#fafafa] border-none focus:outline-none focus:ring-2 focus:ring-[#FDC800]/50" style={{ colorScheme: 'dark' }} />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Catatan (opsional)</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} className="w-full rounded-lg text-sm px-4 py-3 bg-[#0f0f0f] text-[#fafafa] border-none focus:outline-none focus:ring-2 focus:ring-[#FDC800]/50 placeholder:text-zinc-600" placeholder="Catatan..." />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.push('/transactions')} className="px-5 py-3 rounded-xl text-sm font-bold bg-[#1a1a1a] border border-[#2a2a2a] text-zinc-300 active:scale-95 transition-all">Batal</button>
          <button type="button" onClick={handleSubmit} disabled={loading || items.length === 0} className="px-6 py-3 rounded-xl text-sm font-bold bg-[#FDC800] text-[#000000] disabled:opacity-40 flex items-center gap-2 active:scale-[0.97] transition-all shadow-lg shadow-[#FDC800]/20">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" />Catat {items.length} Transaksi</>}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
