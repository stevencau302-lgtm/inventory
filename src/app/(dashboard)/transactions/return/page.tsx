'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Product, Transaction, formatRp, uid, fetchProducts, saveProduct, saveTransaction } from '@/lib/store'
import { useToast } from '@/components/Toast'
import {
  ArrowLeft, Search, Package, Save, Loader2,
  X, Minus, Plus, Sparkles, RotateCcw, CheckCircle2,
  XCircle, AlertTriangle, MessageSquare, FileText
} from 'lucide-react'

type Condition = 'good' | 'damaged'
type Reason = 'wrong_product' | 'defective' | 'not_match' | 'other'

const reasons: { value: Reason; label: string; icon: React.ReactNode }[] = [
  { value: 'wrong_product', label: 'Salah Produk', icon: <RotateCcw className="w-3.5 h-3.5" /> },
  { value: 'defective', label: 'Produk Cacat', icon: <XCircle className="w-3.5 h-3.5" /> },
  { value: 'not_match', label: 'Tidak Sesuai', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  { value: 'other', label: 'Lainnya', icon: <MessageSquare className="w-3.5 h-3.5" /> },
]

export default function ReturnPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Form state
  const [selectedProduct, setSelectedProduct] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [condition, setCondition] = useState<Condition>('good')
  const [reason, setReason] = useState<Reason>('wrong_product')
  const [note, setNote] = useState('')

  // Success state
  const [stockBefore, setStockBefore] = useState(0)
  const [stockAfter, setStockAfter] = useState(0)

  const dropdownRef = useRef<HTMLDivElement>(null)

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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
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
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  )
  const selected = products.find(p => p.id === selectedProduct)

  const handleSelectProduct = (id: string) => {
    setSelectedProduct(id)
    const p = products.find(pr => pr.id === id)
    if (p) setProductSearch(p.name)
    setShowDropdown(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) { toast('Pilih produk terlebih dahulu!', 'error'); return }

    const product = products.find(p => p.id === selectedProduct)
    if (!product) { toast('Produk tidak ditemukan', 'error'); return }

    setLoading(true)
    await new Promise(r => setTimeout(r, 600))

    const before = product.stock
    const after = condition === 'good' ? product.stock + quantity : product.stock

    // Update stock only if condition is good
    if (condition === 'good') {
      const updatedProduct = {
        ...product,
        stock: after,
        updatedAt: new Date().toISOString()
      }
      await saveProduct(updatedProduct)
    }

    // Save transaction record
    const reasonLabel = reasons.find(r => r.value === reason)?.label || reason
    const conditionLabel = condition === 'good' ? 'Bagus' : 'Rusak'
    const txNote = `[RETURN] Kondisi: ${conditionLabel} | Alasan: ${reasonLabel}${note ? ` | ${note}` : ''}`

    const newTx: Transaction = {
      id: uid(),
      productId: product.id,
      productName: product.name,
      type: condition === 'good' ? 'in' : 'out',
      quantity,
      note: txNote,
      createdAt: new Date().toISOString()
    }
    await saveTransaction(newTx)

    setStockBefore(before)
    setStockAfter(after)
    setLoading(false)
    setSuccess(true)
    toast('Return berhasil dicatat!', 'success')
  }

  // Success screen
  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-5 animate-[fadeInUp_0.5s_ease-out] text-center">
          <div className="w-20 h-20 rounded-full bg-[#16A34A]/10 flex items-center justify-center animate-[scaleIn_0.4s_ease-out]">
            <Sparkles className="w-10 h-10 text-[#16A34A]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#fafafa]">Return Tercatat!</p>
            <p className="text-sm text-zinc-500 mt-1">
              {condition === 'good' ? 'Stok telah diperbarui' : 'Dicatat sebagai barang rusak'}
            </p>
          </div>
          <div className="flex items-center gap-4 px-6 py-3 rounded-xl bg-[#1a1a1a] border border-white/[0.06]">
            <div className="text-center">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Sebelum</p>
              <p className="text-lg font-bold text-[#fafafa]">{stockBefore}</p>
            </div>
            <div className="text-[#FDC800] font-bold">→</div>
            <div className="text-center">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Sesudah</p>
              <p className={`text-lg font-bold ${stockAfter > stockBefore ? 'text-emerald-400' : 'text-[#fafafa]'}`}>{stockAfter}</p>
            </div>
            {condition === 'good' && (
              <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">+{quantity}</span>
            )}
            {condition === 'damaged' && (
              <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-amber-500/10 text-amber-400">Rusak</span>
            )}
          </div>
          <button
            onClick={() => router.push('/transactions')}
            className="mt-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#FDC800] text-black hover:bg-[#FDC800]/90 transition-all active:scale-95"
          >
            Kembali ke Transaksi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto pb-24 lg:pb-8">
      {/* Back */}
      <button
        onClick={() => router.push('/transactions')}
        className="group flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-[#fafafa] mb-6 transition-all active:scale-95"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Kembali
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <RotateCcw className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#fafafa]">Return Masuk</h1>
          <p className="text-sm text-zinc-500">Catat barang kembali dari customer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* === PILIH PRODUK === */}
        <div className="rounded-xl bg-[#1a1a1a] border border-white/[0.06] p-5 space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
            Produk yang Dikembalikan
          </label>

          {/* Search */}
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                value={productSearch}
                onChange={e => { setProductSearch(e.target.value); setShowDropdown(true); setSelectedProduct('') }}
                onFocus={() => setShowDropdown(true)}
                className="w-full rounded-xl text-sm pl-11 pr-10 py-3.5 font-medium bg-[#0f0f0f] text-[#fafafa] border-none focus:outline-none focus:ring-2 focus:ring-[#FDC800]/50 transition-all placeholder:text-zinc-600"
                placeholder="Cari produk yang dikembalikan..."
                autoComplete="off"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={() => { setProductSearch(''); setSelectedProduct(''); setShowDropdown(true) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {showDropdown && (
              <div className="absolute z-50 left-0 right-0 top-full mt-2 rounded-xl bg-[#0f0f0f] border border-white/[0.06] max-h-56 overflow-y-auto shadow-2xl shadow-black/50">
                {filteredProducts.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-zinc-500">Produk tidak ditemukan</div>
                ) : filteredProducts.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProduct(p.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-[#FDC800]/5 border-b border-white/[0.04] last:border-b-0 ${selectedProduct === p.id ? 'bg-[#FDC800]/5' : ''}`}
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

          {/* Selected product card */}
          {selected && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0f0f0f] border border-white/[0.04]">
              <div className="w-11 h-11 rounded-xl bg-[#FDC800]/10 flex items-center justify-center text-xs font-black text-[#FDC800] shrink-0">
                {selected.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{selected.name}</p>
                <p className="text-[11px] text-zinc-500">{selected.sku} · Stok saat ini: <span className="text-white font-semibold">{selected.stock}</span></p>
              </div>
            </div>
          )}

          {/* Quantity */}
          {selected && (
            <div>
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Jumlah Return</label>
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
            </div>
          )}
        </div>

        {/* === KONDISI BARANG === */}
        {selected && (
          <div className="rounded-xl bg-[#1a1a1a] border border-white/[0.06] p-5 space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Kondisi Barang
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCondition('good')}
                className={`p-4 rounded-xl text-left transition-all duration-200 active:scale-[0.97] ${
                  condition === 'good'
                    ? 'bg-emerald-500/10 border-2 border-emerald-500/50 ring-1 ring-emerald-500/20'
                    : 'bg-[#0f0f0f] border border-white/[0.06] hover:border-emerald-500/30'
                }`}
              >
                <CheckCircle2 className={`w-5 h-5 mb-2 ${condition === 'good' ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <p className={`text-sm font-bold ${condition === 'good' ? 'text-emerald-400' : 'text-zinc-300'}`}>Bagus</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Stok bertambah +{quantity}</p>
              </button>
              <button
                type="button"
                onClick={() => setCondition('damaged')}
                className={`p-4 rounded-xl text-left transition-all duration-200 active:scale-[0.97] ${
                  condition === 'damaged'
                    ? 'bg-amber-500/10 border-2 border-amber-500/50 ring-1 ring-amber-500/20'
                    : 'bg-[#0f0f0f] border border-white/[0.06] hover:border-amber-500/30'
                }`}
              >
                <XCircle className={`w-5 h-5 mb-2 ${condition === 'damaged' ? 'text-amber-400' : 'text-zinc-500'}`} />
                <p className={`text-sm font-bold ${condition === 'damaged' ? 'text-amber-400' : 'text-zinc-300'}`}>Rusak</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Stok tidak berubah</p>
              </button>
            </div>
          </div>
        )}

        {/* === ALASAN RETURN === */}
        {selected && (
          <div className="rounded-xl bg-[#1a1a1a] border border-white/[0.06] p-5 space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Alasan Return
            </label>
            <div className="grid grid-cols-2 gap-2">
              {reasons.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReason(r.value)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.97] ${
                    reason === r.value
                      ? 'bg-[#FDC800]/10 border border-[#FDC800]/40 text-[#FDC800]'
                      : 'bg-[#0f0f0f] border border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.12]'
                  }`}
                >
                  {r.icon}
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* === CATATAN === */}
        {selected && (
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-[#FDC800]" />
              Catatan
              <span className="normal-case font-normal text-zinc-600">(opsional)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value.slice(0, 200))}
              maxLength={200}
              rows={3}
              className="w-full rounded-xl text-sm px-4 py-3.5 resize-none font-medium bg-[#0f0f0f] text-[#fafafa] border-none focus:outline-none focus:ring-2 focus:ring-[#FDC800]/50 transition-all placeholder:text-zinc-600"
              placeholder="Catatan tambahan..."
            />
            <p className="text-right text-[10px] mt-1.5 text-zinc-600">{note.length}/200</p>
          </div>
        )}

        {/* === RINGKASAN & SUBMIT === */}
        {selected && (
          <div className="rounded-xl bg-[#0f0f0f] border border-white/[0.06] p-4 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Ringkasan</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Produk</span>
                <span className="text-[#fafafa] font-medium truncate ml-4">{selected.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Jumlah</span>
                <span className="text-[#fafafa] font-bold">{quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Kondisi</span>
                <span className={`font-semibold ${condition === 'good' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {condition === 'good' ? 'Bagus' : 'Rusak'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Stok setelah</span>
                <span className={`font-bold ${condition === 'good' ? 'text-emerald-400' : 'text-[#fafafa]'}`}>
                  {condition === 'good' ? selected.stock + quantity : selected.stock}
                  {condition === 'good' && <span className="text-[10px] ml-1 text-emerald-400/70">(+{quantity})</span>}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
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
                Catat Return
              </>
            )}
          </button>
        </div>
      </form>

      {/* Keyframes */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
