'use client'

import { useEffect, useState, useCallback } from 'react'
import { Product, fetchProducts, saveProduct, uid, formatRp } from '@/lib/store'
import { useToast } from '@/components/Toast'
import { CardListSkeleton } from '@/components/PageSkeleton'
import {
  ClipboardCheck, Search, Package, CheckCircle2,
  AlertTriangle, Save, Loader2, RotateCcw, Download,
  Trash2
} from 'lucide-react'

interface OpnameProgress {
  [productId: string]: {
    actualStock: number | null
    note: string
    checked: boolean
  }
}

interface OpnameItem {
  product: Product
  systemStock: number
  actualStock: number | null
  difference: number
  note: string
  checked: boolean
}

type FilterStatus = 'all' | 'unchecked' | 'match' | 'mismatch'

const STORAGE_KEY = 'nexo_opname_progress'
const DATE_KEY = 'nexo_opname_date'

function loadProgress(): OpnameProgress {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch { return {} }
}

function saveProgress(progress: OpnameProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

function clearProgress() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(DATE_KEY)
}

function loadDate(): string {
  if (typeof window === 'undefined') return new Date().toISOString().split('T')[0]
  return localStorage.getItem(DATE_KEY) || new Date().toISOString().split('T')[0]
}

function saveDate(date: string) {
  localStorage.setItem(DATE_KEY, date)
}

export default function StockOpnamePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [items, setItems] = useState<OpnameItem[]>([])
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [saving, setSaving] = useState(false)
  const [opnameDate, setOpnameDate] = useState('')
  const [savedSummary, setSavedSummary] = useState<{
    date: string
    totalChecked: number
    matchCount: number
    mismatchCount: number
    mismatchItems: { name: string; sku: string; systemStock: number; actualStock: number; difference: number }[]
  } | null>(null)
  const { toast } = useToast()

  // Load data + restore progress from localStorage
  useEffect(() => {
    async function loadData() {
      const p = await fetchProducts()
      setProducts(p)

      const savedProgress = loadProgress()
      const savedDate = loadDate()
      setOpnameDate(savedDate)

      setItems(p.map(product => {
        const saved = savedProgress[product.id]
        if (saved) {
          const actual = saved.actualStock
          return {
            product,
            systemStock: product.stock,
            actualStock: actual,
            difference: actual !== null ? actual - product.stock : 0,
            note: saved.note || '',
            checked: saved.checked,
          }
        }
        return {
          product,
          systemStock: product.stock,
          actualStock: null,
          difference: 0,
          note: '',
          checked: false,
        }
      }))
      setMounted(true)
    }
    loadData()
  }, [])

  // Auto-save progress to localStorage whenever items change
  const persistProgress = useCallback((updatedItems: OpnameItem[]) => {
    const progress: OpnameProgress = {}
    updatedItems.forEach(item => {
      if (item.checked || item.actualStock !== null || item.note) {
        progress[item.product.id] = {
          actualStock: item.actualStock,
          note: item.note,
          checked: item.checked,
        }
      }
    })
    saveProgress(progress)
  }, [])

  if (!mounted) return <CardListSkeleton />

  const updateItem = (productId: string, field: 'actualStock' | 'note', value: any) => {
    setItems(prev => {
      const updated = prev.map(item => {
        if (item.product.id !== productId) return item
        const newItem = { ...item, [field]: value }
        if (field === 'actualStock') {
          const actual = value === null || value === '' ? null : Number(value)
          newItem.actualStock = actual
          newItem.difference = actual !== null ? actual - item.systemStock : 0
          newItem.checked = actual !== null
        }
        return newItem
      })
      persistProgress(updated)
      return updated
    })
  }

  const markAsMatch = (productId: string) => {
    setItems(prev => {
      const updated = prev.map(item => {
        if (item.product.id !== productId) return item
        return { ...item, actualStock: item.systemStock, difference: 0, checked: true }
      })
      persistProgress(updated)
      return updated
    })
  }

  const resetItem = (productId: string) => {
    setItems(prev => {
      const updated = prev.map(item => {
        if (item.product.id !== productId) return item
        return { ...item, actualStock: null, difference: 0, note: '', checked: false }
      })
      persistProgress(updated)
      return updated
    })
  }

  const handleResetAll = () => {
    if (!confirm('Reset semua progress opname? Data yang belum disimpan akan hilang.')) return
    clearProgress()
    setItems(prev => prev.map(item => ({
      ...item,
      actualStock: null,
      difference: 0,
      note: '',
      checked: false,
    })))
    toast('Progress opname direset!', 'warning')
  }

  const handleDateChange = (date: string) => {
    setOpnameDate(date)
    saveDate(date)
  }

  const handleSaveOpname = async () => {
    const checkedItems = items.filter(i => i.checked)
    if (checkedItems.length === 0) {
      toast('Belum ada produk yang diperiksa!', 'error')
      return
    }

    const mismatchItems = checkedItems.filter(i => i.difference !== 0)

    setSaving(true)
    try {
      // Update stock for mismatched items
      for (const item of mismatchItems) {
        if (item.actualStock !== null) {
          const updatedProduct: Product = {
            ...item.product,
            stock: item.actualStock,
            updatedAt: new Date().toISOString(),
          }
          await saveProduct(updatedProduct)
        }
      }

      // Clear localStorage progress after successful save
      clearProgress()

      // Show summary instead of resetting view
      setSavedSummary({
        date: opnameDate,
        totalChecked: checkedItems.length,
        matchCount: checkedItems.filter(i => i.difference === 0).length,
        mismatchCount: mismatchItems.length,
        mismatchItems: mismatchItems.map(i => ({
          name: i.product.name,
          sku: i.product.sku,
          systemStock: i.systemStock,
          actualStock: i.actualStock!,
          difference: i.difference,
        })),
      })

      toast(
        mismatchItems.length > 0
          ? `Stok opname selesai! ${mismatchItems.length} produk diperbarui.`
          : `Stok opname selesai! Semua stok sesuai.`,
        'success'
      )
    } catch (err) {
      console.error('Save opname error:', err)
      toast('Gagal menyimpan stok opname!', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleExportCSV = () => {
    const checkedItems = items.filter(i => i.checked)
    if (checkedItems.length === 0) {
      toast('Belum ada data untuk di-export!', 'error')
      return
    }

    const headers = ['SKU', 'Nama Produk', 'Kategori', 'Stok Sistem', 'Stok Aktual', 'Selisih', 'Catatan']
    const rows = checkedItems.map(i => [
      i.product.sku,
      i.product.name,
      i.product.category,
      i.systemStock,
      i.actualStock ?? '',
      i.difference,
      i.note,
    ])

    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stok-opname-${opnameDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast('CSV berhasil di-export!', 'success')
  }

  const handleStartNewOpname = async () => {
    setSavedSummary(null)
    const p = await fetchProducts()
    setProducts(p)
    setItems(p.map(product => ({
      product,
      systemStock: product.stock,
      actualStock: null,
      difference: 0,
      note: '',
      checked: false,
    })))
  }

  // If we just saved, show summary
  if (savedSummary) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-[#1a1a1a] border border-[#16A34A]/30 p-6 lg:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#16A34A]/15 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-[#16A34A]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#fafafa]">Opname Selesai!</h1>
              <p className="text-zinc-500 text-sm mt-0.5">Tanggal: {savedSummary.date}</p>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl p-4 bg-[#0f0f0f] border border-white/[0.06] text-center">
              <p className="text-2xl font-bold text-[#fafafa]">{savedSummary.totalChecked}</p>
              <p className="text-[11px] text-zinc-500 mt-1">Diperiksa</p>
            </div>
            <div className="rounded-xl p-4 bg-[#0f0f0f] border border-white/[0.06] text-center">
              <p className="text-2xl font-bold text-[#16A34A]">{savedSummary.matchCount}</p>
              <p className="text-[11px] text-zinc-500 mt-1">Sesuai</p>
            </div>
            <div className="rounded-xl p-4 bg-[#0f0f0f] border border-white/[0.06] text-center">
              <p className="text-2xl font-bold text-[#DC2626]">{savedSummary.mismatchCount}</p>
              <p className="text-[11px] text-zinc-500 mt-1">Selisih (diperbarui)</p>
            </div>
          </div>

          {/* Mismatch details */}
          {savedSummary.mismatchItems.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">Produk yang stoknya diperbarui:</h3>
              <div className="space-y-2">
                {savedSummary.mismatchItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#0f0f0f] border border-white/[0.06]">
                    <div>
                      <p className="text-sm font-medium text-[#fafafa]">{item.name}</p>
                      <p className="text-[11px] text-zinc-500">{item.sku}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500">{item.systemStock} → {item.actualStock}</span>
                      <span className={`text-sm font-bold px-2 py-0.5 rounded ${item.difference > 0 ? 'text-[#16A34A] bg-[#16A34A]/10' : 'text-[#DC2626] bg-[#DC2626]/10'}`}>
                        {item.difference > 0 ? `+${item.difference}` : item.difference}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {savedSummary.mismatchItems.length === 0 && (
            <div className="mb-6 text-center py-6">
              <p className="text-sm text-zinc-400">✅ Semua stok sesuai! Tidak ada perubahan.</p>
            </div>
          )}

          <button
            onClick={handleStartNewOpname}
            className="w-full py-3 rounded-xl bg-[#FDC800] hover:bg-[#FDC800]/90 text-[#1a1a1a] text-sm font-bold transition flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <ClipboardCheck className="w-4 h-4" />
            Mulai Opname Baru
          </button>
        </div>
      </div>
    )
  }

  // Filter & search
  const filtered = items.filter(item => {
    const matchSearch = !search ||
      item.product.name.toLowerCase().includes(search.toLowerCase()) ||
      item.product.sku.toLowerCase().includes(search.toLowerCase())

    let matchFilter = true
    if (filterStatus === 'unchecked') matchFilter = !item.checked
    if (filterStatus === 'match') matchFilter = item.checked && item.difference === 0
    if (filterStatus === 'mismatch') matchFilter = item.checked && item.difference !== 0

    return matchSearch && matchFilter
  })

  // Stats
  const totalProducts = items.length
  const checkedCount = items.filter(i => i.checked).length
  const matchCount = items.filter(i => i.checked && i.difference === 0).length
  const mismatchCount = items.filter(i => i.checked && i.difference !== 0).length
  const progress = totalProducts > 0 ? Math.round((checkedCount / totalProducts) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FDC800]/10 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-6 h-6 text-[#FDC800]" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#fafafa]">Stok Opname</h1>
              <p className="text-zinc-500 text-sm mt-0.5">Verifikasi stok fisik dengan data sistem</p>
              {checkedCount > 0 && (
                <p className="text-[11px] text-[#FDC800] mt-1 font-medium">💾 Progress otomatis tersimpan</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={opnameDate}
              onChange={e => handleDateChange(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#0f0f0f] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#FDC800]/50 transition"
            />
            <button onClick={handleResetAll} className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/[0.08] text-sm font-medium text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition flex items-center gap-1.5" title="Reset semua progress">
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button onClick={handleExportCSV} className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/[0.08] text-sm font-medium text-zinc-400 hover:text-white hover:border-white/[0.15] transition flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={handleSaveOpname}
              disabled={saving || checkedCount === 0}
              className="px-4 py-2 rounded-lg bg-[#FDC800] hover:bg-[#FDC800]/90 text-[#1a1a1a] text-sm font-bold transition flex items-center gap-2 shadow-lg shadow-[#FDC800]/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Opname
            </button>
          </div>
        </div>
      </div>

      {/* Progress & Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl p-4 bg-[#1a1a1a] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-[#FDC800]/15 flex items-center justify-center">
              <Package className="w-3.5 h-3.5 text-[#FDC800]" />
            </div>
            <p className="text-[11px] text-zinc-500 font-medium">Total Produk</p>
          </div>
          <p className="text-2xl font-bold text-[#fafafa]">{totalProducts}</p>
        </div>
        <div className="rounded-xl p-4 bg-[#1a1a1a] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-[#818cf8]/15 flex items-center justify-center">
              <ClipboardCheck className="w-3.5 h-3.5 text-[#818cf8]" />
            </div>
            <p className="text-[11px] text-zinc-500 font-medium">Diperiksa</p>
          </div>
          <p className="text-2xl font-bold text-[#fafafa]">{checkedCount} <span className="text-xs font-medium text-zinc-500">/ {totalProducts}</span></p>
        </div>
        <div className="rounded-xl p-4 bg-[#1a1a1a] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-[#16A34A]/15 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
            </div>
            <p className="text-[11px] text-zinc-500 font-medium">Sesuai</p>
          </div>
          <p className="text-2xl font-bold text-[#16A34A]">{matchCount}</p>
        </div>
        <div className="rounded-xl p-4 bg-[#1a1a1a] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-[#DC2626]/15 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
            </div>
            <p className="text-[11px] text-zinc-500 font-medium">Selisih</p>
          </div>
          <p className="text-2xl font-bold text-[#DC2626]">{mismatchCount}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="rounded-xl p-4 bg-[#1a1a1a] border border-white/[0.06]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-zinc-400 font-medium">Progress Opname</p>
          <p className="text-xs font-bold text-[#FDC800]">{progress}%</p>
        </div>
        <div className="h-2 rounded-full bg-[#0f0f0f] overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[#FDC800] to-[#f59e0b] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Cari produk / SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0f0f0f] border border-white/[0.08] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FDC800]/50 transition"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as FilterStatus)}
          className="px-4 py-2.5 rounded-lg bg-[#0f0f0f] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#FDC800]/50 transition appearance-none cursor-pointer"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '40px' }}
        >
          <option value="all">Semua Status</option>
          <option value="unchecked">Belum Diperiksa</option>
          <option value="match">Stok Sesuai</option>
          <option value="mismatch">Ada Selisih</option>
        </select>
      </div>

      {/* Product List */}
      <div className="space-y-2.5">
        {filtered.map(item => (
          <div
            key={item.product.id}
            className={`rounded-xl p-4 border transition-all ${
              item.checked
                ? item.difference === 0
                  ? 'bg-[#16A34A]/[0.04] border-[#16A34A]/20'
                  : 'bg-[#DC2626]/[0.04] border-[#DC2626]/20'
                : 'bg-[#1a1a1a] border-white/[0.06]'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Product info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FDC800]/20 to-[#FDC800]/5 border border-[#FDC800]/20 flex items-center justify-center text-[11px] font-bold text-[#FDC800] shrink-0">
                  {item.product.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#fafafa] truncate">{item.product.name}</p>
                  <p className="text-[11px] text-zinc-500">{item.product.sku} · {item.product.category}</p>
                </div>
              </div>

              {/* Stock inputs */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* System stock */}
                <div className="text-center">
                  <p className="text-[10px] text-zinc-500 uppercase mb-1">Sistem</p>
                  <p className="text-sm font-bold text-zinc-300 bg-[#0f0f0f] rounded-lg px-3 py-1.5 border border-white/[0.06] min-w-[60px]">
                    {item.systemStock}
                  </p>
                </div>

                {/* Actual stock input */}
                <div className="text-center">
                  <p className="text-[10px] text-zinc-500 uppercase mb-1">Aktual</p>
                  <input
                    type="number"
                    min={0}
                    value={item.actualStock ?? ''}
                    onChange={e => updateItem(item.product.id, 'actualStock', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="—"
                    className="w-[70px] text-center text-sm font-bold rounded-lg px-2 py-1.5 bg-[#0f0f0f] border border-white/[0.12] text-white placeholder-zinc-600 focus:outline-none focus:border-[#FDC800]/50 transition"
                  />
                </div>

                {/* Difference */}
                <div className="text-center min-w-[50px]">
                  <p className="text-[10px] text-zinc-500 uppercase mb-1">Selisih</p>
                  <p className={`text-sm font-bold px-2 py-1.5 rounded-lg ${
                    !item.checked ? 'text-zinc-600' :
                    item.difference === 0 ? 'text-[#16A34A] bg-[#16A34A]/10' :
                    item.difference > 0 ? 'text-[#16A34A] bg-[#16A34A]/10' :
                    'text-[#DC2626] bg-[#DC2626]/10'
                  }`}>
                    {item.checked ? (item.difference > 0 ? `+${item.difference}` : item.difference) : '—'}
                  </p>
                </div>

                {/* Quick actions */}
                <div className="flex gap-1.5 ml-1">
                  <button
                    onClick={() => markAsMatch(item.product.id)}
                    title="Tandai sesuai"
                    className="w-8 h-8 rounded-lg bg-[#16A34A]/10 text-[#16A34A] hover:bg-[#16A34A] hover:text-white flex items-center justify-center transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                  {item.checked && (
                    <button
                      onClick={() => resetItem(item.product.id)}
                      title="Reset"
                      className="w-8 h-8 rounded-lg bg-zinc-700/30 text-zinc-400 hover:bg-zinc-600 hover:text-white flex items-center justify-center transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Note (show if mismatch) */}
            {item.checked && item.difference !== 0 && (
              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                <input
                  type="text"
                  value={item.note}
                  onChange={e => updateItem(item.product.id, 'note', e.target.value)}
                  placeholder="Catatan selisih (opsional)..."
                  className="w-full px-3 py-2 rounded-lg bg-[#0f0f0f] border border-white/[0.08] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FDC800]/50 transition"
                />
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FDC800]/10 border border-[#FDC800]/20 flex items-center justify-center mb-4">
              <ClipboardCheck className="w-8 h-8 text-[#FDC800]" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-200 mb-1">Tidak ada produk</h3>
            <p className="text-sm text-zinc-500 text-center max-w-xs">Tidak ada produk yang sesuai dengan filter pencarian.</p>
          </div>
        )}
      </div>
    </div>
  )
}
