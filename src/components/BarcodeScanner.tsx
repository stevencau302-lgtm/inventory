'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ScanBarcode, Camera, X, Check, AlertTriangle, Package } from 'lucide-react'
import { Product, formatRp } from '@/lib/store'

// ─── Beep sound using Web Audio API ───
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

// ─── Camera Scanner Modal ───
function CameraScannerModal({ isOpen, onClose, onScan }: { isOpen: boolean; onClose: () => void; onScan: (code: string) => void }) {
  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrCodeRef = useRef<any>(null)

  useEffect(() => {
    if (!isOpen) return

    let scanner: any = null

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        scanner = new Html5Qrcode('barcode-camera-reader')
        html5QrCodeRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 280, height: 120 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            playBeep()
            onScan(decodedText)
            scanner.stop().catch(() => {})
            onClose()
          },
          () => {} // ignore errors
        )
      } catch (err) {
        console.error('Camera scanner error:', err)
      }
    }

    const timer = setTimeout(startScanner, 300)

    return () => {
      clearTimeout(timer)
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {})
        html5QrCodeRef.current = null
      }
    }
  }, [isOpen, onScan, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Scanner container */}
      <div className="relative w-full max-w-sm mx-4">
        {/* Instruction text */}
        <p className="text-center text-sm font-medium text-white/80 mb-4">
          Arahkan kamera ke barcode produk
        </p>

        {/* Camera view */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-[#FDC800]/30 shadow-2xl shadow-[#FDC800]/10">
          <div id="barcode-camera-reader" ref={scannerRef} className="w-full" />

          {/* Gold guide overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[70%] h-24 border-2 border-[#FDC800] rounded-lg shadow-[0_0_20px_rgba(253,200,0,0.3)]">
              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#FDC800] rounded-tl" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#FDC800] rounded-tr" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#FDC800] rounded-bl" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#FDC800] rounded-br" />
              {/* Scanning line animation */}
              <div className="absolute top-1/2 left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-[#FDC800] to-transparent animate-pulse" />
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-500 mt-3">
          Pastikan barcode terlihat jelas dalam kotak panduan
        </p>
      </div>
    </div>
  )
}

// ─── Product Preview Card ───
function ProductPreviewCard({ product, onClose }: { product: Product; onClose?: () => void }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 animate-[fadeInUp_0.3s_ease-out]">
      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xs font-black text-emerald-400 shrink-0">
        {product.name.substring(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{product.name}</p>
        <p className="text-[11px] text-zinc-400">{product.sku} · Stok: <span className="text-emerald-400 font-semibold">{product.stock}</span> · {formatRp(product.price)}</p>
      </div>
      <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
        <Check className="w-4 h-4 text-emerald-400" />
      </div>
    </div>
  )
}

// ─── Main BarcodeInput Component ───
interface BarcodeInputProps {
  products: Product[]
  onProductFound: (product: Product) => void
}

export default function BarcodeInput({ products, onProductFound }: BarcodeInputProps) {
  const [barcode, setBarcode] = useState('')
  const [showCamera, setShowCamera] = useState(false)
  const [status, setStatus] = useState<'idle' | 'found' | 'not-found' | 'scanning'>('idle')
  const [foundProduct, setFoundProduct] = useState<Product | null>(null)
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const bufferRef = useRef('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const searchByBarcode = useCallback((code: string) => {
    const trimmed = code.trim()
    if (!trimmed) return

    setStatus('scanning')
    setBarcode(trimmed)

    // Search by SKU (barcode = SKU in this system)
    const product = products.find(
      p => p.sku.toLowerCase() === trimmed.toLowerCase() ||
           p.sku.replace(/[-\s]/g, '').toLowerCase() === trimmed.replace(/[-\s]/g, '').toLowerCase()
    )

    setTimeout(() => {
      if (product) {
        playBeep()
        setStatus('found')
        setFoundProduct(product)
        onProductFound(product)
      } else {
        setStatus('not-found')
        setFoundProduct(null)
        setShake(true)
        setTimeout(() => setShake(false), 600)
      }
    }, 300)
  }, [products, onProductFound])

  // Handle USB barcode scanner (types fast then presses Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const value = (e.target as HTMLInputElement).value
      searchByBarcode(value)
    }
  }

  // Handle camera scan result
  const handleCameraScan = useCallback((code: string) => {
    setBarcode(code)
    searchByBarcode(code)
    setShowCamera(false)
  }, [searchByBarcode])

  // Reset state
  const handleReset = () => {
    setBarcode('')
    setStatus('idle')
    setFoundProduct(null)
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-3">
      {/* Barcode Input Field */}
      <div className="relative">
        <div className={`relative flex items-center rounded-xl overflow-hidden transition-all duration-300 ${
          status === 'found' ? 'ring-2 ring-emerald-500/50 bg-emerald-500/5' :
          status === 'not-found' ? 'ring-2 ring-red-500/50 bg-red-500/5' :
          'ring-0 bg-[#0f0f0f]'
        } ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
          {/* Barcode icon */}
          <div className="pl-4 pr-2 py-3.5">
            <ScanBarcode className={`w-5 h-5 transition-colors ${
              status === 'found' ? 'text-emerald-400' :
              status === 'not-found' ? 'text-red-400' :
              'text-[#FDC800]'
            }`} />
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={barcode}
            onChange={e => { setBarcode(e.target.value); if (status !== 'idle') setStatus('idle') }}
            onKeyDown={handleKeyDown}
            className="flex-1 py-3.5 pr-2 text-sm font-medium bg-transparent text-white placeholder-zinc-600 outline-none"
            placeholder="Scan atau ketik barcode/SKU produk..."
            autoComplete="off"
            autoFocus
          />

          {/* Camera button */}
          <button
            type="button"
            onClick={() => setShowCamera(true)}
            className="px-3 py-2 mr-2 rounded-lg bg-[#FDC800]/10 border border-[#FDC800]/20 text-[#FDC800] hover:bg-[#FDC800]/20 transition-all active:scale-95"
            title="Scan dengan kamera"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Clear button */}
          {barcode && (
            <button
              type="button"
              onClick={handleReset}
              className="pr-3 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Product Found Card */}
      {status === 'found' && foundProduct && (
        <ProductPreviewCard product={foundProduct} />
      )}

      {/* Not Found Error */}
      {status === 'not-found' && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/20 animate-[fadeInUp_0.3s_ease-out]">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-400">Produk tidak ditemukan</p>
            <p className="text-[11px] text-zinc-500">Barcode "{barcode}" tidak cocok dengan SKU produk manapun</p>
          </div>
        </div>
      )}

      {/* Camera Scanner Modal */}
      <CameraScannerModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onScan={handleCameraScan}
      />

      {/* Custom animations */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
