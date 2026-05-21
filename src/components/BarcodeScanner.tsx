'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (code: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrCodeRef = useRef<any>(null)
  const [error, setError] = useState('')
  const [isStarting, setIsStarting] = useState(true)

  useEffect(() => {
    let scanner: any = null

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        const scannerId = 'barcode-scanner-region'

        if (!document.getElementById(scannerId)) return

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
            onScan(decodedText)
            scanner.stop().catch(() => {})
            onClose()
          },
          () => {}
        )
        setIsStarting(false)
      } catch (err: any) {
        setIsStarting(false)
        if (err?.message?.includes('NotAllowedError') || err?.name === 'NotAllowedError') {
          setError('Akses kamera ditolak. Izinkan akses kamera di pengaturan browser.')
        } else if (err?.message?.includes('NotFoundError') || err?.name === 'NotFoundError') {
          setError('Kamera tidak ditemukan pada perangkat ini.')
        } else {
          setError('Gagal membuka kamera. Pastikan browser mendukung akses kamera.')
        }
      }
    }

    startScanner()

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {})
        html5QrCodeRef.current.clear().catch(() => {})
      }
    }
  }, [onScan, onClose])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-[#1a1a1a] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-[#FDC800]" />
            <h3 className="text-sm font-bold text-white">Scan Barcode / QR</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="p-4">
          {isStarting && !error && (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[#FDC800] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-white/50">Membuka kamera...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <X size={20} className="text-red-400" />
              </div>
              <p className="text-sm text-red-400 px-4">{error}</p>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 rounded-lg text-sm font-bold bg-white/5 text-white/60 hover:bg-white/10 transition"
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
            <p className="text-center text-xs text-white/40 mt-3">
              Arahkan kamera ke barcode atau QR code produk
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
