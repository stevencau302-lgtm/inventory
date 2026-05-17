'use client'

import { useEffect, useState } from 'react'
import { Product, getProducts, getCategories, saveProducts, formatRp, uid, loadSampleData } from '@/lib/store'
import { useToast } from '@/components/Toast'

type TransactionType = 'in' | 'out'

export default function TransactionsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [type, setType] = useState<TransactionType>('in')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    let p = getProducts()
    if (p.length === 0) {
      const data = loadSampleData()
      p = data.products
    }
    setProducts(p)
    setMounted(true)
  }, [])

  if (!mounted) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) {
      toast('Pilih produk terlebih dahulu!', 'error')
      return
    }

    const updated = products.map(p => {
      if (p.id === selectedProduct) {
        const newStock = type === 'in' ? p.stock + quantity : p.stock - quantity
        if (newStock < 0) {
          toast(`Stok tidak cukup! Stok saat ini: ${p.stock}`, 'error')
          return p
        }
        return { ...p, stock: newStock, updatedAt: new Date().toISOString() }
      }
      return p
    })

    const product = products.find(p => p.id === selectedProduct)
    if (type === 'out' && product && product.stock < quantity) {
      return
    }

    setProducts(updated)
    saveProducts(updated)
    toast(
      type === 'in' 
        ? `+${quantity} ${product?.name} berhasil ditambahkan!` 
        : `-${quantity} ${product?.name} berhasil dikurangi!`,
      'success'
    )
    
    // Reset form
    setSelectedProduct('')
    setQuantity(1)
    setNote('')
  }

  const selectedProductData = products.find(p => p.id === selectedProduct)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header Card */}
      <div className="rounded-2xl p-5 bg-gradient-to-r from-emerald-600 to-emerald-500 relative overflow-hidden">
        <button className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-4.5L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Transaksi Baru</h1>
            <p className="text-emerald-100 text-sm">Input data barang masuk / keluar</p>
          </div>
        </div>
      </div>

      {/* Transaction Type */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          <h2 className="text-lg font-semibold text-white">Tipe Transaksi</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Barang Masuk */}
          <button
            type="button"
            onClick={() => setType('in')}
            className={`p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
              type === 'in'
                ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                type === 'in' ? 'bg-emerald-500' : 'bg-slate-700'
              }`}>
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
              </div>
              <div>
                <p className={`font-semibold ${type === 'in' ? 'text-white' : 'text-slate-300'}`}>Barang Masuk</p>
                <p className={`text-sm ${type === 'in' ? 'text-emerald-400' : 'text-slate-500'}`}>Stok barang akan bertambah</p>
              </div>
            </div>
          </button>

          {/* Barang Keluar */}
          <button
            type="button"
            onClick={() => setType('out')}
            className={`p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
              type === 'out'
                ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/10'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                type === 'out' ? 'bg-red-500' : 'bg-slate-700'
              }`}>
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
                </svg>
              </div>
              <div>
                <p className={`font-semibold ${type === 'out' ? 'text-white' : 'text-slate-300'}`}>Barang Keluar</p>
                <p className={`text-sm ${type === 'out' ? 'text-red-400' : 'text-slate-500'}`}>Stok barang akan berkurang</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Detail Produk */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <h2 className="text-lg font-semibold text-white">Detail Produk</h2>
          <span className="text-xs text-slate-500">Lengkapi informasi barang</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pilih Produk */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Pilih Produk <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
              required
              className="form-input"
            >
              <option value="">Pilih produk...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock})</option>
              ))}
            </select>
          </div>

          {/* Selected Product Info */}
          {selectedProductData && (
            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold">
                  {selectedProductData.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{selectedProductData.name}</p>
                  <p className="text-xs text-slate-500">{selectedProductData.category} &middot; {selectedProductData.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{selectedProductData.stock}</p>
                  <p className="text-[10px] text-slate-500">stok saat ini</p>
                </div>
              </div>
            </div>
          )}

          {/* Jumlah */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Jumlah <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-white hover:bg-slate-700 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                </svg>
              </button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={e => setQuantity(Math.max(1, +e.target.value))}
                className="form-input text-center text-lg font-bold flex-1"
              />
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-white hover:bg-slate-700 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Catatan */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Catatan</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              className="form-input"
              placeholder="Tambahkan catatan (opsional)..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              type === 'in'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40'
                : 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/25 hover:shadow-red-500/40'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {type === 'in' ? 'Konfirmasi Barang Masuk' : 'Konfirmasi Barang Keluar'}
          </button>
        </form>
      </div>
    </div>
  )
}
