'use client'

import { useState, useEffect } from 'react'
import { Product, Category, uid } from '@/lib/store'
import { Package, DollarSign, X, Check, Camera } from 'lucide-react'
import BarcodeScanner from './BarcodeScanner'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (product: Product) => void
  product: Product | null
  categories: Category[]
}

function formatRupiah(value: number): string {
  if (value === 0) return 'Rp 0'
  return 'Rp ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function parseRupiah(str: string): number {
  const cleaned = str.replace(/[^0-9]/g, '')
  return cleaned === '' ? 0 : parseInt(cleaned, 10)
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

  // Display state for formatted fields
  const [priceDisplay, setPriceDisplay] = useState('')
  const [stockDisplay, setStockDisplay] = useState('')
  const [minStockDisplay, setMinStockDisplay] = useState('')

  useEffect(() => {
    if (product) {
      setName(product.name)
      setSku(product.sku)
      setCategory(product.category)
      setStock(product.stock)
      setPrice(product.price)
      setMinStock(product.minStock)
      setDescription(product.description)
      setPriceDisplay(formatRupiah(product.price))
      setStockDisplay(product.stock.toString())
      setMinStockDisplay(product.minStock.toString())
    } else {
      setName('')
      setSku('')
      setCategory('')
      setStock(0)
      setPrice(0)
      setMinStock(10)
      setDescription('')
      setPriceDisplay(formatRupiah(0))
      setStockDisplay('0')
      setMinStockDisplay('10')
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

  // Clear-on-focus handlers
  const handlePriceFocus = () => {
    if (price === 0) setPriceDisplay('')
  }
  const handlePriceBlur = () => {
    if (priceDisplay === '' || parseRupiah(priceDisplay) === 0) {
      setPrice(0)
      setPriceDisplay(formatRupiah(0))
    }
  }
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const num = parseRupiah(raw)
    setPrice(num)
    setPriceDisplay(num === 0 && raw === '' ? '' : formatRupiah(num))
  }

  const handleStockFocus = () => {
    if (stock === 0) setStockDisplay('')
  }
  const handleStockBlur = () => {
    if (stockDisplay === '') {
      setStock(0)
      setStockDisplay('0')
    }
  }
  const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    const num = raw === '' ? 0 : parseInt(raw, 10)
    setStock(num)
    setStockDisplay(raw)
  }

  const handleMinStockFocus = () => {
    if (minStock === 0) setMinStockDisplay('')
  }
  const handleMinStockBlur = () => {
    if (minStockDisplay === '') {
      setMinStock(0)
      setMinStockDisplay('0')
    }
  }
  const handleMinStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    const num = raw === '' ? 0 : parseInt(raw, 10)
    setMinStock(num)
    setMinStockDisplay(raw)
  }

  const inputClass = 'w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg text-sm font-medium outline-none transition-all duration-200 bg-[#0f0f0f] border-none text-white placeholder-white/30 focus:ring-2 focus:ring-[#FDC800]/50'
  const labelClass = 'text-[11px] font-semibold text-white/50 uppercase tracking-wider'

  return (
    <>
      <div className="fixed inset-0 z-[9000] flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

        {/* Modal */}
        <div
          className="relative bg-[#1a1a1a] w-full sm:rounded-2xl rounded-t-2xl sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[#1a1a1a] flex items-center justify-between p-4 sm:p-5 border-b border-white/[0.06]">
            <h2 className="text-base sm:text-lg font-bold text-white">{product ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition">
              <X size={16} />
            </button>
          </div>

          {/* Mobile drag indicator */}
          <div className="sm:hidden flex justify-center pt-0 pb-2">
            <div className="w-10 h-1 rounded-full bg-white/10" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-5 sm:space-y-6">

            {/* Section: Informasi Dasar */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-[#FDC800]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#FDC800]">Informasi Dasar</h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className={labelClass}>Nama Produk</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={inputClass}
                    placeholder="Masukkan nama produk"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Kode Produk / SKU</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={sku}
                        onChange={e => setSku(e.target.value)}
                        className={`${inputClass} flex-1`}
                        placeholder="SKU-001"
                      />
                      <button
                        type="button"
                        onClick={() => setShowScanner(true)}
                        className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-[#FDC800]/10 text-[#FDC800] hover:bg-[#FDC800]/20 flex items-center justify-center transition"
                        title="Scan Barcode"
                      >
                        <Camera size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Kategori</label>
                    <select
                      required
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className={`${inputClass} appearance-none`}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        paddingRight: '40px',
                      }}
                    >
                      <option value="">Pilih Kategori</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Deskripsi</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    className={`${inputClass} resize-none`}
                    placeholder="Deskripsi produk (opsional)"
                  />
                </div>
              </div>
            </div>

            {/* Section: Harga & Stok */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-[#432DD7]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#432DD7]">Harga & Stok</h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className={labelClass}>Harga per Unit</label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    value={priceDisplay}
                    onChange={handlePriceChange}
                    onFocus={handlePriceFocus}
                    onBlur={handlePriceBlur}
                    className={inputClass}
                    placeholder="Rp 0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Stok Awal</label>
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      value={stockDisplay}
                      onChange={handleStockChange}
                      onFocus={handleStockFocus}
                      onBlur={handleStockBlur}
                      className={inputClass}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Minimum Stok</label>
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      value={minStockDisplay}
                      onChange={handleMinStockChange}
                      onFocus={handleMinStockFocus}
                      onBlur={handleMinStockBlur}
                      className={inputClass}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-white/[0.06] pb-safe">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-lg text-sm font-bold text-white/60 bg-white/5 hover:bg-white/10 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-lg text-sm font-bold bg-[#FDC800] text-black hover:bg-[#FDC800]/90 transition cursor-pointer"
              >
                <Check size={16} />
                Simpan
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Barcode Scanner */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleScanResult}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  )
}
