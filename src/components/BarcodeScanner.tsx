'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, ScanBarcode } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (code: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrCodeRef = useRef<any>(null)
  const [error, setError] = useState('')
  const [isStarting, setIsStarting] = useState(true)
  const onScanRef = useRef(onScan)
  const mountedRef = useRef(true)

  // Keep ref updated
  onScanRef.current = onScan

  useEffect(() => {
    mountedRef.current = true
    let scanner: any = null
    let stopped = false

    const startScanner = async () => {
      try {
        // Small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (!mountedRef.current) return
        
        const { Html5Qrcode } = await import('html5-qrcode')
        
        if (!mountedRef.current) return
        
        const scannerId = 'barcode-scanner-region'
        const element = document.getElementById(scannerId)
        if (!element) return

        scanner = new Html5Qrcode(scannerId)
        html5QrCodeRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 120 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            if (stopped) return
            stopped = true
            // Stop scanner first, then call onScan
            scanner.stop().catch(() => {}).finally(() => {
              if (mountedRef.current) {
                onScanRef.current(decodedText)
              }
            })
          },
          () => {
            // ignore scan errors (no code found)
          }
        )
        
        if (mountedRef.current) {
          setIsStarting(false)
        }
      } catch (err: any) {
        if (!mountedRef.current) return
        setIsStarting(false)
        
        const errMsg = err?.message || err?.toString() || ''
        if (errMsg.includes('NotAllowedError') || err?.name === 'NotAllowedError') {
          setError('Akses kamera ditolak. Izinkan akses kamera di pengaturan browser.')
        } else if (errMsg.includes('NotFoundError') || err?.name === 'NotFoundError') {
          setError('Kamera tidak ditemukan pada perangkat ini.')
        } else {
          setError('Gagal membuka kamera. Pastikan browser mendukung akses kamera.')
        }
      }
    }

    startScanner()

    return () => {
      mountedRef.current = false
      stopped = true
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop().catch(() => {})
        } catch {}
        try {
          html5QrCodeRef.current.clear()
        } catch {}
        html5QrCodeRef.current = null
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
        style={{ background: '#1a1a1a' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid #27272a' }}>
          <div className="flex items-center gap-2">
            <ScanBarcode size={16} color="#FDC800" />
            <h3 className="text-sm font-bold text-white">Scan Barcode / QR</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-400 transition"
            style={{ background: '#0f0f0f' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="p-4">
          {isStarting && !error && (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#FDC800', borderTopColor: 'transparent' }} />
                <p className="text-xs" style={{ color: '#71717a' }}>Membuka kamera...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <X size={20} className="text-red-400" />
              </div>
              <p className="text-sm text-red-400 px-4">{error}</p>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 rounded-lg text-sm font-bold transition"
                style={{ background: '#0f0f0f', color: '#a1a1aa' }}
              >
                Tutup
              </button>
            </div>
          )}

          <div
            id="barcode-scanner-region"
            ref={scannerRef}
            className="w-full rounded-lg overflow-hidden"
            style={{ minHeight: error ? '0px' : '280px' }}
          />

          {!error && !isStarting && (
            <p className="text-center text-xs mt-3" style={{ color: '#71717a' }}>
              Arahkan kamera ke barcode atau QR code produk
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
