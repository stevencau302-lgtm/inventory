'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Product, Transaction, formatRp, uid,
  fetchProducts, fetchTransactions, saveProduct, saveTransaction,
} from '@/lib/store'
import { useToast } from '@/components/Toast'
import { CardListSkeleton } from '@/components/PageSkeleton'
import {
  RotateCcw, Search, X, Loader2, Undo2,
  CheckCircle2, XCircle, AlertTriangle, MessageSquare, BarChart3,
  Minus, Plus, Save, FileText,
} from 'lucide-react'

type Reason = 'wrong_product' | 'defective' | 'not_match' | 'other'

const reasons: { value: Reason; label: string; icon: React.ReactNode }[] = [
  { value: 'wrong_product', label: 'Salah Produk', icon: <RotateCcw className="w-3.5 h-3.5" /> },
  { value: 'defective', label: 'Produk Cacat', icon: <XCircle className="w-3.5 h-3.5" /> },
  { value: 'not_match', label: 'Tidak Sesuai', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  { value: 'other', label: 'Lainnya', icon: <MessageSquare className="w-3.5 h-3.5" /> },
]

function isReturn(t: Transaction) {
  return t.note?.toUpperCase().startsWith('[RETURN]')
}

export default function ReturnsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  async function loadData() {
    const [p, tx] = await Promise.all([fetchProducts(), fetchTransactions()])
    setProducts(p)
    setTransactions(tx)
  }

  useEffect(() => {
    loadData().then(() => setMounted(true))
  }, [])

  const returns = useMemo(
    () => transactions.filter(isReturn).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [transactions]
  )

  const priceOf = (productId: string) => products.find(p => p.id === productId)?.price ?? 0

  const stats = useMemo(() => {
    const totalCount = returns.length
    const totalValue = returns.reduce((sum, t) => sum + priceOf(t.productId) * t.quantity, 0)
    // Hanya retur kondisi bagus (type 'in') yang dikembalikan ke stok
    const totalItems = returns.filter(t => t.type === 'in').reduce((sum, t) => sum + t.quantity, 0)
    return { totalCount, totalValue, totalItems }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returns, products])

  const filteredReturns = useMemo(() => {
    const q = search.toLowerCase()
    return returns.filter(t =>
      t.productName?.toLowerCase().includes(q) ||
      t.note?.toLowerCase().includes(q)
    )
  }, [returns, search])

  if (!mounted) return <CardListSkeleton />

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#D97706] to-[#B45309] p-6 lg:p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -ml-10 -mb-10" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/10 shrink-0">
              <RotateCcw className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Manajemen Retur</h1>
              <p className="text-amber-50/90 text-sm mt-0.5">Kelola pengembalian barang dan stok</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/returns/analytics"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm font-bold hover:bg-white/20 transition active:scale-95"
            >
              <BarChart3 className="w-4 h-4" />
              Analisa
            </Link>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-[#B45309] text-sm font-bold shadow-lg hover:bg-amber-50 transition active:scale-95"
            >
              <Undo2 className="w-4 h-4" />
              Tambah Retur
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-50/80 mb-1.5">Total Kasus Retur</p>
            <p className="text-2xl font-bold">{stats.totalCount}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-50/80 mb-1.5">Nilai Pengembalian</p>
            <p className="text-2xl font-bold">{formatRp(stats.totalValue)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-50/80 mb-1.5">Dikembalikan ke Stok</p>
            <p className="text-2xl font-bold">{stats.totalItems} <span className="text-sm font-medium opacity-70">unit</span></p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900">Riwayat Retur</h2>
        <div className="relative w-full max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari produk atau catatan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#D97706]/50 focus:ring-2 focus:ring-[#D97706]/15 transition"
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-xl overflow-hidden bg-white border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border-b border-gray-200 px-4 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wide">Tanggal</th>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wide">Produk</th>
                <th className="border-b border-gray-200 w-[90px] px-4 py-3 text-center text-[11px] font-bold text-gray-900 uppercase tracking-wide">Qty</th>
                <th className="border-b border-gray-200 w-[110px] px-4 py-3 text-center text-[11px] font-bold text-gray-900 uppercase tracking-wide">Kondisi</th>
                <th className="border-b border-gray-200 w-[140px] px-4 py-3 text-right text-[11px] font-bold text-gray-900 uppercase tracking-wide">Nilai</th>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-[11px] font-bold text-gray-900 uppercase tracking-wide">Alasan / Catatan</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-0">
                    <EmptyState onAdd={() => setShowAddModal(true)} />
                  </td>
                </tr>
              ) : (
                filteredReturns.map((item, idx) => (
                  <tr key={item.id} className={`hover:bg-gray-50 transition ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                    <td className="border-b border-gray-100 px-4 py-3 text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="border-b border-gray-100 px-4 py-3 text-sm font-medium text-gray-900">{item.productName}</td>
                    <td className="border-b border-gray-100 px-4 py-3 text-center text-sm font-bold text-gray-900">{item.quantity}</td>
                    <td className="border-b border-gray-100 px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold whitespace-nowrap ${item.type === 'in' ? 'bg-[#16A34A]/15 text-[#16A34A]' : 'bg-[#DC2626]/15 text-[#DC2626]'}`}>
                        {item.type === 'in' ? 'BAGUS' : 'RUSAK'}
                      </span>
                    </td>
                    <td className="border-b border-gray-100 px-4 py-3 text-right text-sm font-bold text-[#D97706]">
                      {formatRp(priceOf(item.productId) * item.quantity)}
                    </td>
                    <td className="border-b border-gray-100 px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{parseReason(item.note)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-2.5">
        {filteredReturns.length === 0 ? (
          <EmptyState onAdd={() => setShowAddModal(true)} />
        ) : (
          filteredReturns.map(item => (
            <div key={item.id} className="rounded-xl bg-white border border-gray-200 px-3.5 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">{item.productName}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${item.type === 'in' ? 'bg-[#16A34A]/10 text-[#16A34A]' : 'bg-[#DC2626]/10 text-[#DC2626]'}`}>
                  {item.type === 'in' ? 'BAGUS' : 'RUSAK'}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[11px] text-gray-500 truncate pr-2">{parseReason(item.note)}</p>
                <p className="text-sm font-bold text-[#D97706] shrink-0">
                  {item.quantity}x · {formatRp(priceOf(item.productId) * item.quantity)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <AddReturnModal
          products={products}
          onClose={() => setShowAddModal(false)}
          onDone={async () => { setShowAddModal(false); await loadData() }}
        />
      )}
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-[#D97706]/10 border border-[#D97706]/20 flex items-center justify-center mb-4">
        <RotateCcw className="w-8 h-8 text-[#D97706]" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">Belum ada data retur</h3>
      <p className="text-sm text-gray-500 text-center max-w-xs mb-5">Catat pengembalian barang dari customer untuk mulai melacak retur.</p>
      <button
        onClick={onAdd}
        className="px-5 py-2.5 rounded-lg bg-[#D97706] text-white text-sm font-bold shadow-lg shadow-[#D97706]/20 hover:bg-[#B45309] transition active:scale-95"
      >
        Tambah Retur Pertama
      </button>
    </div>
  )
}

function parseReason(note: string): string {
  // Format: [RETURN] Kondisi: X | Alasan: Y | <catatan>
  const cleaned = note?.replace(/^\[RETURN\]\s*/i, '').trim()
  return cleaned || '-'
}

type Condition = 'good' | 'damaged'

function AddReturnModal({
  products,
  onClose,
  onDone,
}: {
  products: Product[]
  onClose: () => void
  onDone: () => void | Promise<void>
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [condition, setCondition] = useState<Condition>('good')
  const [reason, setReason] = useState<Reason>('wrong_product')
  const [note, setNote] = useState('')

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  )
  const selected = products.find(p => p.id === selectedProduct)

  const handleSelectProduct = (id: string) => {
    setSelectedProduct(id)
    const p = products.find(pr => pr.id === id)
    if (p) setProductSearch(p.name)
    setShowDropdown(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) { toast('Pilih produk terlebih dahulu!', 'error'); return }
    const product = products.find(p => p.id === selectedProduct)
    if (!product) { toast('Produk tidak ditemukan', 'error'); return }

    setLoading(true)
    try {
      if (condition === 'good') {
        await saveProduct({
          ...product,
          stock: product.stock + quantity,
          updatedAt: new Date().toISOString(),
        })
      }

      const reasonLabel = reasons.find(r => r.value === reason)?.label || reason
      const conditionLabel = condition === 'good' ? 'Bagus' : 'Rusak'
      const txNote = `[RETURN] Kondisi: ${conditionLabel} | Alasan: ${reasonLabel}${note ? ` | ${note}` : ''}`

      const newTx: Transaction = {
        id: uid(),
        productId: product.id,
        productName: product.name,
        type: condition === 'good' ? 'in' : 'out',
        quantity,
        note: txNote,
        createdAt: new Date().toISOString(),
      }
      await saveTransaction(newTx)

      toast('Retur berhasil dicatat!', 'success')
      await onDone()
    } catch {
      toast('Gagal menyimpan retur', 'error')
      setLoading(false)
    }
  }

  const stockAfter = selected ? (condition === 'good' ? selected.stock + quantity : selected.stock) : 0

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4 animate-[returnFade_0.2s_ease-out]"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/30 max-h-[94vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-[returnSheet_0.32s_cubic-bezier(0.16,1,0.3,1)]">
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-gray-300" />
        </div>

        {/* Header with gradient accent */}
        <div className="relative shrink-0 px-5 pt-4 pb-4 border-b border-gray-100 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#D97706]/8 via-transparent to-transparent" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#D97706] to-[#B45309] flex items-center justify-center shadow-lg shadow-[#D97706]/25 shrink-0">
                <RotateCcw className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-gray-900 truncate">Tambah Retur</h2>
                <p className="text-[11px] text-gray-500 truncate">Catat barang kembali dari customer</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition active:scale-90 shrink-0"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <form id="return-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Pilih produk */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Produk yang Dikembalikan</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={productSearch}
                onChange={e => { setProductSearch(e.target.value); setShowDropdown(true); setSelectedProduct('') }}
                onFocus={() => setShowDropdown(true)}
                className="w-full rounded-2xl text-sm pl-10 pr-9 py-3.5 font-medium bg-gray-50 text-gray-900 border border-gray-200 focus:outline-none focus:bg-white focus:border-[#D97706]/50 focus:ring-2 focus:ring-[#D97706]/15 transition placeholder:text-gray-400"
                placeholder="Cari produk..."
                autoComplete="off"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={() => { setProductSearch(''); setSelectedProduct(''); setShowDropdown(true) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {showDropdown && !selected && (
                <div className="absolute z-50 left-0 right-0 top-full mt-2 rounded-2xl bg-white border border-gray-200 max-h-56 overflow-y-auto shadow-xl shadow-black/10 animate-[returnFade_0.15s_ease-out]">
                  {filteredProducts.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-500">Produk tidak ditemukan</div>
                  ) : filteredProducts.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProduct(p.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition hover:bg-[#D97706]/5 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D97706]/15 to-[#B45309]/10 flex items-center justify-center text-[10px] font-black text-[#D97706] shrink-0">
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

            {/* Selected product preview */}
            {selected && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#D97706]/[0.06] border border-[#D97706]/15 animate-[returnFade_0.2s_ease-out]">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#D97706] to-[#B45309] flex items-center justify-center text-xs font-black text-white shrink-0">
                  {selected.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{selected.name}</p>
                  <p className="text-[11px] text-gray-500">{selected.sku} · Stok: <span className="font-semibold text-gray-700">{selected.stock}</span></p>
                </div>
                <span className="text-xs font-bold text-[#D97706] shrink-0">{formatRp(selected.price)}</span>
              </div>
            )}
          </div>

          {selected && (
            <div className="space-y-5 animate-[returnFade_0.25s_ease-out]">
              {/* Quantity */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">Jumlah Retur</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 active:scale-90 transition shrink-0">
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, +e.target.value))}
                    className="flex-1 min-w-0 rounded-2xl text-center text-lg font-bold py-3 bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#D97706]/20 transition"
                  />
                  <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 active:scale-90 transition shrink-0">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Kondisi */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">Kondisi Barang</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCondition('good')}
                    className={`relative p-4 rounded-2xl text-left transition active:scale-[0.97] ${condition === 'good' ? 'bg-[#16A34A]/10 border-2 border-[#16A34A]/50 ring-2 ring-[#16A34A]/10' : 'bg-gray-50 border border-gray-200 hover:border-[#16A34A]/30'}`}
                  >
                    <CheckCircle2 className={`w-5 h-5 mb-2 ${condition === 'good' ? 'text-[#16A34A]' : 'text-gray-400'}`} />
                    <p className={`text-sm font-bold ${condition === 'good' ? 'text-[#16A34A]' : 'text-gray-700'}`}>Bagus</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Stok bertambah +{quantity}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCondition('damaged')}
                    className={`relative p-4 rounded-2xl text-left transition active:scale-[0.97] ${condition === 'damaged' ? 'bg-[#DC2626]/10 border-2 border-[#DC2626]/50 ring-2 ring-[#DC2626]/10' : 'bg-gray-50 border border-gray-200 hover:border-[#DC2626]/30'}`}
                  >
                    <XCircle className={`w-5 h-5 mb-2 ${condition === 'damaged' ? 'text-[#DC2626]' : 'text-gray-400'}`} />
                    <p className={`text-sm font-bold ${condition === 'damaged' ? 'text-[#DC2626]' : 'text-gray-700'}`}>Rusak</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Stok tidak berubah</p>
                  </button>
                </div>
              </div>

              {/* Alasan */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">Alasan Retur</label>
                <div className="grid grid-cols-2 gap-2">
                  {reasons.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setReason(r.value)}
                      className={`flex items-center gap-2 px-3.5 py-3 rounded-2xl text-xs font-semibold transition active:scale-[0.97] ${reason === r.value ? 'bg-[#D97706]/10 border border-[#D97706]/40 text-[#D97706]' : 'bg-gray-50 border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                      {r.icon}
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#D97706]" />
                  Catatan <span className="normal-case font-normal text-gray-400">(opsional)</span>
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value.slice(0, 200))}
                  maxLength={200}
                  rows={2}
                  className="w-full rounded-2xl text-sm px-4 py-3 resize-none font-medium bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#D97706]/20 transition placeholder:text-gray-400"
                  placeholder="Catatan tambahan..."
                />
                <p className="text-right text-[10px] mt-1 text-gray-400">{note.length}/200</p>
              </div>
            </div>
          )}
        </form>

        {/* Sticky footer */}
        <div className="shrink-0 border-t border-gray-100 bg-white px-5 py-4 space-y-3">
          {selected && (
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Stok setelah retur</span>
              <div className="flex items-center gap-2 text-sm font-bold">
                <span className="text-gray-400">{selected.stock}</span>
                <span className="text-[#D97706]">→</span>
                <span className={stockAfter > selected.stock ? 'text-[#16A34A]' : 'text-gray-900'}>{stockAfter}</span>
                {stockAfter > selected.stock && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#16A34A]/10 text-[#16A34A]">+{quantity}</span>
                )}
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-3.5 rounded-2xl text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition active:scale-95"
            >
              Batal
            </button>
            <button
              type="submit"
              form="return-form"
              disabled={loading || !selectedProduct}
              className="flex-1 px-6 py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-[#D97706] to-[#B45309] text-white hover:shadow-lg hover:shadow-[#D97706]/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 transition active:scale-[0.97]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Catat Retur</>}
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes returnFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes returnSheet {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
