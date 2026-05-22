'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Product, Transaction, formatRp, uid, fetchProducts, saveProduct, saveTransaction } from '@/lib/store'
import { useToast } from '@/components/Toast'
import {
  ArrowLeft, ArrowDownCircle, ArrowUpCircle, Search, Package,
  CalendarDays, FileText, Save, Loader2, AlertTriangle,
  X, Minus, Plus, Sparkles, ScanBarcode, Zap
} from 'lucide-react'

type TransactionType = 'in' | 'out'

export default function NewTransactionPage() {
  const router = useRouter()
  const { toast } = useToast()
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
    <div className="max-w-3xl mx-auto pb-24 lg:pb-8">
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

      <form onSubmit={handleSubmit} className="space-y-6">

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

        {/* === SUBMIT BUTTONS === */}
        <div className="flex justify-end gap-3 pt-2">
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
