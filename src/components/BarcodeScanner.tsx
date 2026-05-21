'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

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
  }, [onScan])

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
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#FDC800"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>
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
