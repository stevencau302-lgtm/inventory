'use client'

import { useState, useEffect } from 'react'
import { Product, Category, uid } from '@/lib/store'
import { Package, DollarSign, X, Check } from 'lucide-react'

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

  const inputClass = 'w-full px-4 py-3 rounded-lg text-sm font-medium outline-none transition-all duration-200 bg-[#0f0f0f] border-none text-white placeholder-white/30 focus:ring-2 focus:ring-[#FDC800]/50'
  const labelClass = 'text-[11px] font-semibold text-white/50 uppercase tracking-wider'

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-[#1a1a1a] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="text-lg font-bold text-white">{product ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-6">

          {/* Section: Informasi Dasar */}
          <div className="space-y-4">
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
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    className={inputClass}
                    placeholder="SKU-001"
                  />
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
          <div className="space-y-4">
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
          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-white/60 bg-white/5 hover:bg-white/10 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-[#FDC800] text-black hover:bg-[#FDC800]/90 transition cursor-pointer"
            >
              <Check size={16} />
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
