'use client'

import { useEffect, useState, useCallback } from 'react'
import { Product, fetchProducts, saveProduct, formatRp } from '@/lib/store'
import { useToast } from '@/components/Toast'
import { CardListSkeleton } from '@/components/PageSkeleton'
import {
  ClipboardCheck, Search, Package, CheckCircle2,
  AlertTriangle, Save, Loader2, RotateCcw, Download,
  Trash2, Equal, ArrowDown, ArrowUp
} from 'lucide-react'

interface OpnameProgress {
  [productId: string]: {
    actualStock: number | null
    note: string
  }
}

interface OpnameItem {
  product: Product
  systemStock: number
  actualStock: number | null
  difference: number
  note: string
}

type FilterStatus = 'all' | 'unchecked' | 'match' | 'mismatch'

const STORAGE_KEY = 'nexo_opname_progress'
const DATE_KEY = 'nexo_opname_date'

function loadProgress(): OpnameProgress {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}
function saveProgressToStorage(progress: OpnameProgress) { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)) }
function clearProgress() { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(DATE_KEY) }
function loadDate(): string { if (typeof window === 'undefined') return new Date().toISOString().split('T')[0]; return localStorage.getItem(DATE_KEY) || new Date().toISOString().split('T')[0] }
function saveDate(date: string) { localStorage.setItem(DATE_KEY, date) }

export default function StockOpnamePage() {
  const [items, setItems] = useState<OpnameItem[]>([])
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [saving, setSaving] = useState(false)
  const [opnameDate, setOpnameDate] = useState('')
  const [savedSummary, setSavedSummary] = useState<{
    date: string; totalChecked: number; matchCount: number; mismatchCount: number
    mismatchItems: { name: string; sku: string; from: number; to: number; diff: number }[]
  } | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function loadData() {
      const products = await fetchProducts()
      const saved = loadProgress()
      setOpnameDate(loadDate())
      setItems(products.map(p => {
        const s = saved[p.id]
        const actual = s?.actualStock ?? null
        return {
          product: p,
          systemStock: p.stock,
          actualStock: actual,
          difference: actual !== null ? actual - p.stock : 0,
          note: s?.note || '',
        }
      }))
      setMounted(true)
    }
    loadData()
  }, [])

  const persist = useCallback((updated: OpnameItem[]) => {
    const progress: OpnameProgress = {}
    updated.forEach(item => {
      if (item.actualStock !== null || item.note) {
        progress[item.product.id] = { actualStock: item.actualStock, note: item.note }
      }
    })
    saveProgressToStorage(progress)
  }, [])

  if (!mounted) return <CardListSkeleton />

  const setActual = (productId: string, value: string) => {
    setItems(prev => {
      const updated = prev.map(item => {
        if (item.product.id !== productId) return item
        const actual = value === '' ? null : Number(value)
        return { ...item, actualStock: actual, difference: actual !== null ? actual - item.systemStock : 0 }
      })
      persist(updated)
      return updated
    })
  }

  const setNote = (productId: string, note: string) => {
    setItems(prev => {
      const updated = prev.map(item => item.product.id === productId ? { ...item, note } : item)
      persist(updated)
      return updated
    })
  }

  const quickMatch = (productId: string) => {
    setItems(prev => {
      const updated = prev.map(item => {
        if (item.product.id !== productId) return item
        return { ...item, actualStock: item.systemStock, difference: 0 }
      })
      persist(updated)
      return updated
    })
  }

  const clearItem = (productId: string) => {
    setItems(prev => {
      const updated = prev.map(item => {
        if (item.product.id !== productId) return item
        return { ...item, actualStock: null, difference: 0, note: '' }
      })
      persist(updated)
      return updated
    })
  }

  const handleResetAll = () => {
    if (!confirm('Reset semua progress opname?')) return
    clearProgress()
    setItems(prev => prev.map(item => ({ ...item, actualStock: null, difference: 0, note: '' })))
    toast('Progress direset!', 'warning')
  }

  const handleSave = async () => {
    const checked = items.filter(i => i.actualStock !== null)
    if (checked.length === 0) { toast('Belum ada produk yang diinput!', 'error'); return }

    const mismatched = checked.filter(i => i.difference !== 0)
    setSaving(true)

    try {
      let failCount = 0
      for (const item of mismatched) {
        const success = await saveProduct({ ...item.product, stock: item.actualStock!, updatedAt: new Date().toISOString() })
        if (!success) failCount++
      }

      if (failCount > 0) {
        toast(`${failCount} produk gagal disimpan!`, 'error')
        setSaving(false)
        return
      }

      clearProgress()

      // Save last opname summary to settings
      const summaryData = {
        date: opnameDate,
        totalChecked: checked.length,
        matchCount: checked.filter(i => i.difference === 0).length,
        mismatchCount: mismatched.length,
        mismatchItems: mismatched.map(i => ({ name: i.product.name, sku: i.product.sku, from: i.systemStock, to: i.actualStock!, diff: i.difference })),
        savedAt: new Date().toISOString(),
      }
      try {
        const { saveSetting } = await import('@/lib/store')
        await saveSetting('last_opname', JSON.stringify(summaryData))
      } catch {}

      setSavedSummary({
        date: opnameDate,
        totalChecked: checked.length,
        matchCount: checked.filter(i => i.difference === 0).length,
        mismatchCount: mismatched.length,
        mismatchItems: mismatched.map(i => ({ name: i.product.name, sku: i.product.sku, from: i.systemStock, to: i.actualStock!, diff: i.difference })),
      })
      toast(mismatched.length > 0 ? `${mismatched.length} stok diperbarui!` : 'Semua stok sesuai!', 'success')
    } catch { toast('Gagal menyimpan!', 'error') }
    finally { setSaving(false) }
  }

  const handleExport = () => {
    const checked = items.filter(i => i.actualStock !== null)
    if (!checked.length) { toast('Belum ada data!', 'error'); return }
    const csv = ['SKU,Produk,Kategori,Sistem,Aktual,Selisih,Catatan',
      ...checked.map(i => [i.product.sku, `"${i.product.name}"`, i.product.category, i.systemStock, i.actualStock, i.difference, `"${i.note}"`].join(','))
    ].join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `opname-${opnameDate}.csv`; a.click()
    toast('CSV di-download!', 'success')
  }

  const handleNewOpname = async () => {
    setSavedSummary(null)
    const products = await fetchProducts()
    setItems(products.map(p => ({ product: p, systemStock: p.stock, actualStock: null, difference: 0, note: '' })))
  }

  // Summary view
  if (savedSummary) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#16A34A]/15 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#16A34A]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Opname Selesai!</h1>
          <p className="text-gray-500 text-sm mt-1">{savedSummary.date}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl p-4 bg-white border border-gray-200 text-center">
            <p className="text-2xl font-bold text-gray-900">{savedSummary.totalChecked}</p>
            <p className="text-[11px] text-gray-500 mt-1">Diperiksa</p>
          </div>
          <div className="rounded-xl p-4 bg-white border border-gray-200 text-center">
            <p className="text-2xl font-bold text-[#16A34A]">{savedSummary.matchCount}</p>
            <p className="text-[11px] text-gray-500 mt-1">Sesuai</p>
          </div>
          <div className="rounded-xl p-4 bg-white border border-gray-200 text-center">
            <p className="text-2xl font-bold text-[#DC2626]">{savedSummary.mismatchCount}</p>
            <p className="text-[11px] text-gray-500 mt-1">Dikoreksi</p>
          </div>
        </div>

        {savedSummary.mismatchItems.length > 0 && (
          <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-700">Stok Diperbarui</p>
            </div>
            {savedSummary.mismatchItems.map((item, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-[11px] text-gray-500">{item.sku}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{item.from}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-sm font-bold text-gray-900">{item.to}</span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${item.diff > 0 ? 'text-[#16A34A] bg-[#16A34A]/10' : 'text-[#DC2626] bg-[#DC2626]/10'}`}>
                    {item.diff > 0 ? '+' : ''}{item.diff}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={handleNewOpname} className="w-full py-3.5 rounded-xl bg-[#FF5F03] text-[#1a1a1a] font-bold text-sm hover:bg-[#FF5F03]/90 transition active:scale-[0.98] flex items-center justify-center gap-2">
          <ClipboardCheck className="w-4 h-4" />
          Mulai Opname Baru
        </button>
      </div>
    )
  }

  // Filters
  const checked = items.filter(i => i.actualStock !== null)
  const filtered = items.filter(item => {
    const matchSearch = !search || item.product.name.toLowerCase().includes(search.toLowerCase()) || item.product.sku.toLowerCase().includes(search.toLowerCase())
    if (filterStatus === 'unchecked') return matchSearch && item.actualStock === null
    if (filterStatus === 'match') return matchSearch && item.actualStock !== null && item.difference === 0
    if (filterStatus === 'mismatch') return matchSearch && item.actualStock !== null && item.difference !== 0
    return matchSearch
  })

  const totalProducts = items.length
  const checkedCount = checked.length
  const matchCount = checked.filter(i => i.difference === 0).length
  const mismatchCount = checked.filter(i => i.difference !== 0).length
  const progress = totalProducts > 0 ? Math.round((checkedCount / totalProducts) * 100) : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF5F03]/10 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-[#FF5F03]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Stok Opname</h1>
            <p className="text-[11px] text-gray-500">Input stok fisik, bandingkan dengan sistem</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={opnameDate} onChange={e => { setOpnameDate(e.target.value); saveDate(e.target.value) }}
            className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs text-white" />
          <button onClick={handleResetAll} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-[#DC2626] hover:border-red-500/30 transition" title="Reset">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={handleExport} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-white transition" title="Export CSV">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={handleSave} disabled={saving || checkedCount === 0}
            className="px-4 py-2 rounded-lg bg-[#FF5F03] text-[#1a1a1a] text-sm font-bold transition active:scale-95 disabled:opacity-40 flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 shrink-0">
          <Package className="w-3.5 h-3.5 text-[#FF5F03]" />
          <span className="text-xs text-gray-500">{checkedCount}/{totalProducts}</span>
          <div className="w-16 h-1.5 rounded-full bg-gray-50"><div className="h-full rounded-full bg-[#FF5F03] transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#16A34A]/[0.06] border border-[#16A34A]/20 shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
          <span className="text-xs font-semibold text-[#16A34A]">{matchCount} sesuai</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#DC2626]/[0.06] border border-[#DC2626]/20 shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
          <span className="text-xs font-semibold text-[#DC2626]">{mismatchCount} selisih</span>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" placeholder="Cari produk / SKU..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF5F03]/40 transition" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as FilterStatus)}
          className="px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-white appearance-none cursor-pointer pr-8"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
          <option value="all">Semua</option>
          <option value="unchecked">Belum</option>
          <option value="match">Sesuai</option>
          <option value="mismatch">Selisih</option>
        </select>
      </div>

      {/* Product list */}
      <div className="space-y-2">
        {filtered.map(item => {
          const hasInput = item.actualStock !== null
          const isMatch = hasInput && item.difference === 0
          const isMismatch = hasInput && item.difference !== 0

          return (
            <div key={item.product.id}
              className={`rounded-xl border transition-all ${
                isMismatch ? 'bg-[#DC2626]/[0.03] border-[#DC2626]/20' :
                isMatch ? 'bg-[#16A34A]/[0.03] border-[#16A34A]/20' :
                'bg-white border-gray-200'
              }`}>
              <div className="p-3.5 flex items-center gap-3">
                {/* Status indicator */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isMismatch ? 'bg-[#DC2626]/15' :
                  isMatch ? 'bg-[#16A34A]/15' :
                  'bg-[#FF5F03]/10'
                }`}>
                  {isMismatch ? (item.difference > 0 ? <ArrowUp className="w-4 h-4 text-[#DC2626]" /> : <ArrowDown className="w-4 h-4 text-[#DC2626]" />) :
                   isMatch ? <CheckCircle2 className="w-4 h-4 text-[#16A34A]" /> :
                   <Package className="w-4 h-4 text-[#FF5F03]" />}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">{item.product.name}</p>
                  <p className="text-[11px] text-gray-500">{item.product.sku} · {item.product.category}</p>
                </div>

                {/* System stock */}
                <div className="text-center shrink-0 hidden sm:block">
                  <p className="text-[10px] text-gray-400 uppercase">Sistem</p>
                  <p className="text-sm font-bold text-gray-500">{item.systemStock}</p>
                </div>

                {/* Input aktual */}
                <div className="shrink-0">
                  <input
                    type="number" min={0}
                    value={item.actualStock ?? ''}
                    onChange={e => setActual(item.product.id, e.target.value)}
                    placeholder={String(item.systemStock)}
                    className={`w-16 text-center text-sm font-bold rounded-lg px-2 py-2 border transition focus:outline-none focus:border-[#FF5F03]/50 ${
                      hasInput ? 'bg-gray-50 border-white/[0.15] text-white' : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}
                  />
                </div>

                {/* Difference badge */}
                <div className="w-12 text-center shrink-0">
                  {hasInput ? (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded inline-block ${
                      item.difference === 0 ? 'text-[#16A34A] bg-[#16A34A]/10' :
                      item.difference > 0 ? 'text-[#16A34A] bg-[#16A34A]/10' :
                      'text-[#DC2626] bg-[#DC2626]/10'
                    }`}>
                      {item.difference === 0 ? '✓' : (item.difference > 0 ? `+${item.difference}` : item.difference)}
                    </span>
                  ) : <span className="text-xs text-gray-400">—</span>}
                </div>

                {/* Quick "sesuai" button - only shows if no input yet */}
                <div className="shrink-0">
                  {!hasInput ? (
                    <button onClick={() => quickMatch(item.product.id)} title="Stok sesuai"
                      className="w-8 h-8 rounded-lg bg-[#16A34A]/10 text-[#16A34A] hover:bg-[#16A34A] hover:text-white flex items-center justify-center transition text-xs font-bold">
                      <Equal className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button onClick={() => clearItem(item.product.id)} title="Hapus input"
                      className="w-8 h-8 rounded-lg bg-gray-100/50 text-gray-500 hover:text-white hover:bg-gray-200 flex items-center justify-center transition">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Note row for mismatches */}
              {isMismatch && (
                <div className="px-3.5 pb-3.5">
                  <input type="text" value={item.note} onChange={e => setNote(item.product.id, e.target.value)}
                    placeholder="Catatan selisih..."
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF5F03]/40 transition" />
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <ClipboardCheck className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Tidak ada produk ditemukan</p>
          </div>
        )}
      </div>
    </div>
  )
}
