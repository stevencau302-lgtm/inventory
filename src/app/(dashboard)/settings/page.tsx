'use client'

import { useEffect, useState } from 'react'
import { fetchProducts, fetchCategories, fetchTransactions, deleteProduct, deleteCategory, deleteTransaction } from '@/lib/store'
import { useToast } from '@/components/Toast'
import DeleteModal from '@/components/DeleteModal'

export default function SettingsPage() {
  const [productCount, setProductCount] = useState(0)
  const [catCount, setCatCount] = useState(0)
  const [txCount, setTxCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [resetModal, setResetModal] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function loadCounts() {
      const p = await fetchProducts()
      const c = await fetchCategories()
      const t = await fetchTransactions()
      setProductCount(p.length)
      setCatCount(c.length)
      setTxCount(t.length)
      setMounted(true)
    }
    loadCounts()
  }, [])

  if (!mounted) return null

  const handleReset = () => {
    setResetModal(true)
  }

  const confirmReset = async () => {
    setResetModal(false)
    
    // Delete all products from Supabase
    const products = await fetchProducts()
    for (const p of products) {
      await deleteProduct(p.id)
    }

    // Delete all categories from Supabase
    const categories = await fetchCategories()
    for (const c of categories) {
      await deleteCategory(c.id)
    }

    // Delete all transactions from Supabase
    const transactions = await fetchTransactions()
    for (const t of transactions) {
      await deleteTransaction(t.id)
    }


    setProductCount(0)
    setCatCount(0)
    setTxCount(0)
    toast('Semua data berhasil direset!', 'warning')
  }

  const handleLoadSample = async () => {
    const { loadSampleDataAsync } = await import('@/lib/store')
    const data = await loadSampleDataAsync()
    setProductCount(data.products.length)
    setCatCount(data.categories.length)
    toast('Data contoh berhasil dimuat!', 'success')
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
          <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Pengaturan</h1>
          <p className="text-gray-500 text-sm mt-0.5">Kelola preferensi & data aplikasi</p>
        </div>
      </div>

      {/* Appearance */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#072C2C]/15 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#072C2C]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
          </div>
          <h2 className="text-sm font-semibold text-white">Tampilan</h2>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Dark Mode</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Aplikasi ini dioptimasi untuk mode gelap</p>
            </div>
            {/* Toggle - always on (dark only app) */}
            <div className="relative">
              <div className="w-11 h-6 rounded-full bg-[#072C2C] shadow-inner shadow-indigo-900/50">
                <div className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center">
                  <svg className="w-3 h-3 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
                </div>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-3 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
            UI dirancang khusus untuk dark mode — tidak tersedia light mode
          </p>
        </div>
      </div>

      {/* Data Management */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#16A34A]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Data Aplikasi</h2>
            <p className="text-[10px] text-gray-500">{productCount} produk &middot; {catCount} kategori &middot; {txCount} transaksi</p>
          </div>
        </div>
        <div className="divide-y divide-white/[0.06]">
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Load Data Contoh</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Isi dengan 15 produk dan 6 kategori demo</p>
            </div>
            <button onClick={handleLoadSample} className="px-4 py-2 rounded-lg bg-[#072C2C]/15 text-[#072C2C] text-xs font-bold hover:bg-[#072C2C] hover:text-white transition-all active:scale-95">
              Load Sample
            </button>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Reset Semua Data</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Hapus semua produk, kategori & transaksi dari database</p>
            </div>
            <button onClick={handleReset} className="px-4 py-2 rounded-lg bg-red-50 text-[#DC2626] text-xs font-bold hover:bg-[#DC2626] hover:text-white transition-all active:scale-95">
              Reset All
            </button>
          </div>
        </div>
      </div>

      {/* WhatsApp Notification (Fonnte) */}
      <WhatsAppSettings />

      {/* About */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-white">Tentang</h2>
        </div>
        <div className="space-y-2.5 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold">Nexo Inventory</span>
            <span className="px-1.5 py-0.5 rounded bg-[#072C2C]/15 text-[#072C2C] text-[10px] font-bold">v1.0.0</span>
          </div>
          <p>Next.js 14 &middot; Tailwind CSS &middot; TypeScript &middot; Supabase</p>
          <p className="text-gray-500 text-xs">Data tersimpan di Supabase (cloud PostgreSQL)</p>
        </div>
      </div>

      <DeleteModal
        isOpen={resetModal}
        title="Reset Semua Data?"
        message="Hapus SEMUA data (produk, kategori, transaksi) dari database? Aksi ini tidak bisa dibatalkan."
        confirmLabel="Reset"
        icon="warning"
        onConfirm={confirmReset}
        onCancel={() => setResetModal(false)}
      />
    </div>
  )
}



/* ─── WhatsApp Settings Component ─── */
function WhatsAppSettings() {
  const [fonntToken, setFonntToken] = useState('')
  const [targets, setTargets] = useState('')
  const [schedule, setSchedule] = useState('20:00')
  const [sending, setSending] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      if (data.fonnte_token) setFonntToken(data.fonnte_token)
      if (data.fonnte_target) setTargets(data.fonnte_target)
      if (data.fonnte_schedule) setSchedule(data.fonnte_schedule)
      setLoaded(true)
      setSaved(!!data.fonnte_token)
    }).catch(() => setLoaded(true))
  }, [])

  const markChanged = () => { setHasChanges(true); setSaved(false) }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fonnte_token: fonntToken, fonnte_target: targets, fonnte_schedule: schedule }),
      })
      if (res.ok) { setSaved(true); setHasChanges(false); toast('Konfigurasi tersimpan!', 'success') }
      else toast('Gagal menyimpan', 'error')
    } catch { toast('Gagal menyimpan', 'error') }
    finally { setSaving(false) }
  }

  const handleTestSend = async () => {
    if (!fonntToken || !targets) {
      toast('Isi Token & Target terlebih dahulu', 'error')
      return
    }
    setSending(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/daily-report/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: fonntToken, target: targets }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setTestResult('success')
        toast('Laporan dikirim!', 'success')
      } else {
        setTestResult('error')
        toast(data.error || 'Gagal', 'error')
      }
    } catch { setTestResult('error'); toast('Gagal mengirim', 'error') }
    finally { setSending(false) }
  }

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm bg-gray-50 border border-gray-200 text-white placeholder-white/20 outline-none focus:border-green-500/50 focus:bg-black/60 transition-all"

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20 flex items-center justify-center">
            <svg className="w-4.5 h-4.5 text-green-400" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Notifikasi WhatsApp</h2>
            <p className="text-[10px] text-gray-500">Laporan harian otomatis via Fonnte</p>
          </div>
        </div>
        {/* Status badge */}
        {saved && !hasChanges && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-bold text-green-400">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            Tersimpan
          </span>
        )}
        {hasChanges && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-500/20 text-[10px] font-bold text-[#D97706]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Belum disimpan
          </span>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Token */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
            API Token
          </label>
          <input
            type="password"
            value={fonntToken}
            onChange={e => { setFonntToken(e.target.value); markChanged() }}
            className={inputClass}
            placeholder="Paste token dari dashboard fonnte.com"
          />
        </div>

        {/* Personal Target */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <span className="text-sm">👤</span>
            Nomor Personal
          </label>
          <input
            type="text"
            value={targets.split(',').filter(t => t.trim() && !t.trim().includes('@g.us')).join(', ')}
            onChange={e => {
              const grupPart = targets.split(',').filter(t => t.trim().includes('@g.us')).join(',')
              const newPersonal = e.target.value
              const combined = [newPersonal, grupPart].filter(Boolean).join(',')
              setTargets(combined)
              markChanged()
            }}
            className={inputClass}
            placeholder="628xxxxxxxxxx"
          />
          <p className="text-[10px] text-gray-400">Format: 628xxx (tanpa + atau 0). Pisahkan dengan koma jika lebih dari satu.</p>
        </div>

        {/* Group Target */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <span className="text-sm">👥</span>
            ID Grup WhatsApp
          </label>
          <input
            type="text"
            value={targets.split(',').filter(t => t.trim().includes('@g.us')).join(', ')}
            onChange={e => {
              const personalPart = targets.split(',').filter(t => t.trim() && !t.trim().includes('@g.us')).join(',')
              const newGroup = e.target.value
              const combined = [personalPart, newGroup].filter(Boolean).join(',')
              setTargets(combined)
              markChanged()
            }}
            className={inputClass}
            placeholder="120363xxxxx@g.us"
          />
          <p className="text-[10px] text-gray-400">Ambil dari Fonnte Dashboard → Device → Group. Format: <code className="text-blue-400/70">120363xxx@g.us</code></p>
        </div>

        {/* Target preview badges */}
        {targets.split(',').filter(t => t.trim()).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {targets.split(',').filter(t => t.trim()).map((t, i) => (
              <span key={i} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold ${
                t.trim().includes('@g.us') ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
              }`}>
                {t.trim().includes('@g.us') ? '👥 Grup' : '👤 Personal'}: {t.trim().length > 18 ? t.trim().slice(0, 18) + '...' : t.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Schedule */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Jam Kirim Harian (WIB)
          </label>
          <input
            type="time"
            value={schedule}
            onChange={e => { setSchedule(e.target.value); markChanged() }}
            className={inputClass}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-3">
          {hasChanges ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-3 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-400 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-green-500/20"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2"><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Simpan Perubahan
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={handleTestSend}
              disabled={sending || !fonntToken || !targets}
              className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-100 hover:border-green-500/30 transition-all active:scale-[0.98] disabled:opacity-40"
            >
              {sending ? (
                <span className="flex items-center justify-center gap-2"><span className="w-3 h-3 border-2 border-zinc-400/30 border-t-zinc-400 rounded-full animate-spin" /> Mengirim...</span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                  Test Kirim Sekarang
                </span>
              )}
            </button>
          )}
        </div>

        {/* Test result */}
        {testResult && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-medium ${
            testResult === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-50 border border-red-500/20 text-[#DC2626]'
          }`}>
            {testResult === 'success' ? (
              <><svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Laporan berhasil dikirim ke semua target!</>
            ) : (
              <><svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg> Gagal mengirim. Cek token & target WA.</>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
