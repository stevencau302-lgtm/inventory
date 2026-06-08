'use client'

import { useEffect, useState, useCallback } from 'react'
import { Product, fetchProducts, saveProduct } from '@/lib/store'
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

const STORAGE_KEY = 'nexa_opname_progress'
const DATE_KEY = 'nexa_opname_date'

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

  // ===== Summary view =====
  if (savedSummary) {
    return (
      <div className="max-w-2xl mx-auto py-6 space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="bg-gradient-to-br from-[#0F4C4C] to-[#072C2C] px-6 py-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 backdrop-blur">
              <CheckCircle2 className="w-8 h-8 text-emerald-300" />
            </div>
            <h1 className="text-2xl font-bold text-white">Opname Selesai!</h1>
            <p className="text-white/60 text-sm mt-1">{savedSummary.date}</p>
          </div>
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            <div className="px-4 py-5 text-center">
              <p className="text-2xl font-bold text-gray-900">{savedSummary.totalChecked}</p>
              <p className="text-[11px] text-gray-500 mt-1">Diperiksa</p>
            </div>
            <div className="px-4 py-5 text-center">
              <p className="text-2xl font-bold text-emerald-600">{savedSummary.matchCount}</p>
              <p className="text-[11px] text-gray-500 mt-1">Sesuai</p>
            </div>
            <div className="px-4 py-5 text-center">
              <p className="text-2xl font-bold text-red-500">{savedSummary.mismatchCount}</p>
              <p className="text-[11px] text-gray-500 mt-1">Dikoreksi</p>
            </div>
          </div>
        </div>

        {savedSummary.mismatchItems.length > 0 && (
          <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#FF5F03]" />
              <p className="text-sm font-semibold text-gray-900">Stok Diperbarui</p>
            </div>
            {savedSummary.mismatchItems.map((item, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between border-b border-gray-100 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-[11px] text-gray-500 font-mono">{item.sku}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-gray-400">{item.from}</span>
                  <span className="text-gray-300">→</span>
                  <span className="text-sm font-bold text-gray-900">{item.to}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.diff > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
                    {item.diff > 0 ? '+' : ''}{item.diff}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={handleNewOpname} className="w-full py-3.5 rounded-xl bg-[#FF5F03] text-white font-bold text-sm hover:bg-[#e85503] transition active:scale-[0.98] flex items-center justify-center gap-2">
          <ClipboardCheck className="w-4 h-4" />
          Mulai Opname Baru
        </button>
      </div>
    )
  }

  // ===== Filters =====
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
  const uncheckedCount = totalProducts - checkedCount
  const progress = totalProducts > 0 ? Math.round((checkedCount / totalProducts) * 100) : 0
  const circumference = 2 * Math.PI * 15.5

  const filterTabs: { key: FilterStatus; label: string; count: number }[] = [
    { key: 'all', label: 'Semua', count: totalProducts },
    { key: 'unchecked', label: 'Belum', count: uncheckedCount },
    { key: 'match', label: 'Sesuai', count: matchCount },
    { key: 'mismatch', label: 'Selisih', count: mismatchCount },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#072C2C]/10 border border-[#072C2C]/10 flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-5 h-5 text-[#072C2C]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Stok Opname</h1>
            <p className="text-gray-500 text-xs mt-0.5">Input stok fisik, bandingkan dengan sistem</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={opnameDate} onChange={e => { setOpnameDate(e.target.value); saveDate(e.target.value) }}
            className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-600 outline-none focus:border-[#072C2C] transition" />
          <button onClick={handleResetAll} className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition flex items-center justify-center" title="Reset semua">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={handleExport} className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition flex items-center justify-center" title="Export CSV">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={handleSave} disabled={saving || checkedCount === 0}
            className="px-4 py-2 rounded-lg bg-[#FF5F03] text-white text-sm font-bold transition active:scale-95 disabled:opacity-40 hover:bg-[#e85503] flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan
          </button>
        </div>
      </div>

      {/* Progress card */}
      <div className="rounded-2xl bg-white border border-gray-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#FF5F03" strokeWidth="3.5" strokeLinecap="round"
                  strokeDasharray={`${(progress / 100) * circumference} ${circumference}`}
                  className="transition-all duration-700" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">{progress}%</div>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Progress Opname</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">
                {checkedCount}<span className="text-base font-medium text-gray-400"> / {totalProducts} produk</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <MiniStat color="emerald" icon={<CheckCircle2 className="w-3.5 h-3.5" />} value={matchCount} label="Sesuai" />
            <MiniStat color="red" icon={<AlertTriangle className="w-3.5 h-3.5" />} value={mismatchCount} label="Selisih" />
            <MiniStat color="gray" icon={<Package className="w-3.5 h-3.5" />} value={uncheckedCount} label="Belum" />
          </div>
        </div>
      </div>

      {/* Search + Filter pills */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Cari produk atau SKU..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#072C2C] transition" />
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-white border border-gray-200">
          {filterTabs.map(tab => (
            <button key={tab.key} onClick={() => setFilterStatus(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === tab.key ? 'bg-[#072C2C] text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}>
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filterStatus === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{tab.count}</span>
            </button>
          ))}
        </div>
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
                isMismatch ? 'bg-red-50/40 border-red-100' :
                isMatch ? 'bg-emerald-50/40 border-emerald-100' :
                'bg-white border-gray-200 hover:border-gray-300'
              }`}>
              <div className="p-3.5 flex items-center gap-3">
                {/* Status indicator */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isMismatch ? 'bg-red-100 text-red-500' :
                  isMatch ? 'bg-emerald-100 text-emerald-600' :
                  'bg-[#072C2C]/10 text-[#072C2C]'
                }`}>
                  {isMismatch ? (item.difference > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />) :
                   isMatch ? <CheckCircle2 className="w-4 h-4" /> :
                   <Package className="w-4 h-4" />}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">{item.product.name}</p>
                  <p className="text-[11px] text-gray-500 font-mono truncate">{item.product.sku} · {item.product.category}</p>
                </div>

                {/* System stock */}
                <div className="text-center shrink-0 hidden sm:block px-2">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Sistem</p>
                  <p className="text-sm font-bold text-gray-500">{item.systemStock}</p>
                </div>

                {/* Input aktual */}
                <div className="shrink-0 text-center">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5 hidden sm:block">Fisik</p>
                  <input
                    type="number" min={0}
                    value={item.actualStock ?? ''}
                    onChange={e => setActual(item.product.id, e.target.value)}
                    placeholder={String(item.systemStock)}
                    className={`w-16 text-center text-sm font-bold rounded-lg px-2 py-1.5 border transition focus:outline-none focus:border-[#FF5F03] ${
                      hasInput ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}
                  />
                </div>

                {/* Difference badge */}
                <div className="w-12 text-center shrink-0">
                  {hasInput ? (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full inline-block ${
                      item.difference === 0 ? 'text-emerald-600 bg-emerald-50' :
                      item.difference > 0 ? 'text-emerald-600 bg-emerald-50' :
                      'text-red-500 bg-red-50'
                    }`}>
                      {item.difference === 0 ? '✓' : (item.difference > 0 ? `+${item.difference}` : item.difference)}
                    </span>
                  ) : <span className="text-xs text-gray-300">—</span>}
                </div>

                {/* Quick action */}
                <div className="shrink-0">
                  {!hasInput ? (
                    <button onClick={() => quickMatch(item.product.id)} title="Tandai sesuai"
                      className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition">
                      <Equal className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button onClick={() => clearItem(item.product.id)} title="Hapus input"
                      className="w-8 h-8 rounded-lg bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 flex items-center justify-center transition">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Note row for mismatches */}
              {isMismatch && (
                <div className="px-3.5 pb-3.5">
                  <input type="text" value={item.note} onChange={e => setNote(item.product.id, e.target.value)}
                    placeholder="Catatan selisih (opsional)..."
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FF5F03] transition" />
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16 rounded-2xl border border-dashed border-gray-200 bg-white">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <ClipboardCheck className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-600">Tidak ada produk ditemukan</p>
            <p className="text-xs text-gray-400 mt-1">Coba ubah kata kunci atau filter</p>
          </div>
        )}
      </div>
    </div>
  )
}

function MiniStat({ color, icon, value, label }: { color: 'emerald' | 'red' | 'gray'; icon: React.ReactNode; value: number; label: string }) {
  const styles = {
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-500',
    gray: 'bg-gray-50 text-gray-500',
  }[color]
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${styles}`}>
      {icon}
      <div className="leading-tight">
        <p className="text-sm font-bold">{value}</p>
        <p className="text-[10px] opacity-70 -mt-0.5">{label}</p>
      </div>
    </div>
  )
}
