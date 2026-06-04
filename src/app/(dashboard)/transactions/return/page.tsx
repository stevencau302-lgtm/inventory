'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Product, Transaction, formatRp, uid, fetchProducts, saveProduct, saveTransaction } from '@/lib/store'
import { useToast } from '@/components/Toast'
import {
  ArrowLeft, Search, Package, Save, Loader2,
  X, Minus, Plus, Sparkles, RotateCcw, CheckCircle2,
  XCircle, AlertTriangle, MessageSquare, FileText, Camera
} from 'lucide-react'

type Condition = 'good' | 'damaged'
type Reason = 'wrong_product' | 'defective' | 'not_match' | 'other'

const reasons: { value: Reason; label: string; icon: React.ReactNode }[] = [
  { value: 'wrong_product', label: 'Salah Produk', icon: <RotateCcw className="w-3.5 h-3.5" /> },
  { value: 'defective', label: 'Produk Cacat', icon: <XCircle className="w-3.5 h-3.5" /> },
  { value: 'not_match', label: 'Tidak Sesuai', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  { value: 'other', label: 'Lainnya', icon: <MessageSquare className="w-3.5 h-3.5" /> },
]

// Beep sound
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 1200
    gain.gain.value = 0.3
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.stop(ctx.currentTime + 0.15)
  } catch {}
}

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

  // Scanner state
  const [scanStatus, setScanStatus] = useState<'idle' | 'found' | 'not-found'>('idle')
  const [showCamera, setShowCamera] = useState(false)

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
        <Loader2 className="w-8 h-8 text-[#FF5F03] animate-spin" />
        <p className="text-gray-500 text-sm">Memuat...</p>
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
            <p className="text-xl font-bold text-gray-900">Return Tercatat!</p>
            <p className="text-sm text-gray-500 mt-1">
              {condition === 'good' ? 'Stok telah diperbarui' : 'Dicatat sebagai barang rusak'}
            </p>
          </div>
          <div className="flex items-center gap-4 px-6 py-3 rounded-xl bg-white border border-gray-200">
            <div className="text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Sebelum</p>
              <p className="text-lg font-bold text-gray-900">{stockBefore}</p>
            </div>
            <div className="text-[#FF5F03] font-bold">→</div>
            <div className="text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Sesudah</p>
              <p className={`text-lg font-bold ${stockAfter > stockBefore ? 'text-emerald-400' : 'text-gray-900'}`}>{stockAfter}</p>
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
            className="mt-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#FF5F03] text-white hover:bg-[#FF5F03]/90 transition-all active:scale-95"
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
        className="group flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 mb-6 transition-all active:scale-95"
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Return Masuk</h1>
          <p className="text-sm text-gray-500">Catat barang kembali dari customer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* === PILIH PRODUK === */}
        <div className="rounded-xl bg-white border border-gray-200 p-5 space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
            Produk yang Dikembalikan
          </label>

          {/* Search */}
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={productSearch}
                onChange={e => { setProductSearch(e.target.value); setShowDropdown(true); setSelectedProduct(''); setScanStatus('idle') }}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const val = (e.target as HTMLInputElement).value.trim()
                    if (!val) return
                    const found = products.find(p =>
                      p.sku.toLowerCase() === val.toLowerCase() ||
                      p.sku.replace(/[-\s]/g, '').toLowerCase() === val.replace(/[-\s]/g, '').toLowerCase()
                    )
                    if (found) {
                      playBeep()
                      handleSelectProduct(found.id)
                      setScanStatus('found')
                      setTimeout(() => setScanStatus('idle'), 2000)
                    } else {
                      setScanStatus('not-found')
                      setTimeout(() => setScanStatus('idle'), 2000)
                    }
                  }
                }}
                className={`w-full rounded-xl text-sm pl-11 pr-20 py-3.5 font-medium bg-white text-gray-900 border-2 focus:outline-none transition-all duration-300 placeholder:text-gray-400 ${
                  scanStatus === 'found' ? 'border-emerald-500/50 ring-2 ring-emerald-500/20' :
                  scanStatus === 'not-found' ? 'border-red-500/50 ring-2 ring-red-500/20' :
                  'border-gray-200 focus:border-[#072C2C]/50 focus:ring-2 focus:ring-[#072C2C]/20'
                }`}
                placeholder="Cari atau scan barcode produk..."
                autoComplete="off"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {/* Camera button — mobile only */}
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="sm:hidden w-8 h-8 rounded-lg bg-[#FF5F03]/10 border border-[#FF5F03]/20 flex items-center justify-center text-[#FF5F03] hover:bg-[#FF5F03]/20 transition-all active:scale-90"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                {productSearch && (
                  <button
                    type="button"
                    onClick={() => { setProductSearch(''); setSelectedProduct(''); setShowDropdown(true); setScanStatus('idle') }}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Scan status message */}
            {scanStatus === 'not-found' && (
              <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1 animate-[fadeInUp_0.2s_ease-out]">
                <AlertTriangle className="w-3 h-3" />
                Barcode tidak cocok dengan produk manapun
              </p>
            )}

            {showDropdown && scanStatus === 'idle' && (
              <div className="absolute z-50 left-0 right-0 top-full mt-2 rounded-xl bg-white border border-gray-200 max-h-56 overflow-y-auto shadow-2xl shadow-black/10">
                {filteredProducts.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">Produk tidak ditemukan</div>
                ) : filteredProducts.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProduct(p.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-[#FF5F03]/5 border-b border-gray-100 last:border-b-0 ${selectedProduct === p.id ? 'bg-[#FF5F03]/5' : ''}`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#FF5F03]/10 flex items-center justify-center text-[10px] font-black text-[#FF5F03] shrink-0">
                      {p.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                      <p className="text-[11px] text-gray-500">{p.sku} · Stok: {p.stock}</p>
                    </div>
                    <span className="text-[11px] font-medium text-gray-500 shrink-0">{formatRp(p.price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected product card */}
          {selected && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200">
              <div className="w-11 h-11 rounded-xl bg-[#FF5F03]/10 flex items-center justify-center text-xs font-black text-[#FF5F03] shrink-0">
                {selected.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{selected.name}</p>
                <p className="text-[11px] text-gray-500">{selected.sku} · Stok saat ini: <span className="text-gray-900 font-semibold">{selected.stock}</span></p>
              </div>
            </div>
          )}

          {/* Quantity */}
          {selected && (
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Jumlah Return</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-900 hover:bg-gray-50 active:scale-90 transition-all shrink-0"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, +e.target.value))}
                  className="flex-1 min-w-0 rounded-xl text-center text-lg font-bold py-2.5 bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#072C2C]/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-900 hover:bg-gray-50 active:scale-90 transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* === KONDISI BARANG === */}
        {selected && (
          <div className="rounded-xl bg-white border border-gray-200 p-5 space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
              Kondisi Barang
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCondition('good')}
                className={`p-4 rounded-xl text-left transition-all duration-200 active:scale-[0.97] ${
                  condition === 'good'
                    ? 'bg-emerald-500/10 border-2 border-emerald-500/50 ring-1 ring-emerald-500/20'
                    : 'bg-white border border-gray-200 hover:border-emerald-500/30'
                }`}
              >
                <CheckCircle2 className={`w-5 h-5 mb-2 ${condition === 'good' ? 'text-emerald-400' : 'text-gray-500'}`} />
                <p className={`text-sm font-bold ${condition === 'good' ? 'text-emerald-400' : 'text-gray-700'}`}>Bagus</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Stok bertambah +{quantity}</p>
              </button>
              <button
                type="button"
                onClick={() => setCondition('damaged')}
                className={`p-4 rounded-xl text-left transition-all duration-200 active:scale-[0.97] ${
                  condition === 'damaged'
                    ? 'bg-amber-500/10 border-2 border-amber-500/50 ring-1 ring-amber-500/20'
                    : 'bg-white border border-gray-200 hover:border-amber-500/30'
                }`}
              >
                <XCircle className={`w-5 h-5 mb-2 ${condition === 'damaged' ? 'text-amber-400' : 'text-gray-500'}`} />
                <p className={`text-sm font-bold ${condition === 'damaged' ? 'text-amber-400' : 'text-gray-700'}`}>Rusak</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Stok tidak berubah</p>
              </button>
            </div>
          </div>
        )}

        {/* === ALASAN RETURN === */}
        {selected && (
          <div className="rounded-xl bg-white border border-gray-200 p-5 space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
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
                      ? 'bg-[#FF5F03]/10 border border-[#FF5F03]/40 text-[#FF5F03]'
                      : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-[#FF5F03]" />
              Catatan
              <span className="normal-case font-normal text-gray-400">(opsional)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value.slice(0, 200))}
              maxLength={200}
              rows={3}
              className="w-full rounded-xl text-sm px-4 py-3.5 resize-none font-medium bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#072C2C]/30 transition-all placeholder:text-gray-400"
              placeholder="Catatan tambahan..."
            />
            <p className="text-right text-[10px] mt-1.5 text-gray-400">{note.length}/200</p>
          </div>
        )}

        {/* === RINGKASAN & SUBMIT === */}
        {selected && (
          <div className="rounded-xl bg-white border border-gray-200 p-4 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Ringkasan</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Produk</span>
                <span className="text-gray-900 font-medium truncate ml-4">{selected.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Jumlah</span>
                <span className="text-gray-900 font-bold">{quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Kondisi</span>
                <span className={`font-semibold ${condition === 'good' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {condition === 'good' ? 'Bagus' : 'Rusak'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Stok setelah</span>
                <span className={`font-bold ${condition === 'good' ? 'text-emerald-400' : 'text-gray-900'}`}>
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
            className="px-5 py-3 rounded-xl text-sm font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all active:scale-95"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading || !selectedProduct}
            className="px-6 py-3 rounded-xl text-sm font-bold bg-[#FF5F03] text-white hover:bg-[#FF5F03]/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:scale-[0.97] shadow-lg shadow-[#FF5F03]/20"
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

      {/* Camera Scanner Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <button
            onClick={() => setShowCamera(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="relative w-full max-w-sm mx-4">
            <p className="text-center text-sm font-medium text-white/80 mb-4">Arahkan kamera ke barcode produk</p>
            <div className="relative rounded-2xl overflow-hidden border-2 border-[#FF5F03]/30 shadow-2xl shadow-[#FF5F03]/10">
              <div id="return-barcode-scanner" ref={(el) => {
                if (!el || (el as any).__started) return;
                (el as any).__started = true;
                import('html5-qrcode').then(({ Html5Qrcode }) => {
                  const scanner = new Html5Qrcode('return-barcode-scanner');
                  scanner.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 280, height: 120 } },
                    (text: string) => {
                      playBeep()
                      setProductSearch(text)
                      const found = products.find(p =>
                        p.sku.toLowerCase() === text.toLowerCase() ||
                        p.sku.replace(/[-\s]/g, '').toLowerCase() === text.replace(/[-\s]/g, '').toLowerCase()
                      )
                      if (found) {
                        handleSelectProduct(found.id)
                        setScanStatus('found')
                        setTimeout(() => setScanStatus('idle'), 2000)
                      } else {
                        setScanStatus('not-found')
                        setTimeout(() => setScanStatus('idle'), 2000)
                      }
                      scanner.stop().catch(() => {})
                      setShowCamera(false)
                    },
                    () => {}
                  ).catch(() => {});
                });
              }} className="w-full" />
              {/* Guide overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[70%] h-24 border-2 border-[#FF5F03] rounded-lg shadow-[0_0_20px_rgba(255,95,3,0.3)]">
                  <div className="absolute top-1/2 left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-[#FF5F03] to-transparent animate-pulse" />
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-zinc-500 mt-3">Pastikan barcode terlihat jelas dalam kotak panduan</p>
          </div>
        </div>
      )}

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
