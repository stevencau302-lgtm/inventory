'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Product, Transaction, formatRp, uid, fetchProducts, saveProduct, saveTransaction } from '@/lib/store'
import { useToast } from '@/components/Toast'
import {
  ArrowLeft, ArrowDownCircle, ArrowUpCircle, Search, Package,
  CalendarDays, FileText, Save, Loader2, AlertTriangle,
  X, Minus, Plus, Sparkles, ScanBarcode, Zap, ClipboardList, Layers
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import BarcodeInput from '@/components/BarcodeScanner'

// ─── Collapsible Scanner Section ───
function ScannerSection({ products, onProductFound }: { products: Product[]; onProductFound: (p: Product) => void }) {
  const [open, setOpen] = useState(false)

  const handleFound = (product: Product) => {
    onProductFound(product)
    // Auto-collapse after successful scan
    setTimeout(() => setOpen(false), 600)
  }

  return (
    <div>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
          open
            ? 'border-[#FF5F03]/30 bg-[#FF5F03]/5 text-[#FF5F03]'
            : 'border-gray-200 bg-transparent text-gray-500 hover:text-[#FF5F03] hover:border-[#FF5F03]/20 hover:bg-[#FF5F03]/5'
        }`}
      >
        {open ? (
          <>
            <X className="w-3.5 h-3.5" />
            Nonaktifkan Scanner
          </>
        ) : (
          <>
            <ScanBarcode className="w-3.5 h-3.5" />
            Aktifkan Scanner
          </>
        )}
      </button>

      {/* Expandable scanner area */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              <div className="rounded-xl bg-white border border-gray-200 p-4">
                <p className="text-[11px] text-gray-500 mb-3">Scan barcode atau ketik SKU produk untuk mengisi form otomatis</p>
                <BarcodeInput products={products} onProductFound={handleFound} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

type TransactionType = 'in' | 'out'
type Mode = null | 'single' | 'bulk'

export default function NewTransactionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [mode, setMode] = useState<Mode>('single')
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
  const productDropdownRef = useRef<HTMLDivElement>(null)

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

  if (!mounted) return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="flex flex-col items-center gap-3 animate-pulse">
        <Loader2 className="w-8 h-8 text-[#FF5F03] animate-spin" />
        <p className="text-gray-500 text-sm">Memuat...</p>
      </div>
    </div>
  )

  // Mode Selection Screen removed - go directly to form
  if (mode === null) {
    setMode('single')
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  )
  const selected = products.find(p => p.id === selectedProduct)

  const handleSelectProduct = (id: string) => {
    setSelectedProduct(id)
    const p = products.find(pr => pr.id === id)
    if (p) setProductSearch(p.name)
    setShowProductDropdown(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) { toast('Pilih produk terlebih dahulu!', 'error'); return }

    const product = products.find(p => p.id === selectedProduct)
    if (!product) { toast('Produk tidak ditemukan', 'error'); return }

    if (type === 'out' && product.stock < quantity) {
      toast(`Stok tidak cukup! Sisa: ${product.stock}`, 'error')
      return
    }

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
      createdAt: (() => { const now = new Date(); const [y, m, d] = date.split('-').map(Number); now.setFullYear(y, m - 1, d); return now.toISOString() })()
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

    setTimeout(() => router.push('/products'), 1200)
  }

  // Bulk Entry Mode
  if (mode === 'bulk') {
    return <BulkEntryForm products={products} router={router} toast={toast} />
  }

  // Success animation
  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4 animate-[fadeInUp_0.5s_ease-out]">
          <div className="w-20 h-20 rounded-full bg-[#16A34A]/10 flex items-center justify-center animate-[scaleIn_0.4s_ease-out]">
            <Sparkles className="w-10 h-10 text-[#16A34A]" />
          </div>
          <p className="text-xl font-bold text-gray-900">Transaksi Tersimpan!</p>
          <p className="text-sm text-gray-500">Mengalihkan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-2 px-4 lg:px-8">
      {/* Back + Header */}
      <div className="mb-6">
        <button onClick={() => router.push('/products')} className="group flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 mb-3 transition">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Kembali
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{type === 'in' ? 'Tambah Barang Masuk' : 'Catat Barang Keluar'}</h1>
        <p className="text-gray-500 text-sm mt-0.5">{type === 'in' ? 'Catat barang yang masuk ke inventory' : 'Catat barang yang keluar dari inventory'}</p>
      </div>

      <form id="txForm" onSubmit={handleSubmit} className="space-y-8">

        {/* === TIPE TRANSAKSI === */}
        <div>
          <div className={`rounded-t-xl px-6 py-4 ${type === 'in' ? 'bg-[#16A34A]' : 'bg-[#DC2626]'}`}>
            <div className="flex items-center gap-3">
              {type === 'in' ? <ArrowDownCircle size={18} className="text-white" /> : <ArrowUpCircle size={18} className="text-white" />}
              <div>
                <p className="text-base font-bold text-white">{type === 'in' ? 'Informasi Barang Masuk' : 'Informasi Barang Keluar'}</p>
                <p className="text-xs text-white/80">{type === 'in' ? 'Data transaksi barang masuk' : 'Data transaksi barang keluar'}</p>
              </div>
            </div>
          </div>
          <div className="rounded-b-xl border border-t-0 border-gray-200 bg-white p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setType('in')}
              className={`relative w-full p-4 rounded-xl text-left transition-all duration-300 active:scale-[0.97] ${
                type === 'in'
                  ? 'bg-[#16A34A] text-white ring-2 ring-[#16A34A]/30 shadow-md shadow-[#16A34A]/20'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-[#16A34A]/30'
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
                  <p className={`text-sm mt-0.5 ${type === 'in' ? 'text-white/80' : 'text-gray-500'}`}>Stok bertambah +</p>
                </div>
                {type === 'in' && (
                  <div className="w-3 h-3 rounded-full bg-white animate-pulse shrink-0" />
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setType('out')}
              className={`relative w-full p-4 rounded-xl text-left transition-all duration-300 active:scale-[0.97] ${
                type === 'out'
                  ? 'bg-[#DC2626] text-white ring-2 ring-[#DC2626]/30 shadow-md shadow-[#DC2626]/20'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-[#DC2626]/30'
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
                  <p className={`text-sm mt-0.5 ${type === 'out' ? 'text-white/80' : 'text-gray-500'}`}>Stok berkurang -</p>
                </div>
                {type === 'out' && (
                  <div className="w-3 h-3 rounded-full bg-white animate-pulse shrink-0" />
                )}
              </div>
            </button>
          </div>
          </div>
        </div>

        {/* === BARCODE SCANNER (collapsible) === */}
        <ScannerSection
          products={products}
          onProductFound={(product) => {
            setSelectedProduct(product.id)
            setProductSearch(product.name)
            setShowProductDropdown(false)
            setTimeout(() => {
              const qtyInput = document.querySelector('input[type="number"]') as HTMLInputElement
              qtyInput?.focus()
              qtyInput?.select()
            }, 400)
          }}
        />

        {/* === DETAIL PRODUK === */}
        <div>
          <div className="rounded-t-xl px-6 py-4 bg-[#072C2C]">
            <div className="flex items-center gap-3">
              <Search size={18} className="text-white" />
              <div>
                <p className="text-base font-bold text-white">Detail Produk</p>
                <p className="text-xs text-white/80">Pilih produk dan jumlah</p>
              </div>
            </div>
          </div>
          <div className="rounded-b-xl border border-t-0 border-gray-200 bg-white p-6 lg:p-8 space-y-4">

          {/* Search dropdown */}
          <div className="relative" ref={productDropdownRef}>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={productSearch}
                onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); setSelectedProduct('') }}
                onFocus={() => setShowProductDropdown(true)}
                className="w-full rounded-xl text-sm pl-11 pr-10 py-3.5 font-medium bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#072C2C]/30 transition-all placeholder:text-gray-400"
                placeholder="Cari nama produk atau SKU..."
                autoComplete="off"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={() => { setProductSearch(''); setSelectedProduct(''); setShowProductDropdown(true) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dropdown */}
            {showProductDropdown && (
              <div className="absolute z-50 left-0 right-0 top-full mt-2 rounded-xl bg-white border border-gray-200 max-h-64 overflow-y-auto shadow-2xl shadow-black/10 animate-[slideDown_0.2s_ease-out]">
                {filteredProducts.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">Produk tidak ditemukan</div>
                ) : filteredProducts.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProduct(p.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-[#FF5F03]/5 active:bg-[#FF5F03]/10 border-b border-gray-100 last:border-b-0 ${selectedProduct === p.id ? 'bg-[#FF5F03]/5' : ''}`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#FF5F03]/10 flex items-center justify-center text-[10px] font-black text-[#FF5F03] shrink-0">
                      {p.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                      <p className="text-[11px] text-gray-500">{p.sku} · Stok: {p.stock}</p>
                    </div>
                    <span className="text-[11px] font-medium text-gray-500 shrink-0">{formatRp(p.price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          {selected && (
            <div className="grid grid-cols-3 gap-3 rounded-lg bg-white border border-gray-200 p-3">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Stok Saat Ini</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{selected.stock}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Harga</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{formatRp(selected.price)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Min Stok</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{selected.minStock}</p>
              </div>
            </div>
          )}

          {/* Jumlah & Tanggal — side by side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Jumlah */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Jumlah</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-900 hover:bg-gray-50 active:scale-90 transition-all shrink-0"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, +e.target.value))}
                  className="flex-1 min-w-0 rounded-xl text-center text-lg font-bold py-2.5 bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#072C2C]/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-900 hover:bg-gray-50 active:scale-90 transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {selected && type === 'out' && quantity > selected.stock && (
                <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Stok tidak cukup
                </p>
              )}
            </div>

            {/* Tanggal */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full rounded-xl text-sm px-4 py-3 font-medium bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#072C2C]/30 transition-all"
              />
            </div>
          </div>
          </div>
        </div>

        {/* === KETERANGAN === */}
        <div>
          <div className="rounded-t-xl px-6 py-4 bg-[#FF5F03]">
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-white" />
              <div>
                <p className="text-base font-bold text-white">Keterangan</p>
                <p className="text-xs text-white/80">Catatan transaksi (opsional)</p>
              </div>
            </div>
          </div>
          <div className="rounded-b-xl border border-t-0 border-gray-200 bg-white p-6 lg:p-8">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value.slice(0, 200))}
            maxLength={200}
            rows={3}
            className="w-full rounded-xl text-sm px-4 py-3.5 resize-none font-medium bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/30 transition-all placeholder:text-gray-400"
            placeholder="Tambahkan catatan transaksi..."
          />
          <p className="text-right text-[10px] mt-1.5 text-gray-400">{note.length}/200</p>
          </div>
        </div>

        {/* === SUBMIT BUTTONS === */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.push('/products')}
            className="px-6 py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-gray-300 transition flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Batal
          </button>
          <button
            type="submit"
            disabled={loading || !selectedProduct}
            className="px-8 py-3 rounded-lg bg-[#FF5F03] hover:bg-[#FF5F03]/90 text-white text-sm font-bold transition flex items-center gap-2 shadow-lg shadow-[#FF5F03]/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Catat Transaksi
              </>
            )}
          </button>
        </div>
      </form>

      {/* Custom keyframes */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}


// Bulk Entry Form Component
function BulkEntryForm({ products, router, toast }: { products: Product[]; router: any; toast: any }) {
  const [type, setType] = useState<TransactionType>('in')
  const [rows, setRows] = useState<{ id: string; productId: string; quantity: number; date: string; note: string; search: string; showDropdown: boolean }[]>(() => [
    { id: 'row-init', productId: '', quantity: 1, date: new Date().toISOString().split('T')[0], note: '', search: '', showDropdown: false }
  ])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const addRow = () => {
    setRows([...rows, { id: uid(), productId: '', quantity: 1, date: new Date().toISOString().split('T')[0], note: '', search: '', showDropdown: false }])
  }

  const removeRow = (index: number) => {
    if (rows.length <= 1) return
    setRows(rows.filter((_, i) => i !== index))
  }

  const updateRow = (index: number, fields: Record<string, any>) => {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, ...fields } : r))
  }

  const selectProduct = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    const updated = [...rows]
    updated[index].productId = productId
    updated[index].search = product.name
    updated[index].showDropdown = false
    setRows(updated)
  }

  const handleSubmit = async () => {
    const validRows = rows.filter(r => r.productId)
    if (validRows.length === 0) { toast('Pilih minimal 1 produk!', 'error'); return }

    for (const row of validRows) {
      const product = products.find(p => p.id === row.productId)
      if (!product) continue
      if (type === 'out' && product.stock < row.quantity) {
        toast(`Stok ${product.name} tidak cukup! Sisa: ${product.stock}`, 'error')
        return
      }
    }

    setLoading(true)
    await new Promise(r => setTimeout(r, 600))

    for (const row of validRows) {
      const product = products.find(p => p.id === row.productId)
      if (!product) continue
      const updatedProduct = { ...product, stock: type === 'in' ? product.stock + row.quantity : product.stock - row.quantity, updatedAt: new Date().toISOString() }
      const txDate = (() => { const now = new Date(); const [y, m, d] = row.date.split('-').map(Number); now.setFullYear(y, m - 1, d); return now.toISOString() })()
      const newTx: Transaction = { id: uid(), productId: product.id, productName: product.name, type, quantity: row.quantity, note: row.note, createdAt: txDate }
      await saveProduct(updatedProduct)
      await saveTransaction(newTx)
    }

    setSuccess(true)
    const totalQty = validRows.reduce((s, r) => s + r.quantity, 0)
    toast(`${totalQty} item dari ${validRows.length} produk berhasil dicatat`, 'success')
    setTimeout(() => router.push('/products'), 1200)
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4 animate-[fadeInUp_0.5s_ease-out]">
          <div className="w-20 h-20 rounded-full bg-[#16A34A]/10 flex items-center justify-center"><Sparkles className="w-10 h-10 text-[#16A34A]" /></div>
          <p className="text-xl font-bold text-gray-900">Transaksi Tersimpan!</p>
          <p className="text-sm text-gray-500">Mengalihkan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto pb-24 lg:pb-8">
      <button onClick={() => router.push('/products')} className="group flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 mb-6 transition-all active:scale-95">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Kembali
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF5F03]/10 flex items-center justify-center">
            <Layers className="w-5 h-5 text-[#FF5F03]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Bulk Entry</h1>
            <p className="text-xs text-gray-500">Catat banyak produk sekaligus</p>
          </div>
        </div>

        {/* Pill toggle tipe */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          <button type="button" onClick={() => setType('in')} className={`px-3 py-1.5 text-xs font-bold transition-all ${type === 'in' ? 'bg-[#16A34A] text-white' : 'bg-gray-100 text-gray-500'}`}>
            Masuk
          </button>
          <button type="button" onClick={() => setType('out')} className={`px-3 py-1.5 text-xs font-bold transition-all ${type === 'out' ? 'bg-[#DC2626] text-white' : 'bg-gray-100 text-gray-500'}`}>
            Keluar
          </button>
        </div>
      </div>

      {/* Item Transaksi Section */}
      <div className="rounded-xl bg-white border border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Item Transaksi</p>
          <button type="button" onClick={addRow} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF5F03] text-white text-[11px] font-bold active:scale-95 transition-all">
            <Plus className="w-3.5 h-3.5" />
            Tambah Baris
          </button>
        </div>

        {/* Table header - desktop */}
        <div className="hidden md:grid grid-cols-[40px_1fr_80px_120px_1fr_40px] gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
          <span className="text-[10px] font-bold text-gray-500 uppercase">#</span>
          <span className="text-[10px] font-bold text-gray-500 uppercase">Produk</span>
          <span className="text-[10px] font-bold text-gray-500 uppercase">Jumlah</span>
          <span className="text-[10px] font-bold text-gray-500 uppercase">Tanggal</span>
          <span className="text-[10px] font-bold text-gray-500 uppercase">Keterangan</span>
          <span className="text-[10px] font-bold text-gray-500 uppercase text-center">Aksi</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-200">
          {rows.map((row, index) => {
            const filteredForRow = products.filter(p =>
              p.name.toLowerCase().includes(row.search.toLowerCase()) ||
              p.sku.toLowerCase().includes(row.search.toLowerCase())
            )
            return (
              <div key={row.id} className="px-4 py-3">
                {/* Desktop: grid row */}
                <div className="hidden md:grid md:grid-cols-[40px_1fr_80px_120px_1fr_40px] md:gap-2 md:items-center">
                  <span className="text-xs text-gray-500 font-medium">{index + 1}</span>
                  <div className="relative">
                    <input
                      type="text"
                      value={row.search}
                      onChange={e => { updateRow(index, { search: e.target.value, showDropdown: true, productId: '' }) }}
                      onFocus={() => updateRow(index, { showDropdown: true })}
                      onBlur={() => setTimeout(() => updateRow(index, { showDropdown: false }), 250)}
                      className="w-full rounded-lg text-xs px-3 py-2.5 bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#072C2C]/30 placeholder:text-gray-400"
                      placeholder="Pilih produk..."
                    />
                    {row.showDropdown && !row.productId && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-lg bg-white border border-gray-200 max-h-36 overflow-y-auto shadow-xl">
                        {filteredForRow.length === 0 ? (
                          <p className="px-3 py-2 text-xs text-gray-500 text-center">Tidak ditemukan</p>
                        ) : filteredForRow.slice(0, 5).map(p => (
                          <button key={p.id} type="button" onMouseDown={() => selectProduct(index, p.id)}
                            className="w-full px-3 py-2 text-left hover:bg-[#FF5F03]/5 border-b border-gray-100 last:border-b-0">
                            <p className="text-xs text-gray-900">{p.name}</p>
                            <p className="text-[10px] text-gray-500">{p.sku} · Stok: {p.stock}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input type="number" min={1} value={row.quantity || ''}
                    onFocus={e => { if (row.quantity <= 1) e.target.value = '' }}
                    onChange={e => updateRow(index, { quantity: Math.max(0, +e.target.value) })}
                    onBlur={e => { if (!e.target.value || +e.target.value < 1) updateRow(index, { quantity: 1 }) }}
                    className="w-full rounded-lg text-xs text-center px-2 py-2.5 bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#072C2C]/30"
                  />
                  <input type="date" value={row.date} onChange={e => updateRow(index, { date: e.target.value })}
                    className="w-full rounded-lg text-xs px-2 py-2.5 bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#072C2C]/30"
                  />
                  <input type="text" value={row.note} onChange={e => updateRow(index, { note: e.target.value })}
                    className="w-full rounded-lg text-xs px-3 py-2.5 bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#072C2C]/30 placeholder:text-gray-400"
                    placeholder="Opsional"
                  />
                  <div className="flex justify-center">
                    <button type="button" onClick={() => removeRow(index)} disabled={rows.length <= 1}
                      className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-[#DC2626] disabled:opacity-30 active:scale-90 transition-all hover:bg-red-50">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Mobile: card layout */}
                <div className="md:hidden space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500">Item #{index + 1}</span>
                    <button type="button" onClick={() => removeRow(index)} disabled={rows.length <= 1}
                      className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-[#DC2626] disabled:opacity-30 active:scale-90 transition-all">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="relative">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Produk</label>
                    <input
                      type="text"
                      value={row.search}
                      onChange={e => { updateRow(index, { search: e.target.value, showDropdown: true, productId: '' }) }}
                      onFocus={() => updateRow(index, { showDropdown: true })}
                      onBlur={() => setTimeout(() => updateRow(index, { showDropdown: false }), 250)}
                      className="w-full rounded-lg text-sm px-3 py-2.5 bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#072C2C]/30 placeholder:text-gray-400"
                      placeholder="Cari produk..."
                    />
                    {row.showDropdown && !row.productId && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-lg bg-white border border-gray-200 max-h-36 overflow-y-auto shadow-xl">
                        {filteredForRow.length === 0 ? (
                          <p className="px-3 py-2 text-xs text-gray-500 text-center">Tidak ditemukan</p>
                        ) : filteredForRow.slice(0, 5).map(p => (
                          <button key={p.id} type="button" onMouseDown={() => selectProduct(index, p.id)}
                            className="w-full px-3 py-2 text-left hover:bg-[#FF5F03]/5 border-b border-gray-100 last:border-b-0">
                            <p className="text-xs text-gray-900">{p.name}</p>
                            <p className="text-[10px] text-gray-500">{p.sku} · Stok: {p.stock}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Jumlah</label>
                      <input type="number" min={1} value={row.quantity || ''}
                        onFocus={e => { if (row.quantity <= 1) e.target.value = '' }}
                        onChange={e => updateRow(index, { quantity: Math.max(0, +e.target.value) })}
                        onBlur={e => { if (!e.target.value || +e.target.value < 1) updateRow(index, { quantity: 1 }) }}
                        className="w-full rounded-lg text-sm text-center px-2 py-2.5 bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#072C2C]/30"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Tanggal</label>
                      <input type="date" value={row.date} onChange={e => updateRow(index, { date: e.target.value })}
                        className="w-full rounded-lg text-sm px-2 py-2.5 bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#072C2C]/30"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Keterangan</label>
                    <input type="text" value={row.note} onChange={e => updateRow(index, { note: e.target.value })}
                      className="w-full rounded-lg text-sm px-3 py-2.5 bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#072C2C]/30 placeholder:text-gray-400"
                      placeholder="Opsional"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 mt-6">
        <button type="button" onClick={() => router.push('/products')} className="px-5 py-3 rounded-xl text-sm font-bold bg-white border border-gray-200 text-gray-700 active:scale-95 transition-all">Batal</button>
        <button type="button" onClick={handleSubmit} disabled={loading || rows.filter(r => r.productId).length === 0} className="px-6 py-3 rounded-xl text-sm font-bold bg-[#FF5F03] text-white disabled:opacity-40 flex items-center gap-2 active:scale-[0.97] transition-all shadow-lg shadow-[#FF5F03]/20">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" />Catat {rows.filter(r => r.productId).length} Transaksi</>}
        </button>
      </div>

      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
