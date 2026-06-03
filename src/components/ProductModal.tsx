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

  const handlePriceFocus = () => { if (price === 0) setPriceDisplay('') }
  const handlePriceBlur = () => { if (priceDisplay === '' || parseRupiah(priceDisplay) === 0) { setPrice(0); setPriceDisplay(formatRupiah(0)) } }
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => { const raw = e.target.value; const num = parseRupiah(raw); setPrice(num); setPriceDisplay(num === 0 && raw === '' ? '' : formatRupiah(num)) }

  const handleStockFocus = () => { if (stock === 0) setStockDisplay('') }
  const handleStockBlur = () => { if (stockDisplay === '') { setStock(0); setStockDisplay('0') } }
  const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => { const raw = e.target.value.replace(/[^0-9]/g, ''); const num = raw === '' ? 0 : parseInt(raw, 10); setStock(num); setStockDisplay(raw) }

  const handleMinStockFocus = () => { if (minStock === 0) setMinStockDisplay('') }
  const handleMinStockBlur = () => { if (minStockDisplay === '') { setMinStock(0); setMinStockDisplay('0') } }
  const handleMinStockChange = (e: React.ChangeEvent<HTMLInputElement>) => { const raw = e.target.value.replace(/[^0-9]/g, ''); const num = raw === '' ? 0 : parseInt(raw, 10); setMinStock(num); setMinStockDisplay(raw) }

  return (
    <>
      <div className="fixed inset-0 z-[9000] flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
        <div className="absolute inset-0" style={{ background: 'var(--color-overlay)', backdropFilter: 'blur(4px)' }} />
        <div
          className="relative w-full sm:rounded-2xl rounded-t-2xl sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl"
          style={{ background: 'var(--color-card)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-5" style={{ background: 'var(--color-card)', borderBottom: '1px solid var(--color-border)' }}>
            <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--color-text)' }}>{product ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition" style={{ background: 'var(--color-hover-bg)', color: 'var(--color-text-muted)' }}>
              <X size={16} />
            </button>
          </div>

          <div className="sm:hidden flex justify-center pt-0 pb-2">
            <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-border)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-5 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <Package size={16} style={{ color: 'var(--color-secondary)' }} />
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-secondary)' }}>Informasi Dasar</h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Nama Produk</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="form-input" placeholder="Masukkan nama produk" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Kode Produk / SKU</label>
                    <div className="flex gap-2">
                      <input type="text" required value={sku} onChange={e => setSku(e.target.value)} className="form-input flex-1" placeholder="SKU-001" />
                      <button type="button" onClick={() => setShowScanner(true)} className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center transition"
                        style={{ background: 'rgba(255, 95, 3, 0.1)', color: 'var(--color-secondary)' }} title="Scan Barcode">
                        <Camera size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Kategori</label>
                    <select required value={category} onChange={e => setCategory(e.target.value)} className="form-input">
                      <option value="">Pilih Kategori</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Deskripsi</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="form-input resize-none" placeholder="Deskripsi produk (opsional)" />
                </div>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-purple-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-500">Harga & Stok</h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Harga per Unit</label>
                  <input type="text" required inputMode="numeric" value={priceDisplay} onChange={handlePriceChange} onFocus={handlePriceFocus} onBlur={handlePriceBlur} className="form-input" placeholder="Rp 0" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Stok Awal</label>
                    <input type="text" required inputMode="numeric" value={stockDisplay} onChange={handleStockChange} onFocus={handleStockFocus} onBlur={handleStockBlur} className="form-input" placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Minimum Stok</label>
                    <input type="text" required inputMode="numeric" value={minStockDisplay} onChange={handleMinStockChange} onFocus={handleMinStockFocus} onBlur={handleMinStockBlur} className="form-input" placeholder="0" />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 pb-safe" style={{ borderTop: '1px solid var(--color-border)' }}>
              <button type="button" onClick={onClose} className="btn-ghost w-full sm:w-auto justify-center">Batal</button>
              <button type="submit" className="btn-primary w-full sm:w-auto justify-center">
                <Check size={16} />
                Simpan
              </button>
            </div>
          </form>
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner onScan={handleScanResult} onClose={() => setShowScanner(false)} />
      )}
    </>
  )
}
