'use client'

import { useState, useEffect } from 'react'
import { Product, Category, uid } from '@/lib/store'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (product: Product) => void
  product: Product | null
  categories: Category[]
}

export default function ProductModal({ isOpen, onClose, onSave, product, categories }: ProductModalProps) {
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [category, setCategory] = useState('')
  const [stock, setStock] = useState(0)
  const [price, setPrice] = useState(0)
  const [minStock, setMinStock] = useState(10)
  const [description, setDescription] = useState('')
  const [showScanner, setShowScanner] = useState(false)

  useEffect(() => {
    if (product) {
      setName(product.name)
      setSku(product.sku)
      setCategory(product.category)
      setStock(product.stock)
      setPrice(product.price)
      setMinStock(product.minStock)
      setDescription(product.description)
    } else {
      setName('')
      setSku('')
      setCategory('')
      setStock(0)
      setPrice(0)
      setMinStock(10)
      setDescription('')
    }
  }, [product, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const now = new Date().toISOString()
    onSave({
      id: product?.id || uid(),
      name, sku, category, stock, price, minStock, description,
      createdAt: product?.createdAt || now,
      updatedAt: now,
    })
  }

  const handleScanResult = (code: string) => {
    setSku(code)
    setShowScanner(false)
  }

  const inputClass = "w-full rounded-lg text-sm px-3 py-2.5 sm:px-4 sm:py-3 font-medium bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#072C2C] focus:ring-2 focus:ring-[#072C2C]/10 focus:bg-white transition"

  return (
    <>
      <div className="fixed inset-0 z-[9000] flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        
        {/* Modal */}
        <div 
          className="relative rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl bg-white border border-gray-200"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-5 bg-white border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FF5F03]/10 border border-[#FF5F03]/20 flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF5F03]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">{product ? 'Edit Produk' : 'Tambah Produk'}</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile drag indicator */}
          <div className="sm:hidden flex justify-center pt-1 pb-2">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama Produk */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[#FF5F03]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /></svg>
                  Nama Produk
                </label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="Masukkan nama produk" />
              </div>

              {/* SKU */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[#072C2C]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /></svg>
                  SKU
                </label>
                <div className="flex gap-2">
                  <input type="text" required value={sku} onChange={e => setSku(e.target.value)} className={`flex-1 ${inputClass}`} placeholder="SKU-001" />
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-[#072C2C] hover:bg-[#072C2C]/5 transition"
                    title="Scan Barcode"
                  >
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>
                  </button>
                </div>
              </div>

              {/* Kategori */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-violet-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z M6 6h.008v.008H6V6z" /></svg>
                  Kategori
                </label>
                <select required value={category} onChange={e => setCategory(e.target.value)} className={inputClass}>
                  <option value="">Pilih Kategori</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              {/* Stok */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                  {product ? 'Stok Saat Ini' : 'Stok Awal'}
                </label>
                {product ? (
                  <div className="w-full rounded-lg text-sm px-3 py-2.5 sm:px-4 sm:py-3 font-medium bg-gray-100 border border-gray-200 text-gray-500 flex items-center justify-between">
                    <span>{stock}</span>
                    <span className="text-[10px] text-gray-400">Ubah via Transaksi</span>
                  </div>
                ) : (
                  <input type="number" inputMode="numeric" required min={0} value={stock} onChange={e => setStock(+e.target.value)} className={inputClass} placeholder="0" />
                )}
              </div>

              {/* Harga */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
                  Harga (Rp)
                </label>
                <input type="number" inputMode="numeric" required min={0} value={price} onChange={e => setPrice(+e.target.value)} className={inputClass} />
              </div>

              {/* Min. Stok */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                  Min. Stok
                </label>
                <input type="number" inputMode="numeric" required min={0} value={minStock} onChange={e => setMinStock(+e.target.value)} className={inputClass} />
              </div>
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                Deskripsi
              </label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={`${inputClass} resize-none`} placeholder="Deskripsi produk..." />
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={onClose} className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-lg text-sm font-bold text-gray-600 bg-gray-100 border border-gray-200 hover:bg-gray-200 transition text-center">
                Batal
              </button>
              <button type="submit" className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-lg text-sm font-bold bg-[#FF5F03] text-white hover:bg-[#e85503] transition flex items-center justify-center gap-2 shadow-lg shadow-[#FF5F03]/20">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Simpan
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Barcode Scanner */}
      {showScanner && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="relative w-full max-w-sm mx-4">
            <button onClick={() => setShowScanner(false)} className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all z-10">
              <span className="text-lg">&times;</span>
            </button>
            <p className="text-center text-sm font-medium text-white/80 mb-4">Arahkan kamera ke barcode produk</p>
            <div className="rounded-2xl overflow-hidden border-2 border-[#072C2C]/30" id="barcode-scanner-modal" ref={(el) => {
              if (!el || (el as any).__started) return;
              (el as any).__started = true;
              import('html5-qrcode').then(({ Html5Qrcode }) => {
                const scanner = new Html5Qrcode('barcode-scanner-modal');
                scanner.start(
                  { facingMode: 'environment' },
                  { fps: 10, qrbox: { width: 280, height: 120 } },
                  (text: string) => { handleScanResult(text); scanner.stop().catch(() => {}); },
                  () => {}
                ).catch(() => {});
              });
            }} />
          </div>
        </div>
      )}
    </>
  )
}
