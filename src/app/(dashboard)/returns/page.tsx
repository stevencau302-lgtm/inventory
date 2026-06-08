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
  RotateCcw, Search, X, Loader2, Undo2, AlertCircle,
  CheckCircle2, XCircle, AlertTriangle, MessageSquare, BarChart3,
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
  const { toast } = useToast()
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
              href="/reports"
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
