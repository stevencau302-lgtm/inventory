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
  const [scanMode, setScanMode] = useState(false)
  const [scanActive, setScanActive] = useState(false)
  const [scanBuffer, setScanBuffer] = useState('')
  const productDropdownRef = useRef<HTMLDivElement>(null)
  const scanInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

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

  // Camera barcode scanning
  useEffect(() => {
    if (!scanMode) {
      // Cleanup when scan mode is turned off
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
        scanIntervalRef.current = null
      }
      setScanActive(false)
      return
    }

    let cancelled = false

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setScanActive(true)

        // Use BarcodeDetector if available (Chrome, Edge, Android)
        if ('BarcodeDetector' in window) {
          const detector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e', 'itf']
          })

          scanIntervalRef.current = setInterval(async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) return
            try {
              const barcodes = await detector.detect(videoRef.current)
              if (barcodes.length > 0) {
                const code = barcodes[0].rawValue
                handleBarcodeScan(code)
              }
            } catch {}
          }, 300)
        } else {
          // Fallback: no native BarcodeDetector — user needs to type SKU manually
          toast('Kamera aktif, tapi browser ini tidak support auto-scan. Ketik SKU manual di bawah.', 'error')
        }
      } catch (err) {
        toast('Tidak bisa akses kamera. Pastikan izin kamera diaktifkan.', 'error')
        setScanMode(false)
      }
    }

    startCamera()

    return () => {
      cancelled = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
        scanIntervalRef.current = null
      }
    }
  }, [scanMode])

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
  const stockAfter = selected ? selected.stock + (type === 'in' ? quantity : -quantity) : 0

  const handleBarcodeScan = (code: string) => {
    const matched = products.find(p =>
      p.sku.toLowerCase() === code.toLowerCase() ||
      p.sku.toLowerCase().replace(/[-_\s]/g, '') === code.toLowerCase().replace(/[-_\s]/g, '')
    )
    if (matched) {
      handleSelectProduct(matched.id)
      setProductSearch(matched.name)
      toast(`Produk ditemukan: ${matched.name}`, 'success')
      // Vibrate for haptic feedback on mobile
      if (navigator.vibrate) navigator.vibrate(100)
    } else {
      toast(`SKU "${code}" tidak ditemukan di database`, 'error')
      if (navigator.vibrate) navigator.vibrate([50, 50, 50])
    }
  }

  const handleSelectProduct = (id: string) => {
    setSelectedProduct(id)
    const p = products.find(pr => pr.id === id)
    if (p) setProductSearch(p.name)
    setShowProductDropdown(false)
    setScanMode(false)
  }

  const handleScanInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const val = (e.target as HTMLInputElement).value.trim()
      if (val.length >= 2) {
        handleBarcodeScan(val)
      }
      ;(e.target as HTMLInputElement).value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) { toast('Pilih produk terlebih dahulu!', 'error'); return }
    const product = products.find(p => p.id === selectedProduct)
    if (!product) return
    if (type === 'out' && product.stock < quantity) { toast(`Stok tidak cukup! Sisa: ${product.stock}`, 'error'); return }

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
      createdAt: new Date().toISOString()
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
    <div className="max-w-5xl mx-auto pb-24 sm:pb-8">
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
      <div className="flex-1 min-w-0 max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* === TIPE TRANSAKSI === */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 block">
            Tipe Transaksi
          </label>
          <div className="flex flex-col gap-3">
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

        {/* === PILIH PRODUK === */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Pilih Produk
            </label>
            <button
              type="button"
              onClick={() => setScanMode(!scanMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 ${
                scanMode
                  ? 'bg-[#FDC800] text-[#1a1a1a] shadow-md shadow-[#FDC800]/20'
                  : 'bg-[#1a1a1a] text-zinc-400 border border-white/[0.06] hover:border-[#FDC800]/30'
              }`}
            >
              <ScanBarcode className="w-3.5 h-3.5" />
              {scanMode ? 'Scan Aktif' : 'Scan Barcode'}
            </button>
          </div>

          {/* Scan Mode — Camera */}
          {scanMode && (
            <div className="mb-3 rounded-xl bg-[#FDC800]/5 border border-[#FDC800]/20 p-4 animate-[fadeInUp_0.2s_ease-out]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#FDC800] animate-pulse" />
                  <p className="text-xs font-semibold text-[#FDC800]">Kamera Scanner</p>
                </div>
                <button
                  type="button"
                  onClick={() => setScanMode(false)}
                  className="text-zinc-500 hover:text-zinc-300 active:scale-90 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 mb-3">Arahkan kamera ke barcode produk</p>
              <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Scan overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[70%] h-[40%] border-2 border-[#FDC800]/60 rounded-xl relative">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#FDC800] rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#FDC800] rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#FDC800] rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#FDC800] rounded-br-lg" />
                    <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-[#FDC800]/40 animate-[scanLine_2s_ease-in-out_infinite]" />
                  </div>
                </div>
                {!scanActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <p className="text-xs text-zinc-400">Mengaktifkan kamera...</p>
                  </div>
                )}
              </div>
              {/* Manual SKU input fallback */}
              <div className="mt-3">
                <input
                  ref={scanInputRef}
                  type="text"
                  onKeyDown={handleScanInput}
                  className="w-full rounded-lg text-sm px-4 py-2.5 font-mono bg-[#0f0f0f] text-[#FDC800] border border-[#FDC800]/20 focus:outline-none focus:ring-2 focus:ring-[#FDC800]/50 transition-all placeholder:text-zinc-600 placeholder:font-normal"
                  placeholder="Atau ketik SKU manual + Enter"
                  autoComplete="off"
                />
              </div>
            </div>
          )}

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
              <div className="absolute z-50 left-0 right-0 top-full mt-2 rounded-xl bg-[#1a1a1a] border border-white/[0.06] max-h-64 overflow-y-auto shadow-2xl shadow-black/50 animate-[slideDown_0.2s_ease-out]">
                {filteredProducts.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-zinc-500">Produk tidak ditemukan</div>
                ) : filteredProducts.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProduct(p.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-[#FDC800]/5 active:bg-[#FDC800]/10 border-b border-white/[0.04] last:border-b-0 ${selectedProduct === p.id ? 'bg-[#FDC800]/5' : ''}`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#432DD7] flex items-center justify-center text-[10px] font-black text-white shrink-0">
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
        </div>

        {/* === SELECTED PRODUCT CARD === */}
        {selected && (
          <div className="rounded-2xl bg-[#432DD7] p-4 sm:p-5 text-white animate-[fadeInUp_0.3s_ease-out]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center text-xs font-black">
                {selected.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{selected.name}</p>
                <p className="text-xs text-white/60">{selected.sku} · {selected.category}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/10 px-3 py-2 text-center">
                <p className="text-[10px] text-white/60">Stok</p>
                <p className="text-base font-bold">{selected.stock}</p>
              </div>
              <div className="rounded-xl bg-white/10 px-3 py-2 text-center">
                <p className="text-[10px] text-white/60">Harga</p>
                <p className="text-xs font-bold">{formatRp(selected.price)}</p>
              </div>
              <div className="rounded-xl bg-white/10 px-3 py-2 text-center">
                <p className="text-[10px] text-white/60">Setelah</p>
                <p className={`text-base font-bold ${stockAfter < selected.minStock ? 'text-amber-300' : 'text-white'}`}>
                  {stockAfter}
                </p>
              </div>
            </div>
            {stockAfter < selected.minStock && (
              <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl bg-amber-500/20 animate-[fadeIn_0.3s_ease-out]">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="text-[11px] font-semibold text-amber-300">Di bawah minimum ({selected.minStock})</span>
              </div>
            )}
          </div>
        )}

        {/* === JUMLAH === */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 block">
            Jumlah
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-14 h-14 rounded-xl bg-[#1a1a1a] border border-white/[0.06] flex items-center justify-center text-[#fafafa] hover:bg-white/[0.04] active:scale-90 transition-all shrink-0"
            >
              <Minus className="w-5 h-5" />
            </button>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={e => setQuantity(Math.max(1, +e.target.value))}
              className="flex-1 min-w-0 rounded-xl text-center text-2xl font-bold py-3 bg-[#0f0f0f] text-[#fafafa] border-none focus:outline-none focus:ring-2 focus:ring-[#FDC800]/50 transition-all"
            />
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-14 h-14 rounded-xl bg-[#1a1a1a] border border-white/[0.06] flex items-center justify-center text-[#fafafa] hover:bg-white/[0.04] active:scale-90 transition-all shrink-0"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* === TANGGAL === */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5 text-[#FDC800]" />
            Tanggal
          </label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full rounded-xl text-sm px-4 py-3.5 font-medium bg-[#0f0f0f] text-[#fafafa] border-none focus:outline-none focus:ring-2 focus:ring-[#FDC800]/50 transition-all"
            style={{ colorScheme: 'dark' }}
          />
        </div>

        {/* === CATATAN === */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-[#432DD7]" />
            Catatan
            <span className="normal-case font-normal text-zinc-600">(opsional)</span>
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value.slice(0, 200))}
            maxLength={200}
            rows={3}
            className="w-full rounded-xl text-sm px-4 py-3.5 resize-none font-medium bg-[#0f0f0f] text-[#fafafa] border-none focus:outline-none focus:ring-2 focus:ring-[#FDC800]/50 transition-all placeholder:text-zinc-600"
            placeholder="Tambahkan catatan..."
          />
          <p className="text-right text-[10px] mt-1.5 text-zinc-600">{note.length}/200</p>
        </div>

        {/* === SUBMIT BUTTONS === */}
        <div className="flex gap-3 pt-4 lg:hidden">
          <button
            type="button"
            onClick={() => router.push('/transactions')}
            className="px-5 py-3.5 rounded-xl text-sm font-bold bg-[#1a1a1a] border border-white/[0.06] text-zinc-300 hover:bg-white/[0.04] transition-all active:scale-95"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading || !selectedProduct}
            className="flex-1 py-3.5 rounded-xl text-sm font-bold bg-[#FDC800] text-[#1a1a1a] hover:bg-[#FDC800]/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.97] shadow-lg shadow-[#FDC800]/20"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Simpan Transaksi
              </>
            )}
          </button>
        </div>
      </form>
      </div>

      {/* RIGHT - Ringkasan Sticky (desktop only) */}
      <div className="hidden lg:block lg:w-[300px] shrink-0">
        <div className="lg:sticky lg:top-8 space-y-4">
          <div className="rounded-2xl overflow-hidden" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <svg className="w-4 h-4 text-[#FDC800]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
              <span className="text-sm font-semibold text-white">Ringkasan</span>
            </div>
            {selected ? (
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center gap-3 pb-3" style={{ borderBottom: '1px solid #27272a' }}>
                  <div className="w-9 h-9 rounded-lg bg-[#432DD7] flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">{selected.name.substring(0, 2).toUpperCase()}</span>
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
                <div className="mt-3 rounded-xl p-3" style={{ background: '#0f0f0f' }}>
                  <div className="flex justify-between mb-2"><span className="text-[11px] text-zinc-500">Stok saat ini</span><span className="text-sm text-zinc-300">{selected.stock}</span></div>
                  <div className="flex justify-between"><span className="text-[11px] text-zinc-500">Stok setelah</span><span className={`text-lg font-bold ${stockAfter < selected.minStock ? 'text-amber-400' : 'text-white'}`}>{stockAfter}</span></div>
                  {stockAfter < selected.minStock && (
                    <div className="flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)' }}>
                      <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="text-[10px] text-amber-400">Di bawah minimum ({selected.minStock})</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="px-5 py-8 text-center">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: '#0f0f0f' }}>
                  <Package className="w-5 h-5 text-zinc-600" />
                </div>
                <p className="text-xs text-zinc-600">Pilih produk untuk melihat ringkasan</p>
              </div>
            )}
          </div>
          {/* Desktop submit buttons */}
          <button
            type="button"
            onClick={() => { const f = document.querySelector('form'); f?.requestSubmit() }}
            disabled={loading || !selectedProduct}
            className="w-full py-3.5 rounded-xl text-sm font-bold bg-[#FDC800] text-[#1a1a1a] hover:bg-[#FDC800]/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.97] shadow-lg shadow-[#FDC800]/20"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Simpan Transaksi
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push('/transactions')}
            className="w-full py-3 rounded-xl text-zinc-400 text-sm font-medium hover:text-white transition-all text-center"
            style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)' }}
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
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scanLine {
          0%, 100% { transform: translateY(-100%); opacity: 0.4; }
          50% { transform: translateY(100%); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
